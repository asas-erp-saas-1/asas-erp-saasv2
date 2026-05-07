import { SupabaseClient } from '@supabase/supabase-js';
import { ProjectionRegistry } from './ProjectionRegistry';
import { ProjectionEngine } from './ProjectionEngine';
import { ReplayRuntimeMode } from '../../../events/src/replay/ReplayRuntimeMode';

export class ProjectionRebuilder {

  /**
   * Physically truncates and rebuilds a tenant's specific projection from the immutable event stream.
   * Completely isolated per-tenant to prevent cross-contamination or locking the entire ERP.
   */
  static async rebuildTenantProjection(
    db: SupabaseClient, 
    tenantId: string, 
    projectionName: string
  ) {
    // 1. Activate Replay Integrity Mode (Blocks external side effects like emails)
    ReplayRuntimeMode.activate();

    try {
      const projection = ProjectionRegistry.get(projectionName);
      if (!projection) throw new Error(`Projection ${projectionName} not found.`);

      console.log(`[REBUILD] Starting Rebuild: ${projectionName} | Tenant: ${tenantId}`);

      // 2. Quarantine/Delete Old Read Model state for this tenant
      await db.from(projection.targetTable).delete().eq('tenant_id', tenantId);

      // 3. Stream Events Deterministically via Chunking
      let hasMore = true;
      let lastCreatedAt = '1970-01-01T00:00:00.000Z';

      while (hasMore) {
        const { data: events, error } = await db
          .from('outbox_events')
          .select('*')
          .eq('tenant_id', tenantId)
          .gt('created_at', lastCreatedAt)
          .order('created_at', { ascending: true }) // CRITICAL: Causal ordering
          .limit(1000);

        if (error) throw new Error(`[REBUILD STREAM ERROR] ${error.message}`);
        if (!events || events.length === 0) {
          hasMore = false;
          break;
        }

        // 4. Sequentially Apply
        for (const event of events) {
          await ProjectionEngine.applyEvent(db, event as any);
        }

        lastCreatedAt = events[events.length - 1].created_at;
      }

      console.log(`[REBUILD] SUCCESS: ${projectionName} rebuilt for Tenant: ${tenantId}`);

    } finally {
      // 5. Restore Safe Execution Mode
      ReplayRuntimeMode.deactivate();
    }
  }
}
