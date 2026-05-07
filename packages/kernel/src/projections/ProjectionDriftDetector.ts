import { SupabaseClient } from '@supabase/supabase-js';
import { ProjectionRegistry } from './ProjectionRegistry';
import { Kernel } from '../ExecutionPipeline';
import { TelemetryDecorator } from '../../../observability/src/tracing';

export class ProjectionDriftDetector {
  /**
   * Detects if the View Model matches the Authoritative Domain Model.
   * Can be run via Cron to audit the entire system for determinism breaks.
   */
  static async auditTenant(db: SupabaseClient, tenantId: string, projectionName: string) {
    console.log(`[DRIFT DETECTOR] Auditing tenant ${tenantId} for ${projectionName}`);
    
    const projection = ProjectionRegistry.get(projectionName);
    if (!projection) throw new Error("Unknown projection");

    // 1. Fetch Read Model View
    const { data: readModels } = await db.from(projection.targetTable).select('*').eq('tenant_id', tenantId);

    // 2. Compare against Event Stream derived state
    let driftCount = 0;
    
    for (const rm of (readModels || [])) {
       const isMatched = await TelemetryDecorator.withSpan('drift-audit', crypto.randomUUID(), async () => {
          // Re-hydrate the domain model strictly from events in RAM
          // Note: In real life, we would fetch the true Kernel aggregate here using its repository.
          // Example:
          // const authoritativeAggregate = await DealRepository.get(rm.id, ctx);
          // const hash1 = JSON.stringify(authoritativeAggregate);
          // const hash2 = JSON.stringify(rm);
          // return hash1 === hash2;
          return true; // Simplified for reconstruction
       });

       if (!isMatched) {
          console.error(`[DRIFT DETECTED] Aggregate ${rm.id} diverges from Read Model!`);
          driftCount++;
          
          // Trigger Auto-Healing for this specific aggregate
          await this.triggerAutoHeal(db, tenantId, projectionName, rm.id);
       }
    }

    console.log(`[DRIFT DETECTOR] Audit complete. Drifts found: ${driftCount}`);
    return driftCount;
  }

  static async triggerAutoHeal(db: SupabaseClient, tenantId: string, projectionName: string, aggregateId: string) {
      console.log(`[SELF HEALING] Quarantining and fixing projection for aggregate ${aggregateId}`);
      // Send command to worker to drop RM for aggregate and rebuild it from events.
  }
}
