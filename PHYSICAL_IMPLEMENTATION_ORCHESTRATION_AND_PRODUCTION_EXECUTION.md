# PHYSICAL IMPLEMENTATION ORCHESTRATION & PRODUCTION EXECUTION

## SECTION 1 — IMPLEMENTATION EXECUTION STRATEGY

### Physical Execution Initiation
Implementation begins from the absolute bottom of the architecture stack (Database/Kernel) and flows upward to the API and UI. Top-down implementation is strictly forbidden as it forces temporary hacks and mock layers. 
- **Legacy Survival**: The legacy system remains exactly where it is. Modifications to `/src/legacy` routes are blocked via CI. Migrated features live in `/apps/api/v2/`.
- **Shadow Execution**: New logic runs parallel to legacy logic. The Kernel executes the State Machine, evaluates the desired DB state, but drops the commit if the `X-Shadow-Mode` header is present. A diff is generated, comparing Legacy mutation vs Kernel expected mutation.
- **Progressive Authority**: Only when the diff error rate hits 0.00% for 7 days does Vercel edge-routing shift the canonical path to the Kernel. 
- **Fallback Guarantee**: During the 14-day observation period post-cutover, a single `REDIS_KILL_SWITCH_V2=false` variable can instantly route traffic back to the legacy handlers without requiring a DB synchronization, thanks to Expand-Contract schema designs.

---

## SECTION 2 — PHYSICAL CODEBASE RECONSTRUCTION

### Final Enterprise Monorepo Topology
The monorepo structure physically prevents domain leakage via Node package boundaries (npm workspaces) and `tsconfig.json` project references.

```text
/
 ├── packages/
 │    ├── @asas/kernel/         # Strict execution supervisor, context injection
 │    ├── @asas/domain/         # PURE TypeScript: Models, State Machines, DTOs (NO IO)
 │    ├── @asas/infrastructure/ # Supabase RPC bindings, QStash clients, SendGrid
 │    ├── @asas/events/         # Event schemas, payload validators, versioning
 │    └── @asas/observability/  # OpenTelemetry wrappers, Datadog forwarders
 ├── apps/
 │    ├── api-gateway/          # Next.js Serverless: Parses HTTP -> Yields to Kernel
 │    ├── workers/              # Next.js Serverless: QStash hooks, Sagas, Dead-Letters
 │    └── web/                  # Next.js Client: React, Command UX, Optimistic UI
 ├── tooling/
 │    └── ast-enforcer/         # Custom Babel scripts for CI rules
 └── package.json
```

### Dependency Directionality & Enforcement
- **Import Rules**: `apps/web` can import `@asas/domain` and `@asas/events`. It CANNOT import `@asas/infrastructure`.
- **Compile-Time Enforcement**: We deploy `dependency-cruiser`. A `.dependency-cruiser.js` file mechanically fails the GitHub Action if `packages/domain` imports `dependencies: ["@supabase/supabase-js"]`. Domain logic must remain I/O agnostic.
- **AST Validation Strategy**: Custom ESLint rule `@asas/no-direct-db`: Ast traversal searches for any instantiation of `supabase.from()` outside of `packages/infrastructure`. Violations reject the git commit.

---

## SECTION 3 — KERNEL IMPLEMENTATION

### Kernel Execution Code Architecture
The Kernel is the lone gateway to mutations.

```typescript
// packages/kernel/src/ExecutionPipeline.ts
export class Kernel {
  static async execute<TCommand, TResult>(
    reqContext: HttpRequest,
    command: TCommand,
    pipeline: IExecutionPipeline<TCommand, TResult>
  ): Promise<TResult> {
    
    // 1. Context Creation & JWT Enforcement
    const ctx = await ContextHydrator.build(reqContext);
    
    try {
      // 2. Audit Trail Generation & Tracing
      Observability.setTrace(ctx.traceId);
      
      // 3. RBAC & Policy Execution
      await SecurityGovernor.authorize(ctx, command);

      // 4. State Hydration (Tenant Isolation Enforced by Repo)
      const currentState = await pipeline.repository.get(command.aggregateId, ctx);

      // 5. Pure Domain Logic Execution
      const { nextState, events } = pipeline.stateMachine.transition(currentState, command);

      // 6. Transaction Orchestration (All or Nothing)
      await DBTransaction.execute(async (tx) => {
        // Save State (Validates Optimistic Lock)
        await pipeline.repository.save(nextState, command.expectedVersion, tx);
        
        // Append Outbox Events
        await OutboxAdapter.append(events, ctx, tx);
      });

      // 7. Post-Commit Realtime Invalidation
      await RealtimeBroadcaster.ping(command.aggregateId, nextState.version);

      return nextState;

    } catch (error) {
      if (error instanceof OptimisticLockException) ErrorTracker.warn(error);
      else ErrorTracker.capture(error);
      throw error;
    }
  }
}
```

