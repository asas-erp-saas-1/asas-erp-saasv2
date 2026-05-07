# INTERNAL KERNEL & EXECUTION FRAMEWORK

## SECTION 1 — KERNEL PHILOSOPHY

The Internal Execution Kernel is the absolute operational authority of the ASAS ERP. Business modules are strictly sandboxed; they contain domain rules, state machines, and calculations, but they are physically incapable of executing mutations or side effects autonomously. 

**Kernel First Architecture**
The Kernel exists to decouple the "What" (Business Logic) from the "How" (Execution, Concurrency, Storage). Business modules MUST NEVER directly control execution, orchestrate database transactions, or invoke third-party APIs. Infrastructure must be abstracted behind Kernel-controlled Adapters to ensure distributed determinism, multi-tenant safety, and flawless auditability.

**Core Axioms:**
- **Execution Before Business Logic**: Authentication, Authorization, Tenant Resolution, and Context Hydration must succeed before any domain code runs.
- **No Mutation Without Supervision**: Every data change passes through a centralized execution orchestrator that mandates transaction boundaries, outbox persistence, and audit logging.
- **Everything Is A Controlled Execution**: Tasks, webhooks, user actions, and cron jobs all instantiate an execution envelope. Unsupervised background processing is strictly forbidden.

**Execution Supremacy Hierarchy:**
`Kernel (Authority) > Modules (Rules) > Infrastructure (Storage/Side Effects) > UI (Volatile Projection)`

---

## SECTION 2 — INTERNAL RUNTIME TOPOLOGY

The runtime operates as a strongly typed, strictly layered execution funnel distributed across Edge runtimes and Node.js instances.

**Runtime Layers:**
1. **Edge Runtime (Stateless)**: API Gateway, JWT parsing, rate-limiting, and tenant resolution.
2. **API Runtime (Stateless)**: DTO parsing, boundary validation.
3. **Kernel Runtime (Supervisor)**: DI Container provision, execution context injection, transaction orchestration.
4. **Workflow Runtime (Orchestrator)**: Long-running saga checkpointing, state correlation.
5. **Worker Runtime (Idempotent Executor)**: Asynchronous queue processing, dead-letter routing.
6. **Realtime Runtime (Broadcaster)**: WebSocket delta invalidation routing.
7. **Event Runtime (Broker)**: Outbox polling, event routing, deduplication.
8. **Infrastructure Runtime (Mutative)**: Actual DB transactions, Redis mutations, external API calls.

**Runtime Constraints:**
- **Stateless Layers** (Edge, API, Kernel, Workflow) cache nothing locally and rely strictly on request-scoped configuration.
- **Transactional Layers** (Infrastructure DB RPCs) orchestrate atomic durability.
- **No Side Effects** are permitted anywhere except the `Infrastructure Runtime` acting on behalf of the `Worker/Kernel Runtime` post-commit.

---

## SECTION 3 — EXECUTION PIPELINE

The Command Execution Pipeline is a rigid, sequential funnel. A failure at any stage aborts the execution synchronously.

**The Pipeline:**
1. **UI Interaction**: User executes action (generates `command_id`, `trace_id`).
2. **Middleware**: Rate limiting, basic DoS protection.
3. **Authentication**: JWT signature verification.
4. **Tenant Resolution**: Boundary mapping. Reject cross-tenant attempts.
5. **RBAC Validation**: Check actor role against command claims.
6. **DTO Validation**: Zod/Type strict validation. Strip unknown fields.
7. **State Loading**: Fetch aggregate's current state via DB.
8. **State Machine Validation**: Module executes pure logic `f(state, command) -> (next_state, events)`.
9. **Transaction Preparation**: Kernel compiles DB Mutate operations + Outbox row generations.
10. **DB RPC Execution**: Atomic commit in PostgreSQL. If expected `version` mismatches, ROLLBACK.
11. **Outbox Append**: Part of step 10. `domain_events` durably stored.
12. **Final Commit**: DB lock released.
13. **Realtime Invalidation**: Kernel fires Supabase broadcast for cache invalidation.
14. **Worker Scheduling**: DB polling identifies outbox records; sends to QStash.
15. **Observability Logging**: Trace concluded, execution times pushed to metrics.

