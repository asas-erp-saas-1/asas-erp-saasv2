import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/schema';

export type Session = {
  user: {
    id: number;
    email: string;
    roleId?: number | null;
  };
  organizationId: number;
};

// A phantom brand that ensures raw Drizzle DB cannot be passed where TenantScopedDB is expected
export type TenantScopedDB = PostgresJsDatabase<typeof schema> & { __brand: "TenantScopedDB" };

// Financial mutations require a specific transaction brand
export type LedgerLockedTransaction = Omit<TenantScopedDB, 'update' | 'delete'> & { __brand: "LedgerLockedTransaction" };

// Context injected by withEEK and withActionEEK
export interface EEKProtectedContext {
  session: Session;
  organizationId: number;
  db: TenantScopedDB;
  ledger: any; // We will define LedgerService later
  audit: any; // We will define AuditService later
  requestId: string;
}
