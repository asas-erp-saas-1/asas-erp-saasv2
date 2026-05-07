# PHYSICAL SYSTEM RECONSTRUCTION & EXECUTION MIGRATION

## SECTION 1 — RECONSTRUCTION PHILOSOPHY

### The Architecture of Survival
Enterprise system rewrites fail because they violate the first law of runtime continuity: **Production must never stop.** "Big bang" rewrites destroy companies by freezing feature delivery, creating an unbridgeable delta between the legacy codebase and the new system, and culminating in catastrophic, un-rollback-able launch events.

Incremental reconstruction is mandatory. We will employ a **Strangler Fig Migration**: executing a controlled, gradual suffocation of the legacy architecture. 

- **Parallel Runtime Transition**: The new Kernel and the old legacy codebase will run concurrently in the same process boundary, accessing the same database, but isolated via strict network routing and proxy patterns.
- **Governed Reconstruction**: Every migrated feature is wrapped in verification, ensuring no regressions.
- **Dual-System Stability**: The ERP will operate symmetrically during the transition.
- **Execution Preservation**: Operational continuity overrides engineering ego. Migration safety trumps feature velocity. Incomplete migrations (where a feature is split across two architectures permanently) are catastrophic and forbidden.

Migration is a controlled surgery. The patient (the ERP) must remain fully awake and operational while its operating system is replaced.

---

## SECTION 2 — CURRENT SYSTEM AUDIT & LEGACY CLASSIFICATION

Before altering a single execution path, the existing codebase undergoes a strict structural audit. Every file, controller, and query is designated.

**Legacy Code Audit Process:**
1. **AST Inspection**: Automated parsing of the Abstract Syntax Tree (via ESLint/Babel) to identify every instantiation of `@supabase/supabase-js`.
2. **Runtime Tracing Audit**: Datadog APM tracing to map undocumented synchronous side effects (e.g., calling Stripe directly before DB commit).
3. **DB Query Audit**: Analyzing `pg_stat_statements` to capture unindexed, cross-tenant, or poorly optimized raw queries originated from the UI/Client.
4. **Import Graph Audit**: Mapping circular dependencies and cross-domain pollution.

**Classification Categories:**
1. **SAFE**: Pure functions, detached UI components, Zod schemas. Requires minimal refactoring.
2. **NEEDS REFACTOR**: Components mixing fetching with presentation, but lacking mutative logic.
3. **CRITICAL LEGACY**: Core revenue-generating paths (e.g., Checkouts, Lead Conversions). Must be migrated via Shadow Execution.
4. **RUNTIME HAZARD**: Multi-step procedural functions without transaction boundaries. High risk of partial data commits.
5. **REWRITE REQUIRED**: Unsalvageable logic (e.g., hardcoded raw SQL string concatenations matching user inputs).

**Hazard Detection Criteria:**
- **Direct DB Writes**: Bypassing serverless functions to run `supabase.from('deals').update()` from React.
- **Hidden Side Effects**: `await sendEmail()` placed arbitrarily in the middle of a controller before a `COMMIT`.
- **Missing Tenant Enforcement**: Queries lacking `.eq('tenant_id', ...)` in the base payload.

---

## SECTION 3 — STRANGLER FIG MIGRATION SYSTEM

The legacy system is not deleted; it is routed around.

**Legacy Isolation Layer:**
- An API Gateway layer intercepts all inbound traffic. Legacy traffic continues to `/api/v1/legacy/...`. Migrated traffic routes to `/api/v2/kernel/...`.
- **Compatibility Bridges**: New CQRS read-models are exposed to legacy UI components via API wrappers. If Legacy UI expects `agency_id`, the compatibility bridge intercepts the Kernel's `tenant_id` and maps it backward.

**Shadow Execution Strategy:**
For **CRITICAL LEGACY** workflows (e.g., Deal Commissions):
1. Request hits the Gateway.
2. Gateway routes the request to BOTH the Legacy Handler AND the New Kernel (in Dry-Run mode).
3. The Legacy Handler executes the actual DB transaction.
4. The Kernel executes the State Machine, computes the desired DB operations, but logs them to `shadow_execution_logs` instead of committing them.
5. A background process compares the Legacy mutation payload vs the Kernel payload.
6. When divergence hits 0% for 7 consecutive days, the Legacy Handler is disabled, and the Kernel traffic shifts to live execution.

