# EXECUTION CONTRACTS & RUNTIME ENGINEERING

## SECTION 1 — SYSTEM EXECUTION PHILOSOPHY

The ASAS ERP operates under strict execution laws designed for financial integrity, high concurrency, and distributed resilience.

- **State Authority**: State is authoritative ONLY in PostgreSQL. Memory, caches, and frontend states are volatile projections.
- **Frontend Optimism**: Frontend optimism is temporary and reversible. The UI must immediately rollback to the last known authoritative state if an execution contract fails.
- **Command-Driven Mutation**: Every mutation is initiated via a strongly-typed Command. Implicit state changes are forbidden.
- **Immutable History**: Events are immutable historical facts. Once an event is appended to the Outbox, it cannot be altered, only compensated by a subsequent event.
- **Zero Trust**: Services NEVER trust UI payloads. All commands undergo strict parameter validation and contextual sanitization at the edge.
- **Invariant Supremacy**: Runtime invariants override UX convenience. A multi-step transaction failing its final invariant will drop the request despite user frustration.
- **Explicit Consistency**: Cross-domain consistency is orchestrated (Sagas/Outbox), never implicit (shared database updates).
- **Resumability**: Every workflow must be resumable after a worker crash or infrastructural timeout. 
- **Idempotent Side-Effects**: Every external side effect (e.g., Stripe, Twilio) must be replay-safe utilizing idempotency keys.
- **Universal Traceability**: Every action must be traceable via a unified `trace_id` propagated across the entire stack.

### Commit Laws
- Authority Hierarchy: `PostgreSQL (Source of truth)` > `Redis (View Projection)` > `Supabase Realtime (Delta Channel)` > `Browser Client (Volatile Replica)`.
- Crash Recovery Philosophy: Workers assume they have crashed mid-execution. Every workflow resumes by checking the remote state boundaries before committing its side effect.

---

## SECTION 2 — EXECUTION CONTRACTS

### FRONTEND ↔ API
- **Input Contract**: Every mutation MUST submit a Command DTO wrapping: `command_id` (UUIDv7), `trace_id` (UUIDv4), `entity_version` (Integer), `tenant_id` (UUID).
- **Failure Semantics**: 400 Bad Request mapped to BusinessRuleError. 409 Conflict mapped to OptimisticLockError. 5xx mapped to InfrastructureError.
- **Retry Semantics**: Idempotent network layer retries allowed up to 3 times for 5xx. DO NOT retry 4xx.
- **Rollback Expectations**: UI must cache `previous_state` prior to mutation and apply it immediately upon any non-200 HTTP response.

### API ↔ KERNEL
- **Input Contract**: Sanitized Command DTO + JWT Identity extraction.
- **Validation Gates**: Kernel MUST validate RBAC role, tenant isolation scope, and rate limit budgets.
- **Failure Semantics**: Kernel immediately throws `ExecutionRejectedException` breaking the chain.

### KERNEL ↔ STATE MACHINES
- **Input Contract**: Aggregated entity state + Command payload.
- **Allowed Side Effects**: NONE. Pure functions computing `next_state` and `domain_events`.
- **Forbidden Side Effects**: No database reads/writes, no external API calls, no random number generation.

### STATE MACHINES ↔ DATABASE
- **Input Contract**: `next_state` payload + array of `domain_events`.
- **Transaction Boundaries**: Wrapped completely within an atomic Postgres RPC function: `begin -> execute -> commit`. Multi-table writes forbidden outside RPC boundaries.
- **Idempotency Rules**: Optimistic Lock `version` is checked during RPC `UPDATE`. Fails if mismatch.

### DATABASE ↔ OUTBOX
- **Input Contract**: `domain_events` strictly appended alongside the state mutation in the same database transaction.
- **Output Contract**: Events stored in `outbox_events` with status `pending`.

### OUTBOX ↔ WORKERS
- **Input Contract**: QStash pulls batches from `outbox_events` and invokes the Worker API.
- **Timeout Contracts**: Workers MUST execute within 30 seconds.
- **Retry Semantics**: QStash attempts: Immediate, 5m, 1h, 12h. Then drops to DLQ.

### WORKERS ↔ EXTERNAL PROVIDERS
- **Input Contract**: Translates Domain Event into Provider Payload.
- **Idempotency Rules**: MUST inject `event_id` or `trace_id` into the Provider's `Idempotency-Key` header.
- **Failure Semantics**: Translates rate-limits (429) to explicit "Queue Delay" states. Translates hard failures (400) to `DeadLetterEvent`.

### REALTIME ↔ UI
- **Input Contract**: Tiny delta pings broadcasted over Supabase channels: `{ entity: string, id: string, version: number }`.
- **Forbidden Side Effects**: Complete payloads are NEVER broadcast. The UI must fetch via HTTP passing the entity ID.

