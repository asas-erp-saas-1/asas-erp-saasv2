import { SupabaseClient } from '@supabase/supabase-js';

export class ReplayManagementConsole {
  /**
   * Secure SRE entrypoint. Allows SRE to individually reset/rebuild a corrupted tenant
   * directly from immutable outbox storage across multiple multi-region slices.
   */
  static async triggerTenantRebuild(db: SupabaseClient, tenantId: string, projectionName: string, executedByAdminId: string): Promise<void> {
    console.log(`[PLATFORM ENGINEERING] SRE ${executedByAdminId} triggered rebuild of ${projectionName} for Tenant ${tenantId}`);
    
    // In physical code, this pushes a high-priority "REBUILD_COMMAND" into the queue.
    // The projection rebuilder intercepts it and runs isolated reconstruction.
    await db.from('outbox_events').insert({
       id: crypto.randomUUID(),
       tenant_id: tenantId,
       aggregate_id: 'SYSTEM',
       type: 'TRIGGER_PROJECTION_REBUILD',
       version: 1,
       payload: { projectionName, adminId: executedByAdminId },
       status: 'PENDING',
       created_at: new Date().toISOString(),
       trace_id: `infra-rebuild-${crypto.randomUUID()}`
    });

    console.log(`[PLATFORM ENGINEERING] Rebuild instructions securely enqueued.`);
  }
}
