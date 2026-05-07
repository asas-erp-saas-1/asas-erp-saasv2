# FRONTEND KERNEL TRANSITION: COMMAND UX

## 1. Overview
The frontend can no longer trust itself to know the ultimate outcome of a mutation. Moving to Command execution means we are adopting **Optimistic Rollback** as the standard UX paradigm. Server actions (`dealActions.ts`) that directly mutated Supabase paths have been completely disabled.

## 2. Command Dispatching System

The UI relies entirely on explicit Commands to express intent. 

```tsx
import { useCommandExecute } from '@/lib/hooks/useCommandExecute';

export function DealStatusDropdown({ deal }) {
  const { commandState, dispatch } = useCommandExecute(deal);

  const handleChange = (newStatus) => {
    dispatch({
      type: 'SET_DEAL_STAGE',
      idempotencyKey: crypto.randomUUID(),
      expectedVersion: commandState.version,
      payload: { stage: newStatus }
    });
  };

  return (
    <Select value={commandState.status} onValueChange={handleChange}>
       {/* UI Elements */}
    </Select>
  );
}
```

## 3. Optimistic Failure & Conflict Handling

A unified `useCommandExecute` handler is implemented:

1.  **Draft State Application**: Resolves the action in-memory and re-renders the component using the projected output. 
2.  **Network Dispatch**: `POST /api/commands`
3.  **Conflict Rejection (HTTP 409)**: If the DB RPC returns a `version_conflict`, the backend yields a 409 error.
4.  **Rollback UX**:
    *   The `useCommandExecute` hook forcefully reverts `commandState` to `initialState`.
    *   A generic Toast notification is fired: "Someone else modified this record while you were editing. The data has been refreshed."
    *   It triggers an SWR/React Query invalidation to reload the latest state automatically.

## 4. Realtime Invalidation Channels

When an `outbox_events` is processed by the QStash worker, it emits a Supabase Broadcast indicating pure model changes.

```typescript
// Payload from backend indicating version change
{
  type: 'MODEL_INVALIDATION',
  payload: {
    aggregateId: 'uuid',
    entity: 'deals',
    newVersion: 7
  }
}
```

The frontend global `useRealtimeSynchronization` hook listens to these across the active Tenant Channel (`tenant:{agency_id}`). If it intercepts a `newVersion` that is `> deal.version` loaded deeply in the React tree, it invokes a query invalidation to silently pull the updated model into view, avoiding stale reads.

## 5. Transition Path
*   **Step 1**: Migrate existing raw Supabase data fetches into specific Read routes (SWR wrappers).
*   **Step 2**: Abstract mutation buttons to use `useCommandExecute`.
*   **Step 3**: Strip mutation logic from `dealActions.ts`.