**Controlled Execution Rerouting:**
Traffic shifts are managed precisely via Feature Flags (`LAUNCHDARKLY/REDIS`). Rollback is instantaneous by flipping the route flag back to legacy.

---

## SECTION 4 — KERNEL PHYSICAL IMPLEMENTATION

The Kernel is injected at the deepest level of the application execution context.

**Physical Kernel Implementation Order:**
1. **Kernel Bootstrap System**: Instantiate the `KernelContainer` on server initialization. Verify DB connection pools.
2. **Execution Context Propagation**: Rewrite the Next.js Middleware to parse JWTs, inject `tenant_id`, `actor_id`, and `trace_id` into a thread-safe `KernelContext` request header map.
3. **Query Interception**: Build the Repositories. Wrap every Supabase client call inside an interceptor that unconditionally injects `WHERE tenant_id = ctx.tenant_id`.
4. **Command Execution Routing**: Expose `/api/execute` endpoint. Route commands to respective handlers while enforcing atomic boundaries.

**Physical Elimination of Exploits:**
- **AST Compiler Hooks**: Add a Git Pre-commit Hook. If `.from(` exists in a file outside the `kernel/repositories` or `infrastructure/` directory, the commit is violently rejected.
- **Uncontrolled Mutations**: Strip all `update()` capabilities from the Supabase public API key used by the React client. Force all mutations through RPC.

---

## SECTION 5 — DATABASE RECONSTRUCTION & RPC MIGRATION

**Physical DB Migration Strategy (Expand-Contract):**
1. **EXPAND**: Add `tenant_id` column alongside legacy `agency_id`. Add `tenant_id = agency_id` trigger.
2. **MIGRATE CODE**: Update all reads/writes to populate and query both or use compatibility bridges.
3. **BACKFILL**: Run background SQL to ensure `tenant_id` is 100% populated for historic rows.
4. **CONTRACT**: Drop `agency_id`.

**Transaction Orchestration Centralization:**
- Move all multi-table JS operations (e.g., Update Deal + Create Payment) into PL/pgSQL RPCs. 
- `create function rpc_commit_payment(deal_id uuid, amount... )`

**Optimistic Locking Rollout:**
- Add `version INT DEFAULT 1` to all core aggregates.
- Backend legacy code is modified temporarily to pass `version: 1` dynamically until fully migrated to the Kernel Command architecture.

---

## SECTION 6 — EVENT BUS & OUTBOX PHYSICAL IMPLEMENTATION

**Outbox Table Deployment:**
Deploy `outbox_events` and `processed_events` tables.

**Migrating Legacy Side Effects:**
1. Locate `await twilio.send(...)` in legacy APIs.
2. Replace with: `await tx.insert('outbox_events', { type: 'SMS.Requested' })`.
3. Stand up QStash polling cron to sweep `outbox_events`.
4. Implement `SmsWorker`. `SmsWorker` first runs `INSERT INTO processed_events...` to ensure idempotency before calling Twilio.

**Replay Tooling & Dead-Letter:**
- Events exceeding 3 retries (via QStash native retry) are physically routed to `dead_letter_events`.
- A dedicated Admin CLI `npm run db:replay -- --dead-letters` is built to manually re-hydrate failed workflows after infrastructure fixes.

---

## SECTION 7 — STATE MACHINE RECONSTRUCTION

Currently, business logic lives inside `if/else` UI and API blocks. This must be physically extracted.

**Migration from CRUD to State:**
1. Write pure TypeScript classes: `DealStateMachine`.
2. Define guards: `canTransition(state, command)`.
3. Legacy controllers are refactored to query `DealStateMachine.canTransition()` before executing their old raw queries.
4. Once the Kernel takes over, the State Machine strictly governs the `next_state` payload sent to the DB RPC.

**Frontend Reconciliation:**
The UI ceases making assumptions. When the user drops a Kanban card, the UI sends `MoveCommand`. If the API returns a 400 `IllegalTransitionError`, the UI violently snaps the card back to its original column. Optimistic UI is explicitly told how to rollback.

---

## SECTION 8 — FRONTEND EXECUTION RECONSTRUCTION

