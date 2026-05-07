# FRONTEND COMMAND EXECUTION RECONSTRUCTION

The current Next.js Frontend follows CRUD patterns, with Server Actions executing immediate, un-checked database updates (`dealActions.ts`). We must physically transform this into a Command Dispatch UI.

## 1. Command Dispatch Architecture
The frontend no longer "Calls API Routes to Save Data". The UI executes localized Commands.

```tsx
// Example of physical migration targets for the Deal Stage progression
export interface SetDealStageCommand {
  commandId: string; // Idempotency
  aggregateId: string; // The Deal UUID
  type: 'SET_DEAL_STAGE';
  expectedVersion: number;
  payload: {
    stage: 'prospecting' | 'negotiation' | 'closed_won' | 'closed_lost';
    notes?: string;
  };
}
```

## 2. Dispatchers & Optimistic Execution (`useCommandExecute`)
A new React Context / Hook (`useCommand.ts`) is established. When `dispatch(cmd)` is called:
1. **Apply Mutator**: The frontend State Machine transitions synchronously in RAM.
2. **Lock Input**: UI marks component as purely visual loading.
3. **Execute Async`: Send JSON to API Gateway (`/api/command-gateway`).
4. **Handle 409 Conflict**: If DB rejects due to `expectedVersion` mismatch, UI forcefully rolls back state and triggers standard `VersionConflictDialog`.

## 3. Realtime Invalidation via WebSocket
- Supabase Realtime is kept for Read-Model delivery only.
- The UI listens on `tenant:{tenant_id}:deals:{deal_id}` channel.
- If an Outbox Worker broadcasts a version `v5` event but the UI has `v4`, the UI executes `revalidateTag` or triggers `SWR/ReactQuery` invalidation to re-fetch identical data safely.

## 4. UI Transition Steps
1. Deprecate direct usage of `src/actions/*.ts`. Replace them with `packages/domain/commands/`.
2. Wrap forms in `useCommandDispatch({ onSuccess, onRollback })`.
3. Eradicate generic error handlers in favor of strict `BusinessRuleViolation` component mapping.
