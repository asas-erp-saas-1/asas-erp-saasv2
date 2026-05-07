# SHADOW EXECUTION SYSTEM

To guarantee 0% downtime and absolute preservation of production continuity, we establish a Shadow Mode proxy network. 

## 1. Request Interception
The API Gateway interceptor duplicates incoming traffic.
1. The original traffic continues executing the legacy CRUD `server/services/*` functions to safely update the database as before.
2. The proxy forks an identical `async` payload and routes it to the `Kernel`.

## 2. Kernel "Dry-Run" Execution
- The Kernel receives the request with header `X-Shadow-Mode: true`.
- Top-level `KernelContext` detects `isShadow = true`.
- **RBAC**: Evaluates Auth. 
- **State Machine**: Transitions pure domain logic and generates the new state + events.
- **Repository Abstraction**: *Drops* the physical atomic commit. Returns success immediately.

## 3. Divergence Hash Map
Before dropping the commit, the Kernel calculates a stable JSON hash of the intended DB mutation (e.g., `{ deal_status: 'won', updated_at: '2026-X' }`) and the emitted events. 

- A `DataDog / Observability` daemon correlates the `TraceID` between the Legacy Mutator and the Kernel Intended Mutator.
- If the hashes diverge, it emits an alert: "SHADOW DIVERGENCE DETECTED ON `ReserveDealCommand`."
- Engineering team inspects the payload trace and refines the pure State Machine code.

## 4. Cut-Over Sequence (Traffic Shifting)
The Vercel Edge controls physical routing.
- **Phase 1**: 100% Legacy. 100% Shadow. Read divergence reports.
- **Phase 2**: 90% Legacy. 10% Kernel authoritative (writes actually commit). 
- **Phase 3**: 10% Legacy. 90% Kernel.
- **Phase 4**: 100% Kernel. Legacy is terminated.

During Phase 2 & 3, Redis Feature Flags ensure a user doesn't bounce between logic systems.

## 5. Implementation Targets
- Target `/src/middleware.ts` to implement Edge-level fork logic.
- Target `packages/kernel/src/ExecutionPipeline.ts` to inject `.isShadow` short-circuits at the `DBTransaction.execute()` boundary.
