# DISTRIBUTED CONSENSUS & CONFLICT GOVERNANCE

## 1. Overview
When operating active-active database clusters, eventual consistency creates race conditions. If a user modifies Deal A in `us-east` and another user modifies Deal A in `us-west` within the same 500ms window, the system must deterministically agree on the outcome without locking globally on every request.

## 2. Vector Clock Coordination
`VectorClockCoordinator` replaces simple integer versions to track causality in a distributed environment. Format: `[us-east: 4, us-west: 2]`. 

## 3. Conflict Resolution Engine
If a collision occurs:
- `ConflictResolutionEngine` intercepts the divergence.
- Deterministic merge policies execute (e.g., LWW - Last Write Wins based on TrueTime/NTP timestamps, or field-level granular merges for independent attribute updates).

## 4. Aggregate Consistency Validation
`AggregateConsistencyValidator` periodically compares hashes of aggregate projections across regions. Any mismatch triggers an automated `EventVersionArbitrator` reconciliation loop.
