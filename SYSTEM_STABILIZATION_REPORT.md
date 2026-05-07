🔥 SYSTEM STABILIZATION REPORT

1. STATE MACHINE RECOVERY
- Cause of Orphaned State Machines: `src/core/stateMachine.ts` contains comprehensive lifecycle logic (`DealStateMachine`, `LeadStateMachine`) but was bypassed by `actions/dealActions.ts` and `services/deals/deal.service.ts`. The UI Kanban triggers `updateDealStageAction`, which directly calls `DealService.changeDealStatus(dealId, status)`. The service then executes a primitive `kernel.mutate` without ever instantiating the state machine layer.
- Bypasses: `DealService.changeDealStatus` and `LeadService.updateStatus` are the primary offenders bypassing validation.
- Direct UI Mutations: The frontend optimistically mutates state on Kanban drop, trusting the API to succeed without verifying if a transition (e.g., `draft` -> `closed` directly) is legal according to domain rules.

REQUIRED ENFORCEMENT ARCHITECTURE
- Ownership: The Domain Service Layer (`DealService`, `LeadService`) MUST exclusively own transitions. 
- Validation Sequence:
  1. Frontend invokes Action (`updateDealStageAction`).
  2. Action delegates to Service (`DealService.changeDealStatus`).
  3. Service fetches the current Entity payload.
  4. Service instantiates the State Machine directly (e.g., `new DealStateMachine(currentDealState)`).
  5. Service calls `transitionTo(newStatus)`.
  6. If the state machine throws a `BusinessRuleError`, the transition is blocked.
  7. If successful, the Service delegates to `kernel.mutate` with the validated payload.
- Failure Handling: The Action catches the `BusinessRuleError` (via `ErrorTracker.captureRejection`) and returns a strict `{ success: false, error: 'Illegal transition' }`. The frontend's optimistic UI update must be reverted using the previously preserved state.

2. DATABASE CONSISTENCY PLAN
- Mismatch Analysis: The codebase uses `agency_id` in almost all application logic, Supabase types, and the `KernelIdentity`. However, `src/db/migrations/01_production_rls_and_indexes.sql` and the billing tables uniquely enforce `tenant_id`. Additionally, the migration introduces a boolean `is_deleted`, yet the entire domain exclusively relies on `deleted_at IS NULL`.
- Canonical Schema: Because Postgres/SaaS conventions and RLS strictly use `tenant_id`, the canonical core DB attribute MUST be strictly normalized to `tenant_id`. For soft deletes, `deleted_at` timestamp is the canonical representation (provides temporal context unlike a boolean).
- Invalid Queries: Any query interceptor appending `agency_id` where `tenant_id` is structurally defined in Supabase, and queries filtering against `is_deleted` when objects use `deleted_at: null`.

DATABASE STABILIZATION PLAN
- Required Column Standardization: Convert `agency_id` fields to `tenant_id` universally across all tables to match the JWT claim resolution exactly. Standardize soft-deletes natively to `deleted_at TIMESTAMP`.
- Deprecated Columns: `is_deleted` (Boolean) MUST be dropped. `agency_id` MUST be dropped in favor of `tenant_id`.
- Migration Order:
  1. Run `ALTER TABLE` to add `tenant_id` mirroring `agency_id`.
  2. Perform data migration moving `agency_id` to `tenant_id`.
  3. Update `types/supabase.ts` and `query-interceptor.ts`.
  4. Drop `agency_id` and `is_deleted`. Migrate boolean deletions to `deleted_at = NOW()`.
- Backward Compatibility Risks: Disruption of API hooks relying on `agency_id`. During migration, `agency_id` must be retained as a generated column matching `tenant_id`.
- RLS Repair Strategy: Ensure `auth.jwt() -> 'tenant_id'` operates universally. Add constraints handling `deleted_at IS NULL` globally instead of per-query.

3. RBAC HARDENING
- Mismatch Analysis: `src/lib/enforcement/query-interceptor.ts` implicitly filters `assigned_to` for `leads` when the user is an `agent`. However, deals, clients, properties, and tasks explicitly bypass this constraint. An `agent` can successfully query the kernel for `deals` and view the entire financial pipeline across the agency, presenting a severe cross-tenant data leak. `adminOnlyTables` improperly excludes core CRM objects.