**Failures & Semantics:**
- Stages 1-8 execute in memory. Failures yield 400/403.
- Stage 10 is the singular failure boundary for optimistic locking (409).
- Synchronous execution ENDS at Stage 12. UI responds 200 OK. Stages 13-15 are guaranteed asynchronous processes.

---

## SECTION 4 — KERNEL EXECUTION CONTEXT

The `KernelContext` is an immutable, thread-local-equivalent data structure injected universally across the execution tree. Modules and Repositories MUST ONLY use `KernelContext` to query configurations, fetch tenants, or authorize operations. Direct `process.env` or `@supabase/auth` reads inside business logic are fatal violations.

**KernelContext Schema:**
```typescript
interface KernelContext {
  execution: {
    command_id: string; // Idempotency lock
    trace_id: string;   // Observability correlation
    timestamp: number;  // Absolute freezing of time for the executing command
  };
  tenant: {
    id: string;         // Canonical isolation boundary
    tier: 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'suspended';
  };
  actor: {
    id: string;
    role: 'owner' | 'manager' | 'agent' | 'system';
    permissions: string[];
  };
  flags: Record<string, boolean>; // Resolved feature flags
}
```

**Context Propagation Laws:**
- Context is instantiated EXACTLY ONCE at the API boundary (Stage 4).
- Context is immutable. Attempting to override `tenant.id` mid-flight triggers `SecurityViolationException`.
- Context isolates module logic mechanically. Repositories automatically append `WHERE tenant_id = ctx.tenant.id`.

---

## SECTION 5 — INTERNAL SERVICE CONTAINER

The ERP utilizes an advanced Dependency Injection (DI) registry to enforce directionality and isolate side effects.

**Lifecycles:**
- **Singleton Services**: Stateless operational factories (e.g., `PriceCalculator`, `Sanitizer`).
- **Scoped Services**: Instantiated per-request, carrying the `KernelContext` (e.g., `DealRepository`, `NotificationDispatcher`).
- **Transient Services**: Ephemeral logic components heavily leveraging memory (rarely used).

**Forbidden Dependency Directions:**
- Domain Modules (CRM, Finance) CANNOT inject each other. Cross-domain interactions must route through the `Event Runtime` or a specific `Orchestrator` package.
- Domain Modules CANNOT inject Infrastructure implementations directly (e.g., `TwilioClient`). They inject `INotificationAdapter`.

**Boot Sequence:**
1. Read static ENV configuration.
2. Initialize Observability & Logging.
3. Boot Infrastructure Providers (DB Pools, Redis).
4. Register Domain Adapters.
5. Hydrate Execution Engine.
6. Await Health Check resolution.

---

## SECTION 6 — MODULE EXECUTION CONTRACTS

Business modules conform to a strict interface, acting as pure-function factories and rule aggregators.

**Module Requirements:**
Every module must export:
- **Commands**: Allowed user intents.
- **Queries**: Allowed read projections.
- **State Machines**: Pure state transition functions.
- **DTO Schemas**: Zod runtime type guards.
- **Worker Consumers**: Implementations to handle external events.

**Module Behaviors / Anti-Corruption Boundaries:**
- Modifying `Redis` caching via `module/crm/deal.ts` is strictly prohibited. The module emits an event, the `Kernel` manages cache expiration.
- Sending an email via `SendGrid` is forbidden. The module returns `EmailRequestedEvent` in its state machine payload. The Kernel queues this in the Outbox. Worker executes the side effect.

---

## SECTION 7 — TRANSACTION COORDINATION ENGINE

The Kernel coordinates database operations mechanically to guarantee Distributed Deterministic Atomicity.

**Transaction Envelopes:**
Business logic is unaware of transactions. The Kernel manages scopes:
```typescript
const result = await kernel.execute(ctx, async (tx) => {
  const state = await repos.deals.get(dealId, tx);
  const { nextState, events } = DealStateMachine.apply(state, command);
  await repos.deals.save(nextState, expectedVersion, tx);
  await kernel.outbox.append(events, tx);
}); // Kernel executes the BEGIN and COMMIT locally or via RPC.
```

