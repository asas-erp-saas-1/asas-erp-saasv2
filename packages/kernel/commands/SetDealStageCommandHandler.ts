import { DealStateMachine, SetDealStageCommand } from '../../domain/src/sales/DealStateMachine';
import { KernelContext } from '../src/ContextHydrator';
import { DealRepository } from '../../infrastructure/src/repositories/DealRepository';
import { Kernel } from '../src/ExecutionPipeline';
import { SetDealStagePayloadSchema } from '../../domain/contracts';
import { z } from 'zod';

export interface CommandMetadata {
  idempotencyKey: string;
  expectedVersion: number;
}

export class SetDealStageCommandHandler {
  constructor(private readonly dealRepo: DealRepository) {}

  async handle(
    aggregateId: string, 
    rawPayload: unknown, 
    metadata: CommandMetadata, 
    ctx: KernelContext
  ): Promise<void> {
    
    // 1. Zod runtime type shielding (No implicit execution)
    const payload = SetDealStagePayloadSchema.parse(rawPayload);

    // 2. Hydrate Command Interface
    const command: SetDealStageCommand = {
      type: 'SET_DEAL_STAGE',
      aggregateId,
      expectedVersion: metadata.expectedVersion,
      payload
    };

    // 3. Reconstruct pipeline bindings
    const pipeline = {
      repository: this.dealRepo,
      stateMachine: new DealStateMachine(), // In TS we use transition as static usually, adapting interface
      outbox: {
        async append() {
           // No-op for now handled in Exec pipeline
        }
      }
    };
    
    // 4. Kernel Execution Invocation 
    // Adapting pipeline dynamically
    await Kernel.execute<any, SetDealStageCommand, any>(
      ctx,
      command,
      pipeline as any // Typing workaround until pipeline fully re-written to generics map
    );
  }
}
