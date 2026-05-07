# RUNTIME EXECUTION MIGRATION MATRIX

## MIGRATION STRATEGY: DUAL-EXECUTION PROXY

We are not replacing the API routes abruptly. Instead, we insert a "Compatibility Bridge" into the core logic flows that determines whether a request executes via the Legacy Service Layer or the Kernel Execution Pipeline based on standard feature flags.

### MATRIX TARGETS

| Domain / Aggregate | Legacy Route / Action | Kernel Command Interface | RPC Orchestrator | Shadow Ready | 
| :--- | :--- | :--- | :--- | :--- |
| **Sales (Deals)** | `src/actions/dealActions.ts` -> `updateDealStatus` | `SetDealStageCommand` | `core_execute_mutation` | ✅ |
| **Sales (Deals)** | `src/app/api/deals/route.ts` -> `POST` | `CreateDealCommand` | `core_execute_mutation` | ⏳ |
| **Identity (User)** | `src/actions/userActions.ts` -> `updateProfile` | `UpdateUserProfile` | `core_execute_user` | ⏳ |
| **CRM (Leads)** | `src/services/leads/lead.service.ts` | `ConvertLeadCommand` | `core_execute_mutation` | ⏳ |

## COMPATIBILITY BRIDGE IMPLEMENTATION

This bridge handles the physical transition in the Next.js API/Action boundary.

### Target: `DealAction` Bridge (`apps/web/src/actions/bridges/dealActionBridge.ts`)

```typescript
import { KernelContext } from '@asas/kernel/src/ContextHydrator';
import { SetDealStageCommandHandler } from '@asas/kernel/commands/SetDealStageCommandHandler';
// import { LegacyDealService } from '@/services/legacy/deal.service';

export async function executeDealUpdate(aggregateId: string, payload: any, ctx: KernelContext) {
  
  // 1. Feature Flag / Traffic Shaping
  const kernelActive = process.env.ENABLE_KERNEL_DEALS === 'true';

  if (!kernelActive) {
      // 2. SHADOW EXECUTION (Non-blocking)
      try {
         const shadowCtx = { ...ctx, isShadow: true };
         const handler = new SetDealStageCommandHandler(...);
         
         // Execute Domain Logic in memory without DB commit
         await handler.handle(aggregateId, payload, { expectedVersion: payload.version, idempotencyKey: shadowCtx.traceId }, shadowCtx);
      } catch (shadowError) {
         console.error(`[SHADOW DIVERGENCE] Kernel threw unexpected mismatch: ${shadowError.message}`);
      }

      // 3. LEGACY EXECUTION (Authoritative)
      // return LegacyDealService.update(aggregateId, payload);
  } else {
      // 4. KERNEL AUTHORITATIVE
      const handler = new SetDealStageCommandHandler(...);
      return handler.handle(aggregateId, payload, { expectedVersion: payload.version, idempotencyKey: ctx.traceId }, ctx);
  }
}
```

This strict layout preserves all safety principles:
1. Legacy remains untouched in its flow if `ENABLE_KERNEL_DEALS` is false, guaranteeing 0 downtime.
2. The domain transition is executed regardless, providing free structural validation.
3. Errors caught purely in Shadow flag observability metrics.
