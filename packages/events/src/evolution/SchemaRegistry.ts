import { z } from 'zod';

export interface EventSchemaDefinition {
  type: string;
  version: number;
  schema: z.ZodSchema<any>;
  migrate?: (oldPayload: any) => any; // Upcast old events to new format during replay
}

export class SchemaRegistry {
  private static schemas: Map<string, EventSchemaDefinition> = new Map();

  static register(def: EventSchemaDefinition) {
    const key = `${def.type}_v${def.version}`;
    this.schemas.set(key, def);
  }

  static validate(type: string, version: number, payload: any): any {
    const key = `${type}_v${version}`;
    const def = this.schemas.get(key);
    
    if (!def) {
      throw new Error(`[EVENT EVOLUTION] Unknown schema version: ${key}`);
    }

    return def.schema.parse(payload);
  }

  /**
   * Safely upcasts an old event into the latest schema shape for processing.
   * Essential for Replay determinism over long periods.
   */
  static upcast(type: string, version: number, latestVersion: number, payload: any): any {
     let currentPayload = payload;
     for (let v = version; v < latestVersion; v++) {
        const key = `${type}_v${v}`;
        const def = this.schemas.get(key);
        if (def && def.migrate) {
           currentPayload = def.migrate(currentPayload);
        }
     }
     // Validate against latest
     return this.validate(type, latestVersion, currentPayload);
  }
}
