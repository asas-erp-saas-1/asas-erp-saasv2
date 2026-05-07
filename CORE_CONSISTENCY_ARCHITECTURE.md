⚙️ TRANSACTION ARCHITECTURE

TRANSACTION FLOW

1. Deal Transition (State Change)
- Atomic Operations: Validate transition via State Machine -> Update Deal State -> Record Audit Log -> Execute Triggers (e.g., conditionally generate Commission if 'closed').
- DB Writes (Single Transaction): `UPDATE deals`, `INSERT audit_logs`, `INSERT agent_commissions` (conditional).
- Rollback Strategy: Standard DB transaction. If the state machine throws `BusinessRuleError`, or commission math fails, the entire block rolls back. Deal remains in the previous state.

2. Payment Registration
- Atomic Operations: Insert Payment Record -> Update Deal Aggregates -> Record Audit Log.
- DB Writes: `INSERT deal_payments`, `UPDATE deals (total_payments_received += amount)`, `INSERT audit_logs`.
- Rollback Strategy: Kernel database transaction. Failure to update the aggregate rolls back the payment insertion to prevent orphaned ledger entries.

3. Commission Calculation
- Atomic Operations: Retrieve baseline deal metrics -> Math calculation -> Insert Commission Record -> Flag deal as commission-generated.
- DB Writes: `INSERT agent_commissions`, `UPDATE deals (commission_generated = true)`.
- Rollback Strategy: Abort if `deals.commission_generated` is already true or missing agreed_amount. Transaction rollback.

4. Lead Conversion
- Atomic Operations: Update Lead Status -> Create corresponding Deal -> Link Client -> Record Audit Log.
- DB Writes: `UPDATE leads`, `INSERT deals`, `INSERT audit_logs`.
- Rollback Strategy: If deal insertion violates schema limits or fails to link the client, the lead remains in its pre-conversion state (e.g., 'negotiating').

TRANSACTION OWNERSHIP & FAILURE RECOVERY
- Ownership: Strict execution via a dedicated "Kernel Transaction Coordinator" (wrapping database-level atomic blocks or RPC functions). Domain services initiate requests, but the DB strictly executes atomic boundaries. 
- Recovery: Failed transations emit a `TransactionFailed` application metric and return safe payload error to UI for user instruction.

---

🔄 CONCURRENCY MODEL

Optimistic Locking applies universally to prevent Lost Update anomalies.

1. Deals
- Lock Type: `version` field (Optimistic Locking).
- Conflict Detection: `UPDATE deals ... WHERE id = $1 AND version = $current_version`. If no rows affected, reject with `ConflictResolutionError`.
- Retry Logic: Return 409 Conflict. Application alerts user: "This deal was modified by another agent. Refreshing localized state."

2. Leads
- Lock Type: `version` field.
- Conflict Detection: Identical to Deals. Particularly essential for simultaneous Kanban board movements from multiple agents in the same tenant.

3. Payments
- Lock Type: Immutable ledgers. Payments are insert-only. Target aggregate tables (e.g. deals) use Delta Updates rather than absolute `UPDATE ... SET x = y`. (e.g., `total_payments_received = total_payments_received + new_amount`).
- State mutation on payment (pending -> succeeded) uses optimistic lock `WHERE id = $id AND status = 'pending'`.

4. Tasks
- Lock Type: `version` field.
- Conflict Detection: Block overrides of `status` changes from simultaneous workers.

---

🧾 AUDIT SYSTEM

Every critical mutation routes through an Append-Only Audit Trail.

Audit Table Structure (`audit_logs`):
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Strict row-level isolation)
- `actor_id`: UUID (The user performing the mutation)
- `entity_type`: VARCHAR (e.g., 'deal', 'lead', 'payment')
- `entity_id`: UUID (Target resource)
- `action`: VARCHAR (e.g., 'STATUS_TRANSITION', 'PAYMENT_REGISTERED', 'REASSIGNMENT')
- `old_state`: JSONB (Resource before mutation)
- `new_state`: JSONB (Resource after mutation)
- `created_at`: TIMESTAMPTZ (Database time)

Immutable Guarantee:
- RLS Policy explicitly forbids `UPDATE` and `DELETE` on `audit_logs` globally. Only `INSERT` and `SELECT` are allowed.

---

📡 EVENT ARCHITECTURE

Employs the Outbox Pattern to guarantee Domain Event Consistency.

Event Publishing:
- Rather than pushing events directly to a broker mid-request, transactions `INSERT` into an `outbox_events` table within the same DB transaction. A background chron/worker tails this table and dispatches.

Event Naming Convention:
- `LeadConverted`
- `DealStatusChanged`
- `PaymentRegistered`
- `CommissionCalculated`

Event Consumer Architecture:
- Consumers pull from outbox/queue.
- Idempotency Rules: Every consumer maintains a `processed_events` table (`tenant_id`, `event_id`, `consumer_name`). Before executing side-effects, it attempts to `INSERT`. A unique constraint violation gracefully aborts the execution (duplicate event). 
- Retry Strategy: 3 retries (Immediate, +5m, +1h).
- Dead-Letter Handling: Upon exhausting retries, moved to `dead_letter_events` for manual engineering triage.

---

🧠 SINGLE SOURCE OF TRUTH

1. Database Layer (The Absolute Truth)
- The PostgreSQL relations and tables serve as the definitive SSOT.
- DB-level constraints (Foreign Keys, ENUMs) enforce truth at the lowest level.

2. Aggregate Truth (Derived Truth)
- `total_payments_received` or `vw_deal_pipeline` are DERIVED truths. They are strictly calculated mechanically through database triggers linking them to the ledger. They cannot be edited dynamically via typical ORM assignments. 

3. UI Synchronization Model (The Reflected Truth)
- The React Frontend treats its state as a highly volatile projection.
- Supabase Realtime subscriptions stream DB changes to keep UI projection aligned. If a WebSocket disconnects, a forced XHR re-fetch is invoked to re-sync with Postgres Truth. 

---

🚨 REMAINING CORRUPTION RISKS

1. Simulated Transaction Boundaries (REST API Constraints)
- Supabase JS client issues multiple REST requests over `HTTP`. True ACID transactions require SQL Functions (RPC) block boundaries. If the application uses procedural JS for atomic ops, failure mid-execution creates orphans. *Mitigation required: Shift multi-table atomic workflows to internal PostgreSQL RPCs or Supabase Edge Functions with `begin/.../commit`.*

2. Clock Drift
- If `created_at` or `updated_at` timestamps are generated by the Client Node (`new Date().toISOString()`), clock drift will corrupt temporal ordering. *Fix applies: Timestamp generation must be delegated exclusively to the DB (`DEFAULT NOW()`)*.

3. Distributed Cache Invalidation Flaws
- Inconsistent cache clears in `AdaptiveCache` / Redis layer can result in stale UI data bypassing new RBAC rules. *Fix applies: Strictly couple Cache invaldation (`CacheService.invalidate`) to the Outbox Event Processor, not the web request cycle.*
