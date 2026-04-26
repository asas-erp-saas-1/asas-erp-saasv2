// src/lib/permissions.ts
// RBAC permission system — application-layer gate (RLS = safety net, not primary gate)
// Every service method MUST call permissions.require() before any DB operation.

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// PERMISSION REGISTRY
// Every action mapped to allowed roles.
// Empty array = NO ONE can do this (e.g., self-approval of commissions).
// =============================================================================

export const PERMISSIONS = {
  // Finance
  'finance.read':              ['admin', 'manager'],
  'finance.write':             ['admin'],
  'finance.reconcile':         ['admin'],
  // Commission
  'commission.approve':        ['admin', 'manager'],
  'commission.self_approve':   [],                     // FORBIDDEN — empty
  'commission.read.own':       ['admin', 'manager', 'agent'],
  'commission.read.all':       ['admin', 'manager'],
  // Deals
  'deal.create':               ['admin', 'manager', 'agent'],
  'deal.activate':             ['admin', 'manager'],
  'deal.negotiate':            ['admin', 'manager'],
  'deal.close':                ['admin', 'manager'],
  'deal.cancel':               ['admin', 'manager'],
  'deal.assign':               ['admin', 'manager'],
  'deal.read.own':             ['admin', 'manager', 'agent'],
  'deal.read.all':             ['admin', 'manager'],
  'deal.refund':               ['admin'],
  // Leads
  'lead.create':               ['admin', 'manager', 'agent'],
  'lead.update':               ['admin', 'manager', 'agent'],
  'lead.read.own':             ['admin', 'manager', 'agent'],
  'lead.read.all':             ['admin', 'manager'],
  'lead.convert':              ['admin', 'manager', 'agent'],
  // Agents
  'agent.score.view.own':      ['admin', 'manager', 'agent'],
  'agent.score.view.all':      ['admin', 'manager'],
  'agent.score.override':      ['admin', 'manager'],
  'agent.reassign':            ['admin', 'manager'],
  // Forecast
  'forecast.read':             ['admin', 'manager'],
  'forecast.override':         ['admin', 'manager'],
  'forecast.generate':         ['admin', 'manager'],
  // Metrics
  'metrics.read':              ['admin', 'manager'],
  'metrics.executive':         ['admin'],
  // Audit
  'audit.read':                ['admin'],
  'audit.read.own':            ['admin', 'manager', 'agent'],
  // Override system
  'override.request':          ['admin', 'manager', 'agent'],
  'override.approve':          ['admin', 'manager'],
  // Queue / system admin
  'queue.manage':              ['admin'],
  'system.config':             ['admin'],
  'dlq.manage':                ['admin'],
  // Events
  'event.publish':             ['admin', 'manager'],
  'event.replay':              ['admin'],
} as const satisfies Record<string, readonly string[]>

export type PermissionAction = keyof typeof PERMISSIONS
export type UserRole = 'admin' | 'manager' | 'agent'

// =============================================================================
// ERRORS
// =============================================================================

export class PermissionDeniedError extends Error {
  public readonly code = 'PERMISSION_DENIED'
  constructor(
    public readonly actorId:  string,
    public readonly action:   PermissionAction,
    public readonly role:     string,
  ) {
    super(`Permission denied: actor "${actorId}" with role "${role}" cannot perform "${action}"`)
    this.name = 'PermissionDeniedError'
  }
}

// =============================================================================
// PERMISSION CHECKER
// =============================================================================

export interface PermissionContext {
  actorId: string
  role:    UserRole
}

export interface PermissionCheckerInstance {
  can:       (action: PermissionAction) => boolean
  require:   (action: PermissionAction) => void
  canAny:    (actions: PermissionAction[]) => boolean
  requireAny:(actions: PermissionAction[]) => void
}

export function createPermissionChecker(
  ctx: PermissionContext,
): PermissionCheckerInstance {

  function can(action: PermissionAction): boolean {
    const allowedRoles = PERMISSIONS[action]
    return (allowedRoles as readonly string[]).includes(ctx.role)
  }

  function require(action: PermissionAction): void {
    if (!can(action)) {
      throw new PermissionDeniedError(ctx.actorId, action, ctx.role)
    }
  }

  function canAny(actions: PermissionAction[]): boolean {
    return actions.some((a) => can(a))
  }

  function requireAny(actions: PermissionAction[]): void {
    if (!canAny(actions)) {
      throw new PermissionDeniedError(
        ctx.actorId,
        actions[0]!,
        ctx.role,
      )
    }
  }

  return { can, require, canAny, requireAny }
}

// =============================================================================
// ACCESS LOGGER — logs every permission check (pass or fail)
// =============================================================================

export interface AccessLogEntry {
  actorId:    string
  action:     PermissionAction
  resourceId: string | null
  result:     'granted' | 'denied'
  reason?:    string
  ipAddress?: string
  userAgent?: string
}

export async function logAccessAttempt(
  db: SupabaseClient,
  entry: AccessLogEntry,
): Promise<void> {
  try {
    await db.from('access_log').insert({
      actor_id:   entry.actorId,
      action:     entry.action,
      resource_id: entry.resourceId ?? null,
      result:     entry.result,
      reason:     entry.reason ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    })
  } catch {
    // Access log failure must never block the main operation
    // Log to structured_logs as fallback
    console.error('[access_log] write failed:', entry.actorId, entry.action, entry.result)
  }
}

// =============================================================================
// PERMISSION MIDDLEWARE FACTORY
// Creates a checker + logs all checks atomically
// =============================================================================

export interface PermissionServiceInstance {
  check:   (action: PermissionAction, resourceId?: string) => Promise<boolean>
  enforce: (action: PermissionAction, resourceId?: string) => Promise<void>
}

export function createPermissionService(
  db: SupabaseClient,
  ctx: PermissionContext,
  meta: { ipAddress?: string; userAgent?: string } = {},
): PermissionServiceInstance {
  const checker = createPermissionChecker(ctx)

  async function check(
    action: PermissionAction,
    resourceId?: string,
  ): Promise<boolean> {
    const granted = checker.can(action)

    await logAccessAttempt(db, {
      actorId:    ctx.actorId,
      action,
      resourceId: resourceId ?? null,
      result:     granted ? 'granted' : 'denied',
      reason:     granted ? undefined : `Role "${ctx.role}" not in allowed roles for "${action}"`,
      ipAddress:  meta.ipAddress,
      userAgent:  meta.userAgent,
    })

    return granted
  }

  async function enforce(
    action: PermissionAction,
    resourceId?: string,
  ): Promise<void> {
    const granted = await check(action, resourceId)
    if (!granted) {
      throw new PermissionDeniedError(ctx.actorId, action, ctx.role)
    }
  }

  return { check, enforce }
}

// =============================================================================
// LOAD ACTOR CONTEXT FROM SUPABASE AUTH
// =============================================================================

export async function resolvePermissionContext(
  db: SupabaseClient,
): Promise<PermissionContext> {
  const { data: { user }, error: authErr } = await db.auth.getUser()
  if (authErr || !user) {
    throw new PermissionDeniedError('anonymous', 'finance.read', 'anonymous')
  }

  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    throw new PermissionDeniedError(user.id, 'finance.read', 'unknown')
  }

  return {
    actorId: user.id,
    role:    (profile.role as UserRole) ?? 'agent',
  }
}
