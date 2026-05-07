🧠 DOMAIN OWNERSHIP MAP

1. UI (React/Next.js Client)
- Owns: Rendering state, optimistic updates (reverting on failure), user input validation, presentation logic.
- Never owns: Business rules, direct database queries, authorization enforcement, transaction boundaries.
- Allowed Responsibilities: Consuming REST/RPC endpoints, subscribing to Realtime channels, caching UI state locally.
- Forbidden Responsibilities: Writing to DB directly via raw queries, making trust decisions.

2. Services (Domain Use-Cases)
- Owns: Workflow orchestration, business rule invocation, permission scoping (via Kernel interceptors).
- Never owns: Data storage mechanisms, HTTP protocol specifics (req/res parsing).
- Allowed Responsibilities: Invoking State Machines, interacting with the Kernel, emitting domain events.
- Forbidden Responsibilities: Bypassing Kernel mutations, catching errors to return silent failures.

3. State Machines
- Owns: Valid lifecycle transitions, domain invariants, status enforcement.
- Never owns: Database commits, structural side effects (e.g., dispatching emails).
- Allowed Responsibilities: Synchronous validation, throwing `BusinessRuleError`.
- Forbidden Responsibilities: Asynchronous calls, network requests.

4. Workers / Event Consumers
- Owns: Asynchronous side effects (emails, webhooks), aggregate synchronization, third-party integrations (Stripe, Twilio).
- Never owns: Synchronous request-response cycles, primary source of truth.
- Allowed Responsibilities: Consuming events from Outbox, retrying on failure, recording to dead-letter queues.
- Forbidden Responsibilities: Silently dropping failures, circumventing idempotency checks.

5. RPCs / DB Triggers
- Owns: ACID transaction boundaries, strict cross-table relational integrity (e.g., accumulating payments).
- Never owns: Application-level business logic, external API calls.
- Allowed Responsibilities: Updating derived columns (`total_payments_received`), tracking `updated_at`, logging to `audit_logs`.
- Forbidden Responsibilities: Throwing ambiguous errors, long-running processes (blocking UI).

---

🔄 WORKFLOW ORCHESTRATION

Design: Saga/Outbox Pattern for Long-Running Workflows.

Example: Commission Release Workflow
- Synchronous steps: Agent requests release -> `CommissionService` validates deal is `closed` and payment is verified -> Updates commission status to `pending_verification` -> Inserts `CommissionReleaseRequested` into `outbox_events` -> Returns 200 OK to UI.
- Asynchronous steps: Financial Worker consumes event -> Integrates with Bank API/Ledger to dispatch funds -> Sets commission to `paid`.
- Compensation logic: If Bank API rejects (e.g., invalid IBAN), Worker issues `CommissionFailed` event -> Compensating worker reverts commission status to `failed` and inserts a high-priority task for the Manager.
- Retry logic: Exponential backoff for transient external API errors (e.g., 503 Gateway Timeout). Max 3 retries.
- Partial failure: If the worker crashes mid-flight, the workflow pauses in `pending_verification`. Idempotency guarantees that when the worker restarts, it checks the Bank API status before duplicate dispatching.

---

📊 OBSERVABILITY SYSTEM

Metrics (Prometheus/Datadog Equivalent):
- `transactions_processed_total` (Counter, tagged by status).
- `api_request_duration_ms` (Histogram).
- `event_queue_depth` (Gauge, by topic).
- `tenant_quota_exceeded_total` (Counter).

Traces:
- TraceID propagation mandated across all layers. A request header `X-Trace-Id` passes from Next.js -> Service -> Kernel -> Outbox Event Payload -> Worker, enabling full visualization of a Lead's lifecycle.

Logs (Structured JSON):
- Every log MUST include: `tenant_id`, `user_id`, `trace_id`, `action`, `level`. No raw string concatenated logs allowed.

Workflow Monitoring & Alerts:
- Stuck Deals: Alert if a transaction workflow sits in `pending_verification` for > 48 hours.
- Failed Commissions: Paging alert for any event entering the `dead_letter` queue.
- Dead Workers: Liveness probe fails, worker replica count drops below baseline.
- Failed Outbox Retries: Alert if `outbox_events` age > 10 minutes (indicating processing bottleneck).

---

🛡️ RESILIENCE STRATEGY

1. Redis Outage
- Degradation Mode: Caching skips directly to the Database (higher latency). Rate limiting "fails open" (allows traffic bounded by absolute infrastructural max to prevent full outage).
- Fallback Logic: In-memory LRU cache fallback for highly critical tenant configs.
- Recovery Sequence: Auto-reconnect with exponential backoff and jitter.

2. Supabase Realtime Outage
- Degradation Mode: UI gracefully falls back to explicit manual refresh prompts.
- Fallback Logic: Network interceptor catches WebSocket failures and degrades React Query / SWR fetching to passive 15s polling.

3. Worker Crash
- Degradation Mode: Events accumulate safely in `outbox_events` table (PostgreSQL acts as buffer).
- Fallback Logic: Jobs remain unclaimed (no side effects executed). Platform orchestrator (K8s) restarts worker container.
- Recovery Sequence: Worker resumes polling outbox. Idempotency keys prevent double-processing.

4. Partial DB Failure (Read-Replica Lag)
- Degradation Mode: Route critical reads (e.g., querying balance immediately after payment) to the Primary DB instance. Accept stale data on analytics dashboards.

---

🏢 TENANT GOVERNANCE

Tenant Quotas (e.g., Max Deals, Max Agents):
- Enforced synchronously at the `Kernel.mutate` layer. 

Rate Limiting:
- Per-tenant leaky bucket algorithm on the API Gateway (using Redis). Ensures "Noisy Neighbor" isolation (Tenant A spamming the API does not deplete Tenant B's throughput resources).

Storage Governance:
- Automatic partition and prune. `audit_logs` and `activities` hard-capped retention (e.g., rolling 90 days for Basic tier, 2 years for Enterprise). Scheduled cron deletes expired rows.

Billing Enforcement (Subscription States):
- If `status = 'past_due'`, the Tenant's access globally shifts. `Kernel` blocks all `INSERT`/`UPDATE` operations (Read-Only Mode) by triggering an `INSUFFICIENT_FUNDS` error, prompting the UI to show a Billing Lockout banner.

---

🚨 OPERATIONAL FAILURE RISKS

1. Polling Bottleneck (Outbox Scale)
- If a highly active tenant generates 10,000 events/minute, a single polling worker will fall terminally behind, causing delayed workflows.
- Fix: Implement partitioned polling (sharding by `tenant_id`) or shift to Postgres Logical Replication (Wal2JSON) to stream changes instantly.

2. Dead-Letter Ignorance
- An unmonitored DLQ means silent failure of critical asynchronous workflows (e.g., invoices failing to send, leaving the company unpaid). DLQ alerts must be High Urgency / PagerDuty.

3. Thundering Herd (Post-Outage)
- When Redis recovers from an outage, massive concurrent cache misses could overwhelm the primary database, crashing the entire ERP.
- Fix: Implement Cache Stampede protection (single-flight/deduplication patterns via `batcher.ts`) to ensure only one DB query executes while siblings await the result.
