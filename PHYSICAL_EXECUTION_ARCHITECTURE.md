# PHYSICAL EXECUTION ARCHITECTURE

## 1. SYSTEM RUNTIME TOPOLOGY

The ASAS ERP operates on a distributed, multi-tenant serverless runtime using Vercel (Edge/Node.js) and Supabase (PostgreSQL + Realtime).

### Topology Boundaries
- **API Gateway Layer (Vercel Edge/Serverless Next.js)**: Handles incoming HTTP traffic, JWT parsing, rate limiting (Upstash Redis), and request routing.
- **Frontend Runtime (Next.js App Router - Client/Server Components)**: Handles UI hydration, optimistic mutations, and real-time command feed rendering via Supabase WebSocket.
- **Realtime Layer (Supabase Realtime/Elixir)**: Broadcasts DB mutations (Postgres WAL -> Elixir -> WebSockets) to active UI clients securely mapping to `tenant_id`.
- **Database Engine (PostgreSQL / Supabase)**: The ultimate source of truth. Handles relational integrity, RLS enforcement, ACID transactions, and acts as the event outbox.
- **Queue Runtime (QStash + Vercel Serverless Workers)**: QStash strictly handles scheduled/deferred HTTP callbacks targeting Vercel Serverless functions acting as Workers.
- **Notification Engine**: Polling worker resolving WhatsApp/Email templates, pushing to external providers (Twilio/Meta API).

### Flow Maps
*   **Command Flow**: Frontend → Next.js Server Action → Kernel Interceptor (RBAC/Rate Limits) → State Machine Validation → Postgres Transaction (`INSERT payload` + `INSERT outbox_event`).
*   **Event Flow**: Outbox Table `INSERT` → Postgres Trigger → PgBouncer/Supabase Webhook → QStash → Next.js Worker API → Side Effect Execution & Dead-Letter validation.
*   **Read Flow**: Frontend → Next.js Server Component → Redis Cache (if hit) → Postgres (if miss via Read Replica) → UI render.

---

## 2. PHYSICAL BACKEND ARCHITECTURE

The Node.js/Next.js codebase enforces strict Domain-Driven Design boundaries leveraging a custom Kernel.

### Physical Folder Structure
```text
src/
 ├── app/                  # Next.js App Router (UI & API endpoints)
 ├── kernel/               # Execution guard, tenant context mapping, and DB access wrapper
 │    ├── enforcement/     # RBAC Query interceptors & Runtime guards
 │    ├── identity/        # JWT payload parsers
 │    └── db/              # Single Supabase instance provider
 ├── modules/              # Core Bounded Contexts
 │    ├── crm/             # Leads, Clients, Contacts
 │    ├── sales/           # Deals, Pricing, Resevations
 │    ├── finance/         # Payments, Commissions, Ledger
 │    └── inventory/       # Properties, Projects
 ├── orchestration/        # Cross-domain Saga engines (Master Workflow Engine)
 ├── workflows/            # Individual State Machine executions
 ├── infrastructure/       # Outbound services (WhatsApp API, S3/Storage, Stripe)
 ├── events/               # Event Registry, Dispatchers, and Consumer schemas
 ├── realtime/             # WebSocket payload schema & channel management
 ├── monitoring/           # ErrorTracker, Logger, OpenTelemetry setup
 └── shared/               # Cross-domain value objects (Types, Zod schemas)
```

### Dependency Rules
- **Anti-Corruption Constraint**: `modules/crm` CANNOT import from `modules/sales`. They must communicate by emitting domain events via the `events/` layer or through specific cross-domain calls orchestrated by `orchestration/`.
- **Kernel Isolation**: ALL database requests MUST pass through `src/kernel/enforcement`. Direct usage of `@supabase/supabase-js` inside `modules/` is fatal and blocked by `RuntimeGuard`.

---

## 3. POSTGRESQL PHYSICAL DATABASE DESIGN

### Schema & Tenant Isolation
- **Tenant Isolation**: Row-Level Security (RLS) is absolute. Every table containing operational data MUST have a `tenant_id` UUID column. RLS physically drops rows via `USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid)`. `agency_id` is definitively deprecated.

### Table Architecture Highlights
- **`deals` (Ownership: Sales Module)**
  - Indexes: `CREATE INDEX idx_deals_tenant_status ON deals(tenant_id, status)`.
  - Concurrency: `version INT DEFAULT 1`. Optimistic locking enforces `UPDATE deals ... WHERE id = $1 AND version = $2`.