---

## SECTION 3 — DTO & PAYLOAD ENGINEERING

### DTO Standardization

**1. Command DTO Structure**
```json
{
  "command_id": "018f2a1b-7c... (UUIDv7)",
  "trace_id": "uuid-v4",
  "tenant_id": "uuid-v4",
  "actor_id": "uuid-v4",
  "aggregate_type": "deal",
  "aggregate_id": "uuid-v4",
  "expected_version": 4,
  "payload": { "agreed_price": 450000 },
  "metadata": { "client_ip": "1.2.3.4", "user_agent": "..." },
  "created_at": "ISO-8601"
}
```

**2. Event DTO Structure**
```json
{
  "event_id": "018f2a1b-7c... (UUIDv7)",
  "event_type": "Sales.Deal.PriceNegotiated",
  "aggregate_type": "deal",
  "aggregate_id": "uuid-v4",
  "tenant_id": "uuid-v4",
  "causation_id": "command_id-that-caused-this",
  "correlation_id": "trace_id",
  "payload": { "previous_price": 500000, "new_price": 450000 },
  "occurred_at": "ISO-8601",
  "schema_version": 1
}
```

### Constraints & Evolution
- **Versioning Policies**: `schema_version` must be incremented on payload property mutations.
- **Backward Compatibility**: Deleting existing properties is strictly forbidden. Deprecate and append new properties.
- **JSONB Limitations**: Nested payload depth MUST NOT exceed 3 levels. Maximum payload size capped at 64KB to prevent worker memory exhaustion.
- **Naming Conventions**: Domain.Aggregate.Action (Past tense verbs).

---

## SECTION 4 — COMMAND EXECUTION ENGINE

### Execution Lifecycle
1. **User Click**: UI transitions to optimistic state locking user actions.
2. **API Request**: Request hits API Gateway.
3. **Kernel Validation**: Verifies auth, tenant scope, and payload validation.
4. **State Machine Validation**: Validates transition logic in-memory.
5. **RPC Transaction**: Mutates state via DB RPC locking the entity version.
6. **Outbox Append**: Commits generated events in the same atomic block.
7. **Commit**: DB transaction succeeds, API responds 200 OK.
8. **Realtime Broadcast**: Supabase `pg_notify` fires invalidation signal.
9. **Worker Side Effects**: Outbox dispatcher routes events to execution queue.

### Status Tracking & Storage
Commands tracked in `command_executions`.
Statuses: `pending` → `validating` → `executing` → `committed` || `failed` || `compensating`.

### Anti-Race Mechanics
- **Optimistic Locking**: Every command evaluates `expected_version` against DB `version`. 
- **Duplicate Submission**: Application-level dedup: Gateway checks Redis for `command_id` existence within the last 5 seconds (Cache TTL). Reject duplicates immediately.

---

## SECTION 5 — EVENT ENGINEERING & IDEMPOTENCY

### Outbox Architecture & At-Least-Once Delivery
- Events are persisted inside the transaction bound to the mutation.
- Delivery relies on Polling/Webhook triggers to move rows from `outbox_events` to processing queues.

### Exactly-Once Illusion (Consumer Deduplication)
- Table `processed_events`:
  - `event_id` (UUID Primary Key)
  - `processed_at` (TIMESTAMP)
  - `worker_name` (VARCHAR)
  - `checksum` (VARCHAR)
- Every worker BEGINS its transaction by: `INSERT INTO processed_events (event_id, worker_name) VALUES (...);`.
- If the constraint fails (Unique Violation), the event is recognized as processed, and the worker terminates gracefully, returning 200 to acknowledge the queue.

### Expiration & Dead-Letter Constraints
- Events failing processing 4 times are moved to `dead_letter_events`.
- Rehydration tooling allows authorized operators to bulk-re-queue DLQ events via a separate admin API.

---

## SECTION 6 — RUNTIME FAILURE ENGINEERING

### Detection & Recovery Matrix

| Failure Mode | Detection Mechanism | Runtime Behavior | Recovery Strategy / Compensation |
| :--- | :--- | :--- | :--- |
| **Partial TX Failure** | PG Throw/Abort | HTTP 500 error, DB automatic ROLLBACK | Optimistic UI reverts immediately via catch block |
| **Realtime Desync** | Client heartbeat miss | UI flags websocket "Connecting" | Switch to 10s HTTP polling fallback until WS restores |
| **Redis Outage** | Connection refusal | Skip cache -> direct DB queries | Fail-open rate limiting, heavy queries disabled |
| **Worker Duplication**| QStash double-fire | `processed_events` constraint violation | Graceful discard, prevents duplicated emails/charges |
| **Multi-tab Race** | `expected_version` tracking| 409 Conflict thrown by RPC | Re-fetch state and force user merge/override choice |
| **External API Down** | 503 Timeout from Stripe | HTTP timeout after 1000ms | Worker schedules exponential backoff queue delayed 5m |

