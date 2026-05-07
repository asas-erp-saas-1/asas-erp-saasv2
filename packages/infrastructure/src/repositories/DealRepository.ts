import { KernelContext, Command } from '@asas/kernel/src/ExecutionPipeline';

export class DealRepository {
  async get(id: string, ctx: KernelContext): Promise<any> {
    const { data, error } = await ctx.db
      .from('deals')
      .select('*')
      .eq('id', id)
      .eq('agency_id', ctx.identity.tenantId) // Tenant boundary physically enforced
      .single();

    if (error) throw new Error(`Deal not found or access denied: ${error.message}`);
    return data;
  }

  async save(state: any, command: Command, ctx: KernelContext, tx: any): Promise<void> {
    // Note: In physical implementation, this is handled via atomic RPC in Kernel.execute()
    // However, if we need individual discrete repo saves:
    const { error } = await ctx.db.rpc('core_update_deal_v1', {
      tenant_id: ctx.identity.tenantId,
      deal_id: state.id,
      expected_version: command.expectedVersion,
      payload: state
    });

    if (error) {
       if (error.code === 'P0001') throw new Error('Optimistic Lock Failure');
       throw new Error(error.message);
    }
  }
}