---

## SECTION 4 — REPOSITORY & DATABASE EXECUTION LAYER

### Physical Repo Implementations & Isolation Wrapper
Repositories ensure no query executes without `tenant_id` context.

```typescript
// packages/infrastructure/src/repositories/DealRepository.ts
export class DealRepository {
  async save(deal: Deal, expectedVersion: number, tx: TransactionContext): Promise<void> {
    const rpcPayload = {
      tenant_id: tx.ctx.tenant.id, // MECHANICALLY INJECTED
      deal_id: deal.id,
      expected_version: expectedVersion,
      payload: deal.toJSON()
    };

    // Use Postgres RPC to execute the atomic update with concurrency check
    const { data, error } = await tx.client.rpc('core_update_deal_v1', rpcPayload);

    if (error?.code === 'P0001' && error.message.includes('version_conflict')) {
      throw new OptimisticLockException(`Deal ${deal.id} was modified by another agent.`);
    }
    if (error) throw new InfrastructureException(error);
  }
}
```

### PostgreSQL RPC Implementation Example
The RPC ensures atomic isolation that Edge Node runtimes cannot guarantee due to TCP pool fragmentation.

```sql
CREATE OR REPLACE FUNCTION core_update_deal_v1(payload jsonb) RETURNS void AS $$
DECLARE
  current_version int;
BEGIN
  SELECT version INTO current_version FROM deals 
  WHERE id = (payload->>'deal_id')::uuid 
  AND tenant_id = (payload->>'tenant_id')::uuid FOR UPDATE;

  IF current_version != (payload->>'expected_version')::int THEN
    RAISE EXCEPTION 'version_conflict';
  END IF;

  UPDATE deals SET 
    status = payload->>'status',
    version = version + 1
  WHERE id = (payload->>'deal_id')::uuid;
END;
$$ LANGUAGE plpgsql;
```

---

## SECTION 5 — EVENT BUS & OUTBOX IMPLEMENTATION

### Worker Execution Flow & Duplicate Prevention
Workers physically operate on QStash Webhooks, executing atop Vercel Serverless.

```typescript
// apps/workers/src/handlers/StripeChargeWorker.ts
export default async function workerHandler(req: Request) {
  const event = await parseAndValidateEvent(req);
  
  // 1. Idempotency Lock
  const lock = await db.from('processed_events')
    .insert({ event_id: event.id, worker: 'StripeChargeWorker' });
  
  if (lock.error?.code === '23505') { // Postgres Unique Constraint Violation
    return new Response('Already Processed', { status: 200 }); // Ack to QStash
  }

  // 2. Safe Side-Effect Execution
  try {
    await StripeClient.charges.create({
      amount: event.payload.amount,
      idempotencyKey: event.id // Pass UUID to external provider
    });
    
    // 3. Mark event processed in our system
    await db.from('outbox_events').update({ status: 'PROCESSED' }).eq('id', event.id);

  } catch (err) {
    // DO NOT CLEAR processed_events lock if it's a Stripe 5xx! 
    // QStash will retry, the lock catches it, and we resume safely.
    if (err.isRetryable) throw err; // Prompts QStash to queue again
    await DeadLetterRouter.route(event, err);
  }
}
```

---

## SECTION 6 — STATE MACHINE IMPLEMENTATION

### Pure Transition Validation
State Machines are tested in nanoseconds because they have zero I/O.

