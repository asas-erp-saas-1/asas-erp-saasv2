# RUNTIME SELF-HEALING SYSTEM

## Overview
Phase 12 transforms the ERP from a "governed" runtime into a "self-healing" distributed enterprise foundation. Critical infrastructure degrades gracefully, and projection consistency is continuously audited and repaired.

## Execution Components

### 1. CQRS Projection Stabilization
- **Engine**: The `ProjectionEngine` strictly enforces sequential Read Model updates. Upserts are perfectly idempotent.
- **Rebuilder**: The `ProjectionRebuilder` can truncate and reconstruct any single Tenant's Read Model strictly from the immutable Outbox stream in complete isolation, achieving zero-downtime repair.

### 2. Event Ordering Guarantees
- The `EventOrderingCoordinator` mechanically verifies Causal Sequences (`version > lastProcessedVersion`). Out-of-order events trigger halting, allowing QStash back-off retries to self-correct sequence gaps.

### 3. Replay Determinism
- `ReplayRuntimeMode` guarantees that during event replays or historical rebuilds, physical API side-effects (payment charges, SMS sending) are perfectly suppressed using `.isActive()` guards.

### 4. Distributed Workflow Consistency
- `SagaCoordinator` intercepts long-running operations. Worker crashes or timeouts result in Dead-Letter triggers that invoke explicit `COMPENSATING` tracks across the microservice bound context.

### 5. Projection Drift Detection
- `ProjectionDriftDetector` continuously audits Read Models against pure RAM-hydrated aggregates. Hashes are diffed; divergences trigger automatic quarantine and per-aggregate isolated rebuilds.

### 6. Runtime Self-Healing
- Network partitions or timeouts to Redis/Upstash flag services in the `DegradedModeRouter`. The system cascades logic smoothly (e.g. falling back to Postgres queues temporarily) and auto-recovers.

### 7. Chaos Engineering
- The `chaos-mesh` tool enforces live system degradation to guarantee rollback paths, out-of-order execution recovery, and DB partitioning limits do not break enterprise availability bounds.
