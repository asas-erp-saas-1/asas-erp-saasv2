import { SupabaseClient } from '@supabase/supabase-js';
import { DomainEventEnvelope } from '../../../domain/contracts';
import { ProjectionRegistry, ProjectionDefinition } from './ProjectionRegistry';

export class ProjectionEngine {
  /**
   * Applies an event to all registered projections.
   * Runs inside the worker pipeline AFTER the outbox event is pulled.
   */
  static async applyEvent(db: SupabaseClient, event: DomainEventEnvelope) {
    const projections = ProjectionRegistry.getAll();
    
    for (const projection of projections) {
      console.log(`[PROJECTION] Applying ${event.type} to ${projection.name}`);
      await this.applyToProjection(db, projection, event);
    }
  }

  private static async applyToProjection(db: SupabaseClient, projection: ProjectionDefinition, event: DomainEventEnvelope) {
    // 1. Fetch current projection state
    const { data: currentState, error: fetchError } = await db
      .from(projection.targetTable)
      .select('*')
      .eq('id', event.aggregateId)
      .eq('tenant_id', event.payload.tenantId || event.payload.agency_id) // Support legacy fallback
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore Not Found
      throw new Error(`[PROJECTION] Failed to fetch state for ${projection.name}: ${fetchError.message}`);
    }

    // 2. Prevent Out-of-Order Projection Updates
    // A projection should strictly only move forward in version.
    if (currentState && currentState[projection.versionParam] >= event.version) {
       console.log(`[PROJECTION] Skipping ${event.type} for ${projection.name}: Event Version (${event.version}) <= Projection Version (${currentState[projection.versionParam]}).`);
       return;
    }

    // 3. Compute deterministic next state
    const nextState = projection.apply(currentState || {}, event);

    // 4. Upsert Projection State
    // Read Models are disposable. We can UPSERT them safely.
    const { error: upsertError } = await db
      .from(projection.targetTable)
      .upsert({
        ...nextState,
        id: event.aggregateId,
        tenant_id: event.payload.tenantId || event.payload.agency_id,
        [projection.versionParam]: event.version,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      throw new Error(`[PROJECTION UPDATE FAILED] ${upsertError.message}`);
    }
  }
}