### Kill-Switch Architecture
- Global Feature Flags stored in Postgres (cached in memory).
- `ENABLE_PAYMENT_GATEWAY = false` dynamically disables Stripe execution and routes checkout attempts to an "Offline Maintenance" fallback screen instantly. 

---

## SECTION 7 — CACHE & CONSISTENCY ENGINEERING

### Redis Contracts
- **SWR Policy**: `stale-while-revalidate`. Cache returns stale data instantly while triggering a background DB refresh to update the key.
- **Cache Ownership**: The `AdaptiveCache` module strictly governs Redis structures. No other module handles direct `.set/.get` execution.

### Cache TTL Hierarchy
- Temporary Query Results (e.g., active searches): 60 seconds.
- Tenant Configuration / Feature Flags: 10 minutes.
- Dashboard Projections / Analytics: 15 minutes to 1 hour.

### Invalidation
- **Forbidden Pattern**: "Guessing" cache keys in CRUD actions.
- **Allowed Pattern**: Domain Events processed by `CacheInvalidationWorker` trigger precise Redis `DEL` instructions ensuring cross-node consistency.
- **Realtime Invalidation**: Upon invalidation broadcast, connected clients proactively expire local React Query cache.

---

## SECTION 8 — REALTIME EXECUTION ENGINE

### UI Synchronization Laws
- **Optimistic Updates**: Action cards transition instantly visual state.
- **Rollback Behavior**: If the API call fails or times out (5s), visual state violently snaps back to the original payload, showing an `ExecutionOverlay` error.
- **Concurrent Conflict Resolution**: If a Realtime Ping updates an entity *while* a user is editing a form, block the submit button and show: "This entity was modified by another user. Reload required."

### Throttling & Protection
- Payload minimization guarantees standard Pings are under 256 bytes.
- Websocket flood protection caps active inbound messages using debounce windows. Client receives max 1 ping per aggregate per 500ms.

---

## 9. DATABASE TRANSACTION ENGINEERING

### Locking Semantics
- **Optimistic Concurrency**: Default for operational entities (Deals, Leads, Contacts). 
- **Pessimistic Locking (`SELECT FOR UPDATE`)**: Reserved STRICTLY for Financial Balance ledgers and Property Reservations blocking concurrent allocation.
- **Ledger Immutability**: `deal_payments`, `commissions`, and `audit_logs` are strictly `APPEND ONLY`. Update instructions return SQL permission errors.

### Transactio Patterns
- **RPC Execution Contracts**: Multi-table bounds handled in PL/pgSQL to avoid round-trip latency and broken TCP connections causing split brains.
- **Long-Running Prevention**: Statement timeout explicitly configured at 5,000ms. Unindexed massive updates crash gracefully to preserve database connection pools.
- **Savepoints**: Forbidden within daily CRUD APIs to prevent nested transaction deadlock exhaustion.

---

## 10. SECURITY EXECUTION MODEL

### Auth Validation Runtime
- Token validity (JWT signature) resolved at the Edge (Next.js Middleware).
- Token content (`tenant_id`, `sub`, `role`) injected securely into execution headers.

### Isolation & Privilege
- **Horizontal Tenant Escape Prevention**: The `tenant_id` binding is forced dynamically inside the DB context `current_setting(...)`. A developer explicitly injecting a foreign tenant ID via client-side API payload cannot bypass the database boundary check filtering their execution context.
- **Privilege Escalation**: Roles are strictly verified by querying verified Identity tables. Tokens do NOT store mutable administrative roles without cross-checking the actual `profiles` configuration inside the Kernel layer.

### Immutability
- Security and access logs (`auth_logs`, `audit_logs`) are write-only. Attempting to `UPDATE` them results in severe alarms and an outright block.

---

## 11. OBSERVABILITY & TRACE ENGINEERING

### Trace Propagation Laws
Every API request hitting the Boundary MUST generate or receive a `trace_id` (UUIDv4).
This explicit context flows downward to sub-routines, RPC functions, and is appended to all Log entries and Domain Events.

### Mandatory Log Structure
```json
{
  "trace_id": "8bbbb9df-9...",
  "tenant_id": "uuid-v4",
  "actor_id": "uuid-v4",
  "command_id": "optional-uuid",
  "event_id": "uuid-v4",
  "service": "payment-worker",
  "severity": "ERROR",
  "timestamp": "2026-05-07T14:00:00Z",
  "message": "Payment verification failed"
}
```

