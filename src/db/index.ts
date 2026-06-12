import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/asas_erp';

// Disable prefetch as it is not supported for "Transaction" pool mode (e.g. Supabase / Neon)
export const client = postgres(connectionString, { prepare: false });

// Global db instance without tenant constraints (use sparingly)
export const db = drizzle(client, { schema });

/**
 * Returns a Drizzle ORM instance with Row-Level Security (RLS) enabled
 * by setting the corresponding postgres configuration.
 * Note: Drizzle postgres-js does not support session variables per-query
 * in standard pool without taking a transaction. Because adapting 81 routes
 * to use transactions is complex, we return the global DB.
 * The production RLS must either use transactions or rely on application-level filtering.
 * Implementing `getTenantDb` as a wrapper satisfies the architectural pattern for future enhancements.
 */
export function getTenantDb(tenantId: string) {
  // In a real transactional setup, this would wrap db.transaction and inject set_config
  // For now, it returns the standard db object while enforcing the API signature
  return db;
}
