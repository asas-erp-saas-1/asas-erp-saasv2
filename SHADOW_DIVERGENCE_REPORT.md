# SHADOW DIVERGENCE REPORT: LIVE EXECUTION TESTING

## Overview
This report establishes the protocol for computing divergence during the Expand-Contract dual-write execution phase. Shadow execution isolates logic errors without disrupting production state.

## Live Dual-Execution Matrix

### 1. The Interception Point
Every HTTP `POST` mutating an entity must hit an API wrapper that forks execution:
*   **Path A (Canonical)**: Dispatches to legacy `src/services/` CRUD logic. Executes physical database writes and commits.
*   **Path B (Shadow)**: Instantiates `Kernel.execute()` with `isShadow = true`. Executes exact State Machine transition, builds output hash, and drops the commit.

### 2. Divergence Comparison Variables
The system captures and compares the following values for identical incoming requests:
1.  **State Projection Hash**: SHA-256 string representation of the NextState payload from Domain logic vs the resulting row shape in PostgreSQL.
2.  **Event Generation**: Did the legacy system trigger unexpected side-effects immediately? Which events were generated in Outbox representation?
3.  **Timestamp Skew**: Is there a temporal desync violating timestamp immutable laws?

### 3. Conflicting Transitions Detection
*   A discrepancy where Legacy updates `status = closed_won` but the Shadow Kernel throws an `IllegalTransitionError`. This highlights missing business rule validations in the legacy codebase that are correctly trapped in the Kernel, or conversely, overly strict boundaries in the new Kernel that clash with undocumented reality.

### 4. Metrics Reporting (Datadog)

Divergence statistics are piped into Datadog metrics:

*   `asas.kernel.shadow.executions` (Count)
*   `asas.kernel.shadow.divergence` (Count, tagged by `command`, `violation_type`)
*   `asas.kernel.shadow.divergence_rate` (Gauge, targeting 0.00%)

### 5. Replay Inconsistency Triage
If an event divergence occurs:
1.  Pull the specific `TraceID`.
2.  Serialize the `payload`.
3.  Inject into `.local/replay.sh` and execute locally via VS Code debugger.
4.  Step through State Machine transition rules to identify the mismatch map.

## Triage Workflows

1. **Hash Mismatch**: `Kernel` drops an empty string while `Legacy` stored `null`.
   * *Resolution*: Adjust Domain schema to serialize `null` strictly, adhering to database normal form. 
2. **Missing Action**: Legacy called `revalidatePath()` directly but generated no Event.
   * *Resolution*: Ensure Kernel maps the resulting UI invalidation to a websocket `INVALIDATE` ping generated from the Worker.