### SLI thresholds & Budgets
- Target P95 Latency for Read operations: `< 150ms`.
- Target P95 Latency for Mutate operations: `< 500ms`.
- Queue Lag Alert Threshold: Processing exceeds `120s` from event generation.

---

## 12. FRONTEND EXECUTION LAWS

### Command-First Control
- The UI MUST NOT present raw "List" views as the default action plane. The primary agent interface is an Action Feed displaying "What is Next?".
- When an Agent executes a command on an Action Card, an **Execution Overlay** locks the interaction area to prevent double-clicks triggering unintentional redundant submissions.

### Stale Query Handling
- Multi-Tab Coordination: Realtime broadcasts trigger invalidation across all open tabs originating from the same Session via `BroadcastChannel` APIs locally or standard WebSocket context sharing.

---

## 13. RUNTIME INFRASTRUCTURE POLICIES

### Severless Execution Limits
- Vercel Edge API operations must return within `10s`.
- QStash Worker execution cap limits function runtime to `30s`. Beyond `30s`, QStash intercepts a Timeout limit and schedules the Retry behavior automatically.

### Scaling & Cold Starts
- **Postgres Connections**: Serverless platforms overwhelm DB connection limits instantly under scale. A strict intermediary (PgBouncer) is a mandatory architectural prerequisite. Session mode routing handles Vercel Node runtimes.
- **Zero-Downtime DB Strategy**: Utilizing the Expand-Contract pattern. Changes add columns conditionally. Deprecated columns remain for 1 release cycle preventing running client applications from breaking upon deploy. 

---

## 14. EXECUTION ANTI-PATTERNS

### ABSOLUTELY FORBIDDEN

1. **Cross-Domain Joins**
   - *Why*: Tightly couples micro-domains at the DB level, preventing independent scaling and complicating schema migrations.
   - *Fix*: Use Domain Events to update local Read Projections for cross-domain data needs.
2. **Direct DB Writes Bypassing Kernel**
   - *Why*: Ruins audit trails, circumvents RBAC validation, and corrupts Multi-Tenant lines. 
   - *Detection*: Automated ESLint/AST review prohibiting imports of `supabase` directly inside `app/` unless via `kernel Core`.
3. **Side Effects Inside State Machines**
   - *Why*: Plunges pure validation into network unreliability resulting in partial, un-saveable states if an Email API timeouts.
   - *Fix*: State Machines output arrays of Events. The Caller manages the persistence and dispatch Outbox.
4. **Fire-And-Forget Async Mutations**
   - *Why*: Node.js `void asyncFunction()` without await leads to Unhandled Promise Rejections and silent data corruption mid-crash. 
   - *Limit*: Ensure all orchestrations use QStash / Message Queues for disjointed async logic.
5. **Mutable Event Payloads**
   - *Why*: Altering an Event DTO after creation destroys Event Sourcing replayability. Once constructed, the memory blob is sealed before pushing to JSONB.
6. **Shared Mutable Caches**
   - *Why*: Overwriting arrays in Redis sequentially leads to race conditions. Cache entire results per specific query rather than trying to construct lists manually in-memory node-by-node.
7. **UI Assuming Success Before Commit**
   - *Why*: Leads to phantom state where users think a deal is closed, but it failed Validation.
   - *Fix*: Deep optimistic rollback handling is mandatory on ALL mutations.
8. **Runtime Hidden Retries**
   - *Why*: Retrying HTTP POST calls without explicit Command IDs multiplies charges/actions.
   - *Fix*: Require Idempotency-Keys on all mutative requests.

---

## 15. FINAL EXECUTION READINESS AUDIT

**THE SYSTEM IS NOT PRODUCTION READY UNLESS:**

- [ ] All commands evaluate versions and are replay-safe to duplicate API bursts.
- [ ] All orchestrations and Outbox events can resume if a Kubernetes pod/Vercel instance burns mid-flight.
- [ ] All domain boundary crossovers strictly operate through Events rather than table-to-table explicit code jumps.
- [ ] All critical multi-table transactions execute inside a bounded PL/pgSQL block or a robust transaction wrapper that cannot partially commit.
- [ ] All websocket failures default to degrading the web client into passive HTTP polling and blocking optimistic multi-edit commands.
- [ ] All high-intensity dashboard endpoints run against a cached projection, materialized view, or replicated Read-Replica, preventing master DB locks.
- [ ] All workers tolerate duplication via strict handling of the `processed_events` table.
- [ ] All external API actions (WhatsApp, Stripe, Twilio) utilize explicit transaction ID keys to prevent punishing clients with multi-layered duplicate bills/messages.
- [ ] All external side effects tolerate network timeouts and accurately schedule a retry logic pass.
- [ ] All mutations are completely auditable back to a specific `command_id` and `trace_id`.
