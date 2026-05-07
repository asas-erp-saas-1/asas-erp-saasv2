import { SetDealStageCommand } from '@asas/domain/src/sales/DealStateMachine';

/**
 * Transforms DTOs between Legacy (CRUD, weak types) 
 * and Kernel (CQRS Commands, strict types).
 */
export class PayloadTranslator {
  
  /**
   * Transforms a Legacy API Deal Update Payload into a strictly typed Kernel Command.
   */
  static legacyToKernelDealStage(aggregateId: string, legacyPayload: any, traceId: string): SetDealStageCommand {
    return {
      type: 'SET_DEAL_STAGE',
      aggregateId,
      expectedVersion: legacyPayload.version || legacyPayload.v || 1,
      payload: {
        // Map legacy `status` field to the strictly enumerated `stage` domain field.
        stage: legacyPayload.status || legacyPayload.stage,
      }
    };
  }

  /**
   * Transforms a Kernel State output back to the legacy expected shape
   * so legacy frontend components do not break when Kernel becomes authoritative.
   */
  static kernelToLegacyDealResult(kernelState: any) {
    return {
      id: kernelState.id,
      status: kernelState.status, // Translate `stage` back to `status` if we renamed it in domain
      version: kernelState.version,
      agency_id: kernelState.tenantId, // Map normalized tenantId back to legacy agency_id
      updated_at: new Date().toISOString()
    };
  }
}
