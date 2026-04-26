// src/lib/planEnforcement.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type PlanFeature   = 'ai' | 'api_access' | 'white_label' | 'multi_branch' | 'advanced_reports'
export type PlanResource  = 'agents' | 'deals_mtd' | 'leads_mtd' | 'properties'

export class PlanLimitExceeded extends Error {
  public readonly code = 'PLAN_LIMIT_EXCEEDED'
  constructor(
    public readonly resource: PlanResource,
    public readonly limit: number,
    public readonly current: number,
    public readonly currentPlan: string,
    public readonly upgradeRequired: string
  ) {
    super(`Limit reached: ${resource} (${current}/${limit}). Upgrade to ${upgradeRequired}.`)
    this.name = 'PlanLimitExceeded'
  }
}

export class FeatureNotAvailable extends Error {
  public readonly code = 'FEATURE_NOT_AVAILABLE'
  constructor(
    public readonly feature: PlanFeature,
    public readonly currentPlan: string,
    public readonly requiredPlan: string
  ) {
    super(`Feature "${feature}" requires ${requiredPlan} plan. Current: ${currentPlan}.`)
    this.name = 'FeatureNotAvailable'
  }
}

const NEXT_PLAN: Record<string, string> = {
  trial: 'starter', starter: 'growth', growth: 'professional',
  professional: 'enterprise', enterprise: 'enterprise',
}

const FEATURE_PLAN: Record<PlanFeature, string> = {
  ai: 'professional', api_access: 'growth', white_label: 'enterprise',
  multi_branch: 'professional', advanced_reports: 'professional',
}

// In-process cache (60s TTL per invocation)
const cache = new Map<string, { data: Record<string, unknown>; ts: number }>()

async function getAgency(db: SupabaseClient, agencyId: string): Promise<Record<string, unknown>> {
  const cached = cache.get(agencyId)
  if (cached && Date.now() - cached.ts < 60_000) return cached.data

  const { data, error } = await db
    .from('agencies')
    .select('plan, is_active, is_suspended, suspension_reason, max_agents, max_deals_mtd, max_leads_mtd, max_properties, feature_ai, feature_api_access, feature_white_label, feature_multi_branch, feature_advanced_reports, trial_ends_at')
    .eq('id', agencyId)
    .single()

  if (error || !data) throw new Error('AGENCY_NOT_FOUND')

  const d = data as Record<string, unknown>

  if (!d.is_active) throw new Error('ACCOUNT_INACTIVE: Contact support to reactivate')
  if (d.is_suspended) throw new Error(`ACCOUNT_SUSPENDED: ${d.suspension_reason ?? 'Payment required'}`)
  if (d.plan === 'trial' && d.trial_ends_at && new Date(d.trial_ends_at as string) < new Date()) {
    throw new Error('TRIAL_EXPIRED: Your trial has ended. Please upgrade to continue.')
  }

  cache.set(agencyId, { data: d, ts: Date.now() })
  return d
}

export async function enforcePlanLimit(
  db:       SupabaseClient,
  agencyId: string,
  resource: PlanResource,
): Promise<void> {
  const agency = await getAgency(db, agencyId)

  const limitMap: Record<PlanResource, number> = {
    agents:     agency.max_agents as number,
    deals_mtd:  agency.max_deals_mtd as number,
    leads_mtd:  agency.max_leads_mtd as number,
    properties: agency.max_properties as number,
  }

  const getCurrentCount = async (): Promise<number> => {
    switch (resource) {
      case 'agents': {
        const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('is_active', true).neq('role', 'admin')
        return count ?? 0
      }
      case 'deals_mtd':
      case 'leads_mtd': {
        const col    = resource === 'deals_mtd' ? 'deals_created' : 'leads_created'
        const period = new Date().toISOString().slice(0, 7) + '-01'
        const { data } = await db.from('usage_counters').select(col).eq('agency_id', agencyId).eq('period', period).maybeSingle()
        return (data as Record<string, unknown> | null)?.[col] as number ?? 0
      }
      case 'properties': {
        const { count } = await db.from('properties').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).is('deleted_at', null)
        return count ?? 0
      }
    }
  }

  const limit   = limitMap[resource]
  const current = await getCurrentCount()

  if (current >= limit) {
    throw new PlanLimitExceeded(resource, limit, current, agency.plan as string, NEXT_PLAN[agency.plan as string] ?? 'enterprise')
  }
}

export async function enforceFeatureAccess(
  db:       SupabaseClient,
  agencyId: string,
  feature:  PlanFeature,
): Promise<void> {
  const agency = await getAgency(db, agencyId)
  const featureMap: Record<PlanFeature, boolean> = {
    ai:               agency.feature_ai as boolean,
    api_access:       agency.feature_api_access as boolean,
    white_label:      agency.feature_white_label as boolean,
    multi_branch:     agency.feature_multi_branch as boolean,
    advanced_reports: agency.feature_advanced_reports as boolean,
  }
  if (!featureMap[feature]) {
    throw new FeatureNotAvailable(feature, agency.plan as string, FEATURE_PLAN[feature])
  }
}

export async function getPlanUsage(db: SupabaseClient, agencyId: string) {
  const agency = await getAgency(db, agencyId)
  const period = new Date().toISOString().slice(0, 7) + '-01'

  const [agentRes, propRes, usageRes] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('is_active', true).neq('role', 'admin'),
    db.from('properties').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).is('deleted_at', null),
    db.from('usage_counters').select('deals_created, leads_created').eq('agency_id', agencyId).eq('period', period).maybeSingle(),
  ])

  const usage = (usageRes.data as Record<string, number> | null) ?? { deals_created: 0, leads_created: 0 }
  const maxA  = agency.max_agents     as number
  const maxD  = agency.max_deals_mtd  as number
  const maxL  = agency.max_leads_mtd  as number
  const maxP  = agency.max_properties as number
  const usedA = agentRes.count ?? 0
  const usedD = usage.deals_created
  const usedL = usage.leads_created
  const usedP = propRes.count ?? 0

  return {
    plan:    agency.plan,
    features: {
      ai:              agency.feature_ai,
      api_access:      agency.feature_api_access,
      white_label:     agency.feature_white_label,
      multi_branch:    agency.feature_multi_branch,
      advanced_reports: agency.feature_advanced_reports,
    },
    limits: {
      agents:     { used: usedA, max: maxA, pct: Math.round((usedA / maxA) * 100) },
      deals_mtd:  { used: usedD, max: maxD, pct: Math.round((usedD / maxD) * 100) },
      leads_mtd:  { used: usedL, max: maxL, pct: Math.round((usedL / maxL) * 100) },
      properties: { used: usedP, max: maxP, pct: Math.round((usedP / maxP) * 100) },
    },
    trialEndsAt:  agency.trial_ends_at,
    isNearLimit:  [usedA/maxA, usedD/maxD, usedL/maxL, usedP/maxP].some(r => r >= 0.8),
  }
}