**CRUD UI to Command UI:**
- Replace generic form "Save" buttons with strict Intent Actions (`Submit for Approval`, `Confirm Payment`).
- Action Feed Reconstruction: The "dashboard" changes from a massive SQL join table to a real-time Action Feed querying the new `tasks` and `approvals` engines.

**Coexistence During Transition:**
- Old frontend screens exist parallel to new screens. 
- Navigation routes like `/v1/deals` load the legacy bundle. `/v2/deals` load the React Server Components driven Command UI.
- Both read from the same database (protected by compatibility views if necessary).

**Realtime Synchronization:**
- Convert polling loops to Supabase WebSockets.
- Subscribe exclusively to `tenant:${tenant_id}:commands`.

---

## SECTION 9 — WORKER & ASYNC RECONSTRUCTION

**Async Workflow Migration:**
- Locate `setTimeout` or Vercel Edge Server background execution attempts. Delete them.
- Replace with Saga checkpoints. 

**Resumability:**
- Create `active_workflows` table.
- A long-running Lead Drip Campaign executes Step 1, logs `status: step_1_complete` to Postgres, and schedules QStash for +24 hours.
- When QStash wakes the worker, the worker fetches the checkpoint and resumes safely.

**Queue Isolation:**
- Isolate High-Priority queues (Command Routing) from Bulk Queues (Marketing SMS) to prevent latency poisoning.

---

## SECTION 10 — DEPLOYMENT & RELEASE MIGRATION STRATEGY

**Safe Deployment Sequencing:**
1. Run Database Migrations (Additive/Expand only).
2. Deploy Kernel & Workers.
3. Deploy API changes.
4. Deploy Next.js Frontend.

**Traffic Shifting & Shadow Execution:**
- Code executes behind `Feature_V2_Enabled`.
- QA tests on Production via target session cookie `?x-beta-kernel=true` prior to enabling for 10% of global tenant traffic.

**Migration Freeze Triggers:**
If Database CPU > 75%, or if HTTP 500s > 1% during a traffic shift, the CI/CD orchestrator triggers an automatic Vercel traffic revert to the last known good deployment.

---

## SECTION 11 — EXECUTION ORDER MATRIX

**THE EXACT 15-STEP MIGRATION ORDER:**

1. **DB Normalization (Expand)**: Add `tenant_id`, `version`, and audit tables.
2. **Kernel Bootstrap**: Implement `KernelContext` injection middleware.
3. **Repository Migration**: Write strictly-typed Kernel repositories encapsulating Supabase calls.
4. **RPC Migration**: Wrap multi-table logic into PostgreSQL Pl/pgSQL functions.
5. **Outbox Deployment**: Implement `outbox_events` and QStash sweeps.
6. **Event Workers**: Transpile legacy side-effects (email/SMS) to Idempotent Queue Consumers.
7. **State Machine Migration**: Extract core business `if/else` logic into pure workflow classes.
8. **Frontend Adaptation**: Plumb UI forms to utilize new Command endpoints. Add rollback handling.
9. **Legacy Isolation**: Funnel all `api/v1` routes into wrapper controllers that log deprecation warnings.
10. **Full Command Routing (Shadow Mode)**: Run V1 and V2 pipelines symmetrically. Verify 0% diff.
11. **Realtime Migration**: Swap expensive polling queries for bounded websocket subscriptions.
12. **Worker Reconstruction**: Convert long-running cron jobs into State-oriented Sagas.
13. **CQRS Projections**: Build Materialized views for Dashboards to remove OLTP query saturation.
14. **Analytics Migration**: Point BI/Reporting to Read Replicas.
15. **Final Legacy Shutdown (Contract)**: Drop old UI, drop `agency_id`, drop legacy controllers.

---

## SECTION 12 — MIGRATION FAILURE ENGINEERING

