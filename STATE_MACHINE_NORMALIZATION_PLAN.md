# STATE MACHINE AND WORKFLOW NORMALIZATION

## 1. INLINE BUSINESS LOGIC ERADICATION
Currently, logic determining whether a `Lead` can convert to a `Deal` or a `Deal` can `Close` is scattered across React components, Server Actions, and database constraints.

**Goal**: Centralize all transition laws into `@asas/domain/src/*`.

## 2. TRANSITION EXTRACTION MAP

### Entity: LEAD
*   **States**: `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`
*   **Rules Extracted**:
    1.  Cannot go from `NEW` immediately to `CONVERTED`. Must pass through `QUALIFIED` or `CONTACTED`.
    2.  If `LOST`, requires a `.reason` explicitly typed. Terminal State.
    3.  `CONVERTED` generates an `OutboxEvent: LEAD_CONVERTED` which MUST trigger a Saga creating a `DEAL`.

### Entity: DEAL
*   **States**: `PROSPECTING`, `NEGOTIATING`, `CLOSED_WON`, `CLOSED_LOST`
*   **Rules Extracted**:
    1.  `Terminal Block`: A `CLOSED_WON` deal cannot be sent backwards to `PROSPECTING`.
    2.  `Financial Guard`: Transitioning to `CLOSED_WON` requires `agreedPrice > 0`.

## 3. ILLEGAL TRANSITION DETECTION SYSTEM

State Machines must export pure functions that throw specific Domain Errors rather than generic exceptions. This enables the UI to accurately describe WHY a workflow was rejected.

### File Target: `@asas/domain/src/core/DomainErrors.ts`

```typescript
export class IllegalTransitionError extends Error {
  constructor(
    public readonly aggregate: string,
    public readonly fromState: string,
    public readonly toState: string,
    public readonly reason: string
  ) {
    super(`[Domain] Cannot transition ${aggregate} from ${fromState} to ${toState}: ${reason}`);
    this.name = 'IllegalTransitionError';
  }
}
```

### Usage Inside Pure State Machine:

```typescript
import { IllegalTransitionError } from '../core/DomainErrors';

export class LeadWorkflow {
  static convert(state: LeadState): { nextState: LeadState, events: any[] } {
    if (state.status === 'NEW') {
      throw new IllegalTransitionError('Lead', 'NEW', 'CONVERTED', 'Lead must be contacted first.');
    }
    
    // Process Success Output
  }
}
```

## 4. RUNTIME ENFORCEMENT
Because the UI must adapt to these strict transition systems, Frontend interfaces must physically request the valid boundaries from the Domain logic before attempting the mutation.

The UI components will utilize a shared module equivalent:
`LeadWorkflow.getAvailableTransitions(currentState)` to render dropdown options, explicitly grey-ing out invalid choices in the UI instead of allowing API bounce-backs.
