// src/lib/auth.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/app'

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
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) throw new AuthError('UNAUTHORIZED: Session required')

  const { data: profile } = await db
    .from('profiles')
    .select('id, agency_id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) throw new AuthError('UNAUTHORIZED: Account inactive')
  if (!profile.agency_id) throw new AuthError('UNAUTHORIZED: No agency assigned')

  return {
    id:       user.id,
    agencyId: profile.agency_id,
    role:     profile.role,
    email:    user.email!,
  }
}

export function requireRole(user: AuthenticatedUser, ...roles: AuthenticatedUser['role'][]): void {
  if (!roles.includes(user.role)) {
    throw new PermissionError(`PERMISSION_DENIED: Role "${user.role}" cannot perform this action`)
  }
}