- **`outbox_events` (Ownership: Event Bus)**
  - Structure: `id UUID`, `tenant_id UUID`, `aggregate_type VARCHAR`, `aggregate_id UUID`, `payload JSONB`, `status VARCHAR DEFAULT 'pending'`.
  - Indexing: `CREATE INDEX idx_outbox_pending ON outbox_events(tenant_id, status) WHERE status = 'pending'`.
- **`deal_payments` (Ownership: Finance Module)**
  - Immutable ledger design. Updates are forbidden. Corrections require a reversing entry (Credit/Debit).
  - Triggers: `AFTER INSERT ON deal_payments` calculates the sum and invokes an atomic aggregate update on the `deals` table via Postgres RPC.

### Mitigation of Supabase Limits
- **Transaction Weakness**: Supabase REST API does not support multi-statement transactions natively.
  - *Fix*: Critical atomicity (e.g., converting a lead, inserting a deal, and logging an event) is executed via a pre-deployed PL/pgSQL RPC function: `rpc('convert_lead_tx', payload)`.

---

## 4. EVENT BUS & MESSAGE ARCHITECTURE

At-least-once delivery semantics via strict Transactional Outbox pattern.

### Event Contracts
- **Producer**: The Domain Service performing the DB mutation.
- **Consumer**: Respective Module Workers hooked via QStash.
- **Format**: `Domain.Entity.Action` (e.g., `Sales.Deal.Closed`).

### Processing Lifecycle
1. Request hits Kernel Mutate.
2. Kernel calls Postgres RPC to execute business logic.
3. RPC writes mutation AND appends `Sales.Deal.Closed` object to `outbox_events` table in same TX.
4. Supabase `pg_cron` or Database Webhook pushes pending events to QStash buffer.
5. QStash HTTP POSTs to Vercel Serverless `/api/workers/events`.
6. Worker validates Idris idempotency key via `processed_events` table. If unique constraint fails, discard safely.
7. Worker executes Consumer Logic (e.g., Invoice Generation).
8. Worker marks `outbox_events.status = 'processed'`.
- **Dead-Letter (DLQ)**: If Worker fails 3 times, QStash moves to DLQ. Alert sent to Datadog/Sentry.

---

## 5. STATE MACHINE EXECUTION ENGINE

Code-driven State Machines orchestrating DB transitions.

### Implementation
State Machines are synchronous, pure TypeScript classes instanced in the `workflows/` directory.

- **Transition Enforcer**: `DealStateMachine.transition(current_state, command_action)`.
- **Guards**: E.g., `command_action === 'RESERVE'` checks `deal.agreed_price >= limits.min`. Throws `BusinessRuleError` if invalid.
- **Side Effects**: State Machines ONLY return a validated target state and a list of internal events to publish. The calling Service explicitly commits this output to the Database/Outbox.

### Failure Handling
If `StateMachine` rejects a transition, the Node.js action intercepts the error, bypasses DB execution, and returns `{ success: false, error: 'Illegal Transition: Missing verification' }` causing the frontend UI (Kanban board) to revert the dragged card.

---

## 6. CQRS & READ MODEL ARCHITECTURE

To prevent analytical queries from killing OLTP (Write) performance on high-concurrency instances.

### Segregation
- **Writes (Commands)**: Hit Postgres primary.
- **Reads (Queries)**: Single-row lookups hit Postgres directly (index optimized).
- **Projections (Dashboards/Aggegates)**: NEVER run `SELECT SUM(...)` live.
  - Use `Materialized Views` for complex joins.
  - Refresh strategy: A Cron job executes `REFRESH MATERIALIZED VIEW CONCURRENTLY vw_pipeline_metrics` every 15 minutes.
  - Fallback Cache: Vercel functions query Next.js Cache / Upstash Redis with `stale-while-revalidate`.

---

## 7. RBAC & SECURITY EXECUTION MODEL

### Matrix & Enforcement
- `Owner`: Unrestricted access within `tenant_id`.
- `Manager`: Read/Write across all entities within `tenant_id`.
- `Agent`: Read/Write explicitly bounded by `assigned_to = auth.uid()` or creator context.

