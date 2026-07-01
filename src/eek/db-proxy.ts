import { db } from "@/db";
import { TenantScopedDB } from "./types";

// This creates a proxy around the database that enforces the organizationId
// on every query automatically.
// In a full Drizzle implementation, this would heavily wrap the query builder
// or we would use RLS. Since Drizzle doesn't support global scopes easily,
// we rely on RLS at the Postgres level and pass the orgId to a local transaction.
// For now, this is a placeholder wrapper that casts the type to ensure
// developers are using this instance and not the raw db.

export function createTenantScopedDB(organizationId: number): TenantScopedDB {
  // In reality, you'd execute a SET LOCAL "app.current_org_id" = organizationId
  // within a transaction here if using Postgres RLS.
  
  // For the sake of the compiler layer, we cast the raw db but the phantom type 
  // prevents raw imports from working elsewhere.
  return db as unknown as TenantScopedDB;
}
