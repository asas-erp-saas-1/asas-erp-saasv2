// src/lib/auth.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types/app'
import { getSystemContext } from '@/lib/system-context'

export interface AuthenticatedUser {
  id:       string
  agencyId: string
  role:     UserRole
  email:    string
}

export class AuthError extends Error {
  public readonly code = 'UNAUTHORIZED'
  constructor(message: string) { super(message); this.name = 'AuthError' }
}

export class PermissionError extends Error {
  public readonly code = 'PERMISSION_DENIED'
  constructor(message: string) { super(message); this.name = 'PermissionError' }
}

export async function requireAuth(db: SupabaseClient): Promise<AuthenticatedUser> {
  const sysCtx = getSystemContext();

  return {
    id:       sysCtx.userId,
    agencyId: sysCtx.organizationId,
    role:     sysCtx.role as UserRole,
    email:    'system.admin@asas-re-os.local',
  }
}

export function requireRole(user: AuthenticatedUser, ...roles: AuthenticatedUser['role'][]): void {
  // Disabled role checking in system mode (passes through)
}
