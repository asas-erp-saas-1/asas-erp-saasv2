import { SupabaseClient } from '@supabase/supabase-js';
import { DomainEventEnvelope } from '../../../domain/contracts';

export interface ProjectionDefinition {
  name: string;
  targetTable: string;
  versionParam: string;
  apply(state: any, event: DomainEventEnvelope): any;
}

export class ProjectionRegistry {
  private static projections: Map<string, ProjectionDefinition> = new Map();

  static register(projection: ProjectionDefinition) {
    this.projections.set(projection.name, projection);
  }

  static get(name: string): ProjectionDefinition | undefined {
    return this.projections.get(name);
  }

  static getAll(): ProjectionDefinition[] {
    return Array.from(this.projections.values());
  }
}