**What Happens If...**
- **RPC Deployment Fails?**: Legacy procedural JS routes are untouched. Traffic continues operating. DB schema is additive, so V1 doesn't crash.
- **RLS Blocks Legitimate Traffic?**: Kernel `AuditTracker` identifies `403 Forbidden` spikes. PagerDuty alerts instantly. The bad RLS policy is `DROP`ped and temporarily reverted to `<tenant_id = X>` direct enforcement at the repository layer.
- **Workers Duplicate Execution?**: Idempotency checks (`processed_events` constraint) throws an ignored soft error. Side effects are NOT duplicated.
- **Frontend Version Mismatch Occurs?**: Client sends `v1` payload to `v2` endpoint. The Edge API translates the payload backwards, executing via Compatibility Bridge, whilst prompting the UI client to refresh.
- **Websocket Layer Collapses?**: UI WebSocket connection closes. The `useRealtime` hook catches the disconnect and auto-degrades to 5-second SWR HTTP polling intervals.

**Emergency Recovery Operations:**
A physical "Kill Switch" disables write mutations system-wide, shifting the ERP into Read-Only mode to prevent cascading corruption while engineers triage database deadlocks.

---

## SECTION 13 — LEGACY SYSTEM DECOMMISSIONING

You do not delete legacy code because it is "old". You delete it when it is mathematically proven to be dead.

**Criteria for Deletion:**
1. Datadog / Network metrics confirm exactly `0` requests to a legacy API path for 14 consecutive days.
2. DB query logs show exactly `0` calls originating from the legacy repository block.

**Final Shutdown Procedures:**
- Identify and kill orphaned cron jobs still pointing to legacy routes.
- Execute the "Contract" database migrations (e.g., `ALTER TABLE deals DROP COLUMN legacy_id`).
- Delete the `/src/legacy` folder.

**Why Deleting Legacy Too Early Destroys Migrations:**
Falling back to a prior state is impossible if the prior state has been physically deleted from the main branch. Parallel existence guarantees survivability.

---

## SECTION 14 — ENGINEERING ANTI-PATTERNS DURING MIGRATION

**ABSOLUTELY FORBIDDEN MIGRATION BEHAVIORS:**

- **Big Bang Rewrites**: Attempting to switch over the entire DB schema and UI overnight. *Consequence: Unrecoverable data corruption. Alternative: Strangler Fig branch routing.*
- **Dual-write Without Reconciliation**: Writing to Old DB and New DB blindly. *Consequence: Silent divergence. Alternative: Shadow Execution Diffing.*
- **Partial Tenant Migrations**: Migrating Feature A for Tenant 1 while Feature A for Tenant 2 remains on Legacy. *Consequence: Multi-tenant boundary collapse. Alternative: Feature flags apply globally against the Command, not the Tenant context.*
- **Runtime Schema Mutation**: Running `ALTER TABLE` via a script during business hours. *Consequence: Postgres locks the table, downing the ERP. Alternative: Concurrent indexing and off-peak migration scripts via CI/CD.*
- **Mixing Legacy and Kernel Writes**: Legacy bypassing event bus, Kernel utilizing event bus. *Consequence: Broken audit logs and lost events. Alternative: Legacy MUST route through the compatibility bridge.*

---

## SECTION 15 — FINAL RECONSTRUCTION READINESS AUDIT

This acts as the uncompromising threshold for signing off on System Transformation.

**THE ERP IS NOT READY FOR MIGRATION UNLESS:**
- [ ] Kernel execution is authoritative and physically prevents bypassing.
- [ ] Legacy mutations are completely isolated via interceptors or separate URL paths.
- [ ] All database expansions (columns, RLS) are additive, allowing V1 features to survive V2 deployments.
- [ ] ALL business workflows are governed by resilient state machines, capable of pausing/resuming.
- [ ] The Outbox event replay is fully tested (killing a worker mid-flight successfully reschedules).
- [ ] QStash workers have 100% test coverage regarding unique constraints on `processed_events`.
- [ ] RLS policies strictly map to `(current_setting('request.jwt.claims')::jsonb ->> 'tenant_id')`.
- [ ] Multi-table commits are safely orchestrated through Postgres RPCs.
- [ ] Frontend React components cleanly handle `409 OptimisticLockError` and `400 BusinessRuleError` with localized state rollbacks.
- [ ] Traffic shifting architectures are tested, capable of routing 5% of requests to the V2 paths with immediate 1-click reversal via Redis flag.
- [ ] Legacy shutdown criteria is hooked to live Datadog metrics ensuring no "guesswork" deletion. 
- [ ] Zero uncontrolled mutations (side effects lacking an outbox transaction) remain on the critical execution path.