```typescript
// packages/domain/src/sales/DealStateMachine.ts
export class DealStateMachine {
  static reserve(state: DealState, cmd: ReserveCommand): TransitionResult {
    if (state.status !== DealStatus.NEGOTIATING) {
      throw new IllegalTransitionException(`Cannot reserve deal in status ${state.status}`);
    }
    
    if (cmd.payload.agreedPrice < state.limits.minimumMarginPrice) {
      throw new BusinessRuleException('Agreed price violates minimum margin limits.');
    }

    const nextState = { ...state, status: DealStatus.RESERVED, version: state.version + 1 };
    const event = new DealReservedEvent(nextState.id, cmd.payload);

    return { nextState, events: [event] };
  }
}
```

---

## SECTION 7 — CQRS & READ MODEL EXECUTION

### Analytical Projection System
Dashboards NEVER query the `deals`, `payments`, and `users` tables via `JOIN` chains during runtime. 
- **Projection Workers**: An event `DealStatusChanged` triggers the `PipelineProjectionWorker`.
- **Worker Duty**: It calculates the pipeline shift and updates an optimized, flat JSONB projection table `tenant_pipeline_views`.
- **Read Replica Routing**: Dashboard UI hits `/api/metrics/pipeline` which strictly reads from a Read-Replica DB instance hooked to the `tenant_pipeline_views` table via a stale-while-revalidate Redis layer. OLTP database CPU impact is structurally zero.

---

## SECTION 8 — FRONTEND EXECUTION RECONSTRUCTION

### Command-Oriented UI & Optimistic Rollback UX
Generic API bindings are replaced with a targeted Command Dispatcher.

```tsx
// apps/web/src/hooks/useCommandExecute.ts
function useCommandExecute(deal) {
  const [localState, setLocalState] = useState(deal);

  const execute = async (commandType, payload) => {
    const originalState = {...localState};
    const commandId = randomUUID();
    
    // 1. Optimistic Update
    setLocalState(draftState(originalState, commandType, payload));

    try {
      const res = await api.post('/execute', {
        command_id: commandId,
        expected_version: originalState.version,
        payload
      });
      if (!res.ok) throw new Error(res.status);
    } catch (e) {
      // 2. Violent Rollback on Failure
      setLocalState(originalState);
      Toast.error(e.code === 409 ? 'Modified by another agent.' : 'Execution failed.');
    }
  };
  return { defaultState: localState, execute };
}
```

---

## SECTION 9 — WORKER & SAGA IMPLEMENTATION

### Saga Checkpoint Schema
Long-running workflows use persistent state machines to survive multi-day timeouts.