**Guarantees & Constraints:**
- Nested transactions are blocked by the Kernel.
- Optimistic locking (`expectedVersion`) is mandatory on all Aggregate saves.
- Orchestration ownership: If a Saga spans databases, the Kernel implements the Compensating Execution flows automatically upon inner-step failure. 

---

## SECTION 8 — INTERNAL EVENT FRAMEWORK

Events are immutable facts serialized structurally and written to the database in the exact same ACID transaction as the state mutation.

**Event Contracts:**
Events carry no behavioral logic. They contain only `causation_id` (the commanding action), `correlation_id` (trace identifier), and the `diff` or `payload` of the completed action.

**Internal Event Bus Lifecycle:**
1. Stored to `outbox_events` (status: `pending`).
2. PgBouncer/QStash sweeps and invokes Vercel Worker.
3. Worker explicitly `INSERT INTO processed_events` to lock execution and prevent duplicates (deduplication layer).
4. Handled by consumer.
5. Marked as `processed`.

**Laws:**
- Modifying an event structure requires `schema_version` bumps.
- Events cannot be deleted.

---

## SECTION 9 — WORKFLOW & ORCHESTRATION FRAMEWORK

The Saga Engine handles workflows spanning days, multiple agents, or separated domains (e.g., Reservation Execution).

**Execution Resumability:**
- Workflow state is checkpointed in `active_workflows` (e.g., `step: 3, payload: {...}`).
- If the worker crashes, the queue timeout naturally reschedules the event. The engine fetches the workflow, sees it is at Step 3, and skips 1 & 2.

**Orchestration Ownership Laws:**
- Workflows NEVER mutate entities directly. They orchestrate Commands and send them to the Kernel Execution Pipeline, just like a user would.
- If a subsequent step fails, the Orchestrator fires "Compensating Commands" (e.g., `CancelReservationCommand`) to revert the system securely.

---

## SECTION 10 — INFRASTRUCTURE ADAPTER FRAMEWORK

Infrastructure capabilities are physically separated behind robust abstraction interfaces (`IStorage`, `IRealtime`, `IPaymentGateway`).

**Adapter Contracts:**
- **Provider Failover**: Adapters (e.g., Resend via SendGrid fallback) manage their own failover. The Domain is unaware.
- **Circuit Breakers**: Adapters trip internal state if error rates exceed 50% in 1 minute, failing-fast to prevent queue saturation.
- **Rate Limit Protection**: Adapters explicitly block/throttle themselves locally using Redis leaky buckets prior to receiving a 429 from Twilio/Stripe.
- **Timeout Limits**: Strict 4000ms bounds on third-party HTTP connections to prevent Vercel Serverless exhaustion.

---

## SECTION 11 — SECURITY ENFORCEMENT ENGINE

The Kernel Security Gateway is an active firewall blocking horizontal and vertical execution leaks.

**Enforcement Layers:**
- **Tenant Isolation**: Injections of `.eq('tenant_id', ctx.tenant.id)` are mechanically enforced at the Repository boundary by AST modification. Manual omission by a developer is ignored and overwritten by the compiler/wrapper.
- **Privilege Verification**: `Command.required_permissions` is structurally checked against `KernelContext.actor.permissions`.
- **Command Authorization**: Webhook signatures (e.g., Stripe) are evaluated explicitly via `CryptoAdapter` prior to yielding to API runtime.

**Audit Enforcement:**
All commands that alter state create structured, immutable logging vectors in `audit_logs`. The payload captures `Before`, `After`, `Actor`, and `Trace ID`. RLS prohibits `UPDATE` or `DELETE`.

---

## SECTION 12 — OBSERVABILITY & TRACE FRAMEWORK

All logs operate via structured JSON schemas and mandatory trace propagation.

**Propagation Laws:**
A Request generates `trace_id: A`. If the request emits `Event: E1`, `E1` carries `trace_id: A`. When `Worker W` picks up `E1`, it initializes its KernelContext using `trace_id: A`. 

