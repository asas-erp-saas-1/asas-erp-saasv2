import { SupabaseClient } from '@supabase/supabase-js';

export interface SagaCheckpoint {
  workflow_id: string;
  tenant_id: string;
  saga_type: string;
  current_step: number;
  payload: any;
  status: 'RUNNING' | 'COMPLETED' | 'COMPENSATING' | 'FAILED';
}

export class SagaCoordinator {
  /**
   * Checkpoints standard distributed sagas. Survives worker crashes.
   */
  static async checkpoint(db: SupabaseClient, checkpoint: SagaCheckpoint) {
    const { error } = await db.from('saga_executions').upsert(checkpoint);
    if (error) throw new Error(`[SAGA CHECKPOINT FAILED] ${error.message}`);
  }

  /**
   * Resumes a saga by fetching its current checkpoint state.
   */
  static async resume(db: SupabaseClient, workflowId: string): Promise<SagaCheckpoint | null> {
     const { data, error } = await db.from('saga_executions').select('*').eq('workflow_id', workflowId).single();
     if (error && error.code !== 'PGRST116') throw new Error(`[SAGA RESUME ERROR] ${error.message}`);
     return data;
  }

  /**
   * Triggers the compensation track for a saga.
   */
  static async triggerCompensation(db: SupabaseClient, workflowId: string, reason: string) {
     const saga = await this.resume(db, workflowId);
     if (!saga) return;
     
     console.log(`[SAGA COMPENSATION] Reverting workflow ${workflowId}. Reason: ${reason}`);
     await this.checkpoint(db, { ...saga, status: 'COMPENSATING' });

     // Publish a compensating command to the Outbox so a dedicated compensation worker can pick it up.
     await db.from('outbox_events').insert({
         id: crypto.randomUUID(),
         tenant_id: saga.tenant_id,
         aggregate_id: saga.workflow_id,
         type: `${saga.saga_type.toUpperCase()}_COMPENSATE`,
         version: 1,
         payload: { originalStep: saga.current_step, reason },
         status: 'PENDING',
         created_at: new Date().toISOString(),
         trace_id: crypto.randomUUID()
     });
  }
}