```sql
CREATE TABLE saga_executions (
  workflow_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  saga_type VARCHAR NOT NULL, -- e.g., 'DocumentSignatureSaga'
  current_step INT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR DEFAULT 'running', -- 'running', 'completed', 'compensating', 'failed'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Resumability**: If Step 3 (Email Generation) fails due to a Vercel timeout, QStash retries 5 minutes later. The worker queries `saga_executions`. It sees `current_step = 3` and ignores Steps 1 & 2.

---

## SECTION 10 — CI/CD & ENFORCEMENT IMPLEMENTATION

### CI/CD Execution Order & Production Gating
GitHub Actions executes pipeline in exact sequential logic:
1. **`pnpm run enforce:ast`**: Fails build if Kernel bypass detected.
2. **`pnpm run enforce:boundaries`**: Fails build if Dependency Cruiser catches cross-domain imports.
3. **`pnpm run typecheck`**: Exacting TypeScript strict compilation across monorepo.
4. **`pnpm run test:idempotency`**: Unit tests proving State Machines are pure.
5. **`supabase db diff`**: Generates migration plan. Fails if detection of destructive `DROP COLUMN` exists.
6. **Deploy to Preview (Vercel)** + **Ephemeral DB Run**.
7. **E2E Playwright Path execution**.
8. **Production PR Gate**: Requires Platform Lead Approval.

---

## SECTION 11 — OBSERVABILITY & TRACE IMPLEMENTATION

### Trace Propagation Flow
- Vercel Edge generates `Traceparent` header (W3C standard pattern).
- Node runtime retrieves the Traceparent and initiates OpenTelemetry Span: `StartCommandExecution`.
- Outbox appended event includes `trace_id` natively in `event.metadata`.
- QStash webhook HTTP payload passes `trace_id`.
- Worker initiates new sibling Span `StartWorkerExecution` linking to `trace_id`.
- DataDog / Grafana visualizes the exact lifespan: User Click -> Deal Converted -> Webhook Processed -> SMS Sent.

---

## SECTION 12 — PHYSICAL IMPLEMENTATION ROADMAP

**Wave 1: Substrate Reconstruction (Weeks 1-3)**
- Stand up monorepo tooling, AST enforcers.
- Deploy DB Schema Additions (`outbox_events`, `processed_events`, `audit_logs`, `version` columns).
- Stand up PgBouncer infrastructure for connection pooling.

**Wave 2: Kernel & Identity Implementation (Weeks 4-6)**
- Build `Kernel.execute()` wrapper.
- Intercept existing Edge/API pathways, hydrating User context securely.

**Wave 3: Subsystem Domain Isolation & Red-Green Testing (Weeks 7-10)**
- Rewrite CRM/Sales CRUD logic into pure State Machines.
- Shadow Mode activation: Both systems generate output. Compare hashes in DataDog. Target: 0% divergence.

**Wave 4: Worker & Side-Effect Migration (Weeks 11-13)**
- Strip all `await sendEmail()` from API functions. Route to QStash workers.
- Verify 100% `processed_events` idempotency coverage locally.

**Wave 5: UI Refactoring & Cut-Over (Weeks 14-16)**
- Hook React UI to `Kernel` endpoints using `expected_version` patterns.
- Kill Switch Flipped: Legacy routes throw 410 Gone. Backend is fully migrated.

---

## SECTION 13 — PRODUCTION EXECUTION ANTI-PATTERNS

### ENGINEERING CRIMES
1. **Partial Event Emission**
   - *Crime*: Inserting state via Kernel, but using a local `EventEmitter.emit()` to trigger a background function instead of the Outbox.
   - *Result*: Node process terminates before background function finishes. Data saved, subsequent actions lost permanently.
   - *Prevention*: Disable `EventEmitter` across the codebase. Enforce physical Outbox arrays.
2. **Catching State Machine Invariants Silently**
   - *Crime*: Wrapping a transition in `try { ... } catch { return 200 }` to avoid UI crash banners.
   - *Result*: System tells user "Saved", but DB rolled back. Catastrophic trust failure.
   - *Prevention*: Top-level ErrorBoundary routing. 4XX responses mandate explicit client-side handling.
3. **Database Connection Hijacking**
   - *Crime*: Using a separate Supabase Client instance to run a query mid-transaction.
   - *Result*: The second query knows nothing of the first query's locks. Deadlocks ensue.
   - *Prevention*: Require passing the explicit `TransactionContext` (`tx.client`) downward to all repos.
4. **Mutating the Outbox Payload Post-Serialization**
   - *Crime*: Appending metadata to an event *after* calling `JSON.stringify(payload)`.
   - *Result*: Hash signatures fail, audit trails are corrupted, replay mechanics desync.
   - *Prevention*: Enforce `Object.freeze()` upon Event instantiation.

---

## SECTION 14 — FINAL PRODUCTION READINESS MATRIX

### Launch Authorization Checklist
- [ ] **Kernel Enforcement**: AST scanner successfully blocks direct Supabase imports in UI/Route Handlers.
- [ ] **Replay-Safety**: Devs have executed `npm run trigger-dlq` and verified workers safely skip processing already-processed events.
- [ ] **Observability**: A single trace ID correctly returns queries spanning Next.js, Postgres boundaries, and Vercel Worker execution logs.
- [ ] **Migration Safety**: DB schema diff contains zero `DROP` or `DELETE` statements. Backward compatibility is mathematically sound.
- [ ] **Scalability Readiness**: PgBouncer pooling limits verified (Max Connections = 200, Max Clients = 10k). Vercel serverless timeout boundaries explicitly aligned with DB `statement_timeout`.
- [ ] **Rollback Readiness**: LaunchDarkly/Redis feature flag successfully tested against live DB, cleanly routing traffic back to legacy functions and reverting frontend capability schemas instantly.
- [ ] **Architecture Preservation**: Dependency Cruiser reports zero violations. The Domain is completely untethered from external dependencies.
