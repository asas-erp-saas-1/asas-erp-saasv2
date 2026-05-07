# EXECUTION PATH VALIDATION

## 1. The Core Flow
`API Request` → `Kernel` → `Repository` → `RPC` → `Outbox` → `Worker` → `Projection` → `Realtime Broadcast`

## 2. Operational Validation Points

### A. Retry Safety & Idempotency
- **Reality:** Workers failing mid-execution will retry. The `ProjectionEngine` correctly uses `UPSERT` and checks `< event.version`, ensuring mathematical idempotency.
- **Risk:** `WorkerConcurrencyLimiter` uses in-memory `Map` locks. In a serverless/multi-pod environment, this is **fake**. We MUST rely on physical PostgreSQL constraints (e.g., `FOR UPDATE SKIP LOCKED` on the outbox table) or a true Redis `SET NX` lock.

### B. Memory Pressure
- **Reality:** Rehydrating Aggregates with 10,000 events in a serverless worker will cause OOM (Out of Memory) crashes.
- **Fix:** The `EventCompactionEngine` (Snapshots) is not an optimization; it is a hard operational prerequisite for survival.

### C. Race Conditions
- **Reality:** Two simultaneous requests mutating the same Aggregate.
- **Fix:** Postgres Optimistic Concurrency Control (OCC) using the `version` field. If `UPDATE aggregates SET version = 4 WHERE id = X AND version = 3` returns 0 rows, the transaction aborts. Validated.

### D. Queue Starvation & Supabase Overload
- **Reality:** QStash polling 10,000 events could exhaust the PgBouncer/Supavisor connection pool immediately.
- **Fix:** Worker concurrency must be strictly limited via QStash concurrency controls. Fanout must be governed at the infrastructure layer, not the application layer.

### E. Webhook Degradation
- **Reality:** Dispatching webhooks inline with projections will hang the projection engine if the external server times out.
- **Fix:** Webhook dispatch must be wholly segregated into its own async listener pool using `WebhookDispatcher` to prevent cascading timeouts.
