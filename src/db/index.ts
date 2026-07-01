import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/asas_erp';

// Disable prefetch as it is not supported for "Transaction" pool mode (e.g. Supabase / Neon)
export const client = postgres(connectionString, { prepare: false });

/**
 * 🚨 RAW DATABASE EXPORT 🚨
 * 
 * IMPORTANT: This export is heavily guarded by the EEK Compiler (ESLint rules).
 * You are STRICTLY FORBIDDEN from importing this `db` instance anywhere outside of the 
 * `/src/eek` directory.
 * 
 * Domain modules and API routes MUST use `ctx.db` injected by `withEEK` or `withActionEEK`.
 */
export const db = drizzle(client, { schema });