**Mandatory Log Schema:**
```json
{
  "timestamp": "ISO8601",
  "level": "INFO|WARN|ERROR|FATAL",
  "trace_id": "UUID",
  "execution_context": {
    "tenant_id": "UUID",
    "actor_id": "UUID",
    "command": "Sales.CreateDeal"
  },
  "metrics": { "duration_ms": 142 },
  "message": "Transaction committed successfully."
}
```

**Critical Alert Thresholds:**
- Worker Queue Delay > 60 seconds (P1).
- Rate of 500 API Errors > 1% over 5m (P1).
- Outbox Dead-Letter Queue > 0 (P2).

---

## SECTION 13 — RUNTIME FAILURE ENGINEERING

The ERP gracefully degrades; it never crashes silently.

**System Degradation Philosophy:**
- **Fail-Closed**: Auth verification, JWT validation, Tenant bounds. If unavailable, deny access.
- **Fail-Open**: Cache retrieval. If Redis is down, proceed to OLTP Postgres (with heavy rate limit shedding applied).
- **Execution Shedding**: If DB CPU sustains >80%, the Edge drops non-critical read projections (Dashboards) but preserves mutative Commands (Payments, Signatures) using distinct load-balancer priority pools.

**Operational Recovery:**
Worker duplicated limits are mitigated structurally via idempotency guarantees. Retry storms from mobile clients are halted by Edge-level 429 backoff headers.

---

## SECTION 14 — INTERNAL FRAMEWORK ANTI-PATTERNS

**ABSOLUTELY FORBIDDEN:**

1. **Direct Supabase Usage Inside Modules**
   - *Why*: Developers bypass the KernelContext, risking cross-tenant data leaks and missing outbox event triggers.
   - *Alternative*: Consume explicit Repositories constructed internally by the Kernel.
2. **Cross-Module Repository Access**
   - *Why*: Modifying a Deal from the Finance module breaks DDD context encapsulation and creates cyclical dependencies.
   - *Alternative*: Finance issues an `InstallmentPaid` event; the Deal Orchestrator consumes it.
3. **Mutable Events**
   - *Why*: In-memory object modification destroys historical replay capabilities.
   - *Alternative*: Deeply freeze (`Object.freeze()`) all Event DTOs immediately upon instantiation.
4. **Shared Mutable Singletons**
   - *Why*: Storing state in `const cache = {}` across Node lambda executions leads to catastrophic data leaks between Tenant A and Tenant B.
   - *Alternative*: All states must reside exclusively in request-scoped `KernelContext`.
5. **Fire-and-Forget Async Calls**
   - *Why*: `executeBackground()` without awaiting effectively vanishes if Vercel freezes the instance post-response.
   - *Alternative*: Push immediately to Outbox within the synchronous transaction bounds.
6. **Business Logic Inside Controllers**
   - *Why*: Next.js server actions / route handlers cannot be tested independently and bind logic to HTTP semantics.
   - *Alternative*: Controllers parse DTOs and invoke `Kernel.execute(command)`.

---

## SECTION 15 — FINAL KERNEL READINESS AUDIT

This execution framework serves as a strict FAANG-grade platform authorization gate.

**THE ERP IS NOT PRODUCTION-READY UNLESS:**
- [ ] All execution flows are deterministic and bound to finite timeouts.
- [ ] All mutations implement optimistic locking preventing "lost updates".
- [ ] All transactions execute inside a bounded connection enforcing AC/ID integrity with Outbox synchronization.
- [ ] All external side effects (email, payment) are 100% idempotent and tolerate identical replays.
- [ ] All modules are completely isolated without arbitrary DB join cross-contamination.
- [ ] All outbox events evaluate `processed_events` using DB unique constraints to ensure exactly-once execution semantics.
- [ ] All workflow coordination (Sagas) persist progress ensuring resume-ability.
- [ ] All queries mechanically bind to `tenant_id` at the AST/Repository execution layer.
- [ ] All observability traces pass correlation IDs across async, HTTP, and DB boundaries continuously.
- [ ] All infrastructure failures structurally degrade, reverting to manual/polling modes without total systemic collapse.
- [ ] All security boundaries are mapped continuously verifying Actor vs Context matrix maps.