SECURITY ENFORCEMENT MODEL
- DB-level RLS: Needs explicit rules mapping table row `tenant_id` against `auth.jwt()->>'tenant_id'`, and if `role == 'agent'`, enforce an `agent_id = auth.uid()` constraint on transactional CRM tables.
- API-level RBAC (Query Interceptor) rules:
  - Leads: Agent -> `assigned_to == auth.uid()`. Manager/Owner -> Read/Write all in Tenant.
  - Deals: Agent -> `agent_id == auth.uid()`. Manager/Owner -> Read/Write all in Tenant.
  - Clients: Agent -> Readable to all (shared CRM pool), Editable only by Creator. Manager/Owner -> Read/Write all. 
  - Tasks: Agent -> `assigned_to == auth.uid()`. Manager/Owner -> Read/Write all.
  - Payments: Agent -> Read-only on own deals. Manager/Owner -> Read/Write all.
  - Properties: Agent -> Readable to all, Editable by Creator. Manager/Owner -> Read/Write all.

4. FINANCIAL ENGINE RECOVERY
- Analysis: `deal.service.ts` registers payments into the `deal_payments` table, but a hardcoded comment proves that `deals.total_payments_received` is never recalculated or updated. As a result, the `vw_deal_pipeline` aggregate and dashboard UI metrics show fake UI metrics (0% completion for payments despite successful transactions).

FINANCIAL CONSISTENCY ENGINE
- Aggregate Synchronization Logic: Reconnect aggregations. A Database Trigger (`trg_after_payment_insert`) or Domain Event (`DealPaymentRegistered`) must be established to update `deals.total_payments_received = sum(deal_payments.amount) WHERE status = 'succeeded'`. 
- Trigger/Event Architecture: When `deal_payments` mutates, push a pub-sub domain event processed by `FinancialWorker` to safely synchronize the deals table.
- Deal Payment Reconciliation: Once `deals.total_payments_received >= deals.agreed_price`, auto-trigger `DealStateMachine.transitionTo('closed')` systematically.
- Commission Recalculation Flow: Upon a deal reaching `closed`, trigger `CommissionService.calculate()` to allocate funds to `agent_commissions`, based on the active schemas.

5. DEAD CODE ANALYSIS
- `DealStateMachine` / `LeadStateMachine`: Unused domain logic. Disconnected because frontend built direct mutations using `kernel.mutate` via uncoupled `services`. ACTION: RESTORE. Must be wired back into the `DealService` and `LeadService` layer before mutations are committed.
- `computeRisk` & `generateNextAction`: Unused domain logic. Disconnected during initial UI focus. ACTION: RESTORE. Must be evaluated periodically via background cron worker against staging deals.
- `notification.worker.ts` (`processWhatsAppNotification`): Fake module. Simulates external API calls. ACTION: REFACTOR. Needs actual Twilio/Meta integration or explicit deletion.
- `deal_payments` synchronization block in `DealService`: Disconnected mock. ACTION: RESTORE. Replace with actual nested transaction update.
- `vw_deal_pipeline`: Drifting SQL aggregates. Relies on legacy `agency_id` assumptions. ACTION: REFACTOR. Rebuild against `tenant_id` standardization.

6. EXECUTION PRIORITY ORDER
1. Database Consistency Plan (Migration execution) - Unify schema `agency_id` to `tenant_id`, standardize soft-deletion, and block foundational corruption.
2. RBAC Hardening - Enforce `query-interceptor.ts` logic to immediately stop cross-agent data leakage for deals and clients.
3. State Machine Recovery - Wire the orphaned `DealStateMachine` into `DealService.changeDealStatus` to enforce logical state flows.
4. Financial Consistency Engine - Reconnect `deal_payments` triggers to pipeline aggregates to rectify fake UI metrics.
5. Dead Code Integration - Reactivate domain logic components (`computeRisk` / `generateNextAction`).