### Execution
- **API Guard**: Next.js Middleware checks valid JWT and loads role into Headers.
- **Kernel Validation**: `query-interceptor.ts` evaluates the command against the role. If an Agent attempts `GET /deals` without a filter, the interceptor mutates the query AST to inject `.eq('agent_id', userId)`.
- **Horizontal Escape Prevention**: `tenant_id` injection happens unconditionally at the lowest wrapper layer before executing Supabase JS filters.

---

## 8. REALTIME ARCHITECTURE

### Websocket Topology
- Supabase Realtime drives command feeds.
- **Subscription Ownership**: Client-side connects to channel `tenant:${tenant_id}:commands`.
- RLS pushes only changes localized to the user context.

### Avoidance of Exhaustion
- Do NOT broadcast complex joined payloads to thousands of agents.
- Broadcast tiny invalidation pings: `{"type":"invalidation", "entity":"deals", "id":"xyz"}`
- Frontend uses SWR / React Query to selectively re-fetch the specific modified entity via standard HTTP, letting edge caching handle the burst.

---

## 9. INFRASTRUCTURE & DEPLOYMENT TOPOLOGY

### Environments
- **Production**: Vercel (Edge network), Supabase Pro/Enterprise (Dedicated Postgres Instance), Upstash Redis.
- **Staging**: Mirror configuration.

### CI/CD Pipelines
1. PR triggers isolated Ephemeral DB Branch on Supabase.
2. E2E tests run against ephemeral branch (Playwright).
3. Merge to `main`.
4. GitHub Actions runs Postgres schema migrations via Supabase CLI (`supabase db push`).
5. Wait for successful migration.
6. Vercel deploys updated Next.js edge code.

### Rollback Strategy
Database schema changes MUST be non-destructive (e.g., expand and contract pattern). Add columns, don't rename. Code deployment can instantly rollback via Vercel instant rollback without database breakage.

---

## 10. OBSERVABILITY & OPERATIONS

- **Traces**: Integration with OpenTelemetry to track a request from `Vercel Gateway` -> `Node.js Action` -> `Postgres RPC` -> `Outbox Worker`.
- **Metrics**: Track DB Write Pressure, QStash Queue Depth, End-to-End latency.
- **Alert Thresholds**:
  - `Queue Delay > 60s` => WARNING.
  - `5xx Response Rate > 1%` => CRITICAL.
  - `Dead-Letter Events > 0` => CRITICAL.
- **Audit Monitoring**: Every state mutation is logged to `audit_logs` (Append-Only). Managers access an "Activity Timeline" overlaying every deal.

---

## 11. PERFORMANCE & SCALE ENGINEERING

- **Hot Partition Prevention**: UUIDv7 (time-ordered UUIDs) used for Primary Keys to prevent Postgres B-Tree index fragmentation under massive write loads.
- **Connection Pooling**: PgBouncer (native to Supabase) utilized. Next.js serverless functions connect via IPv4 PgBouncer port, preventing connection exhaustion.
- **Cache Stampede Guard**: `AdaptiveCache` deduplication logic ensures that if 1,000 agents log in at 9:00 AM, only ONE concurrent query reads the dashboard projection; the other 999 await the resolved Promise in memory.

---

## 12. FINAL EXECUTION BLUEPRINT

**Critical-Path Implementation Order:**
1. **DB Foundation**: Execute migration renaming `agency_id` to `tenant_id`. Stand up `outbox_events` and `audit_logs` tables. Deploy RPC atomic commit functions. [DO NOT IMPLEMENT ANYTHING ELSE UNTIL THIS PASSES].
2. **Kernel Enforcement**: Replace dynamic `is_deleted` checks with RLS guarantees. Write the strict `QueryInterceptor` locking agents.
3. **Event Bus Hookup**: Route outbox rows to QStash workers. Establish the idempotent consumer `processed_events` log.
4. **State Machine Reconstruction**: Refactor `DealService` to route all mutations through `DealStateMachine`.
5. **API & Realtime Adaptation**: Plumb React Kanban UI to gracefully revert on `BusinessRuleError`.

**Production Readiness Checklist:**
- [ ] No raw `supabase.from()` commands exist in standard modules.
- [ ] DB RPC functions cover all multi-table transactions.
- [ ] RLS policies contain zero bypass clauses lacking `tenant_id`.
- [ ] The DLQ is attached to an active PagerDuty/Webhook alert.
- [ ] Outbound communications (WhatsApp/Email) are driven exclusively by Outbox Workers, not immediate HTTP handlers.
