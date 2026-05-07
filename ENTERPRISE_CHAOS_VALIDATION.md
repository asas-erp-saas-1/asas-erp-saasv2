# LIVE RELIABILITY VALIDATION (CHAOS ENGINEERING)

## 1. Overview
Verification of survivability requires active attacks against the production-like sandbox.

## 2. Chaos Scenarios Executed via `chaos-mesh`
- **Regional Blackout:** Drops all networking from `us-east` to simulate a total datacenter loss. Asserts DNS auto-fails to `us-west`.
- **Event Duplication:** Manually clones QStash dispatch requests 5x sequentially. Asserts the `WorkerConcurrencyLimiter` and idempotency keys reject duplicate commitments stringently.
- **Queue Saturation:** Injects 5,000,000 mock events for a single noisy tenant. Asserts isolation logic routes them without starving neighboring tenant pipeline metrics.
- **Cache Corruption:** Pushes malformed read models into Redis. Asserts the `SWRConsistencyEngine` detects drift and safely reconstructs the projections locally.
