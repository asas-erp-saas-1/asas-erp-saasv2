// src/services/configService.ts
// Per-agency configuration engine — custom thresholds, rules, workflows

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

// =============================================================================
// AGENCY CONFIG SCHEMA
// =============================================================================

export const AgencyConfigSchema = z.object({
  inactivityYellowHours:       z.number().int().min(1).max(168).default(24),
  inactivityOrangeHours:       z.number().int().min(1).max(336).default(48),
  inactivityRedHours:          z.number().int().min(1).max(504).default(72),
  inactivityCriticalHours:     z.number().int().min(24).max(720).default(168),
  survivalThresholdDZD:        z.number().positive().default(2_000_000),
  cautionThresholdDZD:         z.number().positive().default(5_000_000),
  highValueDealDZD:            z.number().positive().default(15_000_000),
  defaultCommissionPct:        z.number().min(0).max(20).default(2.0),
  maxCommissionPct:            z.number().min(0).max(30).default(10.0),
  commissionRequiresApproval:  z.boolean().default(true),
  leadExpiryDays:              z.number().int().min(7).max(365).default(90),
  leadReassignAfterHours:      z.number().int().min(1).max(720).default(72),
  maxLeadsPerAgent:            z.number().int().min(1).max(200).default(30),
  monteCarloIterations:        z.number().int().min(100).max(10_000).default(500),
  forecastWindowMonths:        z.number().int().min(1).max(12).default(3),
  minSampleForLearning:        z.number().int().min(5).max(100).default(10),
  learningRate:                z.number().min(0.001).max(0.5).default(0.05),
  notifyManagerOnEscalation:   z.boolean().default(true),
  notifyAgentOnOverdue:        z.boolean().default(true),
  whatsappNotifications:       z.boolean().default(false),
  agencyName:                  z.string().max(100).optional().nullable(),
  currency:                    z.string().length(3).default('DZD'),
  timezone:                    z.string().max(50).default('Africa/Algiers'),
  locale:                      z.string().max(10).default('fr-DZ'),
  customRules:                 z.record(z.string(), z.unknown()).default({}),
  customFields:                z.record(z.string(), z.unknown()).default({}),
})

export type AgencyConfig = z.infer<typeof AgencyConfigSchema>

// Request-scoped config cache (per Vercel invocation)
let _configCache: Map<string, AgencyConfig> | null = null

export interface ConfigServiceInstance {
  getConfig:         (agencyId: string) => Promise<AgencyConfig>
  updateConfig:      (agencyId: string, updates: Partial<AgencyConfig>, updatedBy: string) => Promise<AgencyConfig>
  resetToDefaults:   (agencyId: string, updatedBy: string) => Promise<AgencyConfig>
  getConfigHistory:  (agencyId: string, limit?: number) => Promise<Array<{ snapshot: AgencyConfig; changedAt: string; changedBy: string }>>
}

export function createConfigService(db: SupabaseClient): ConfigServiceInstance {

  if (!_configCache) _configCache = new Map()

  async function getConfig(agencyId: string): Promise<AgencyConfig> {
    // Check request-scoped cache
    if (_configCache!.has(agencyId)) return _configCache!.get(agencyId)!

    const { data } = await db
      .from('agency_config')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle()

    if (!data) {
      // Return defaults if no config exists
      const defaults = AgencyConfigSchema.parse({})
      _configCache!.set(agencyId, defaults)
      return defaults
    }

    const row = data as Record<string, unknown>
    const config = AgencyConfigSchema.parse({
      inactivityYellowHours:      row.inactivity_yellow_hours,
      inactivityOrangeHours:      row.inactivity_orange_hours,
      inactivityRedHours:         row.inactivity_red_hours,
      inactivityCriticalHours:    row.inactivity_critical_hours,
      survivalThresholdDZD:       row.survival_threshold_dzd,
      cautionThresholdDZD:        row.caution_threshold_dzd,
      highValueDealDZD:           row.high_value_deal_dzd,
      defaultCommissionPct:       row.default_commission_pct,
      maxCommissionPct:           row.max_commission_pct,
      commissionRequiresApproval: row.commission_requires_approval,
      leadExpiryDays:             row.lead_expiry_days,
      leadReassignAfterHours:     row.lead_reassign_after_hours,
      maxLeadsPerAgent:           row.max_leads_per_agent,
      monteCarloIterations:       row.monte_carlo_iterations,
      forecastWindowMonths:       row.forecast_window_months,
      minSampleForLearning:       row.min_sample_for_learning,
      learningRate:               row.learning_rate,
      notify_manager_on_escalation: row.notify_manager_on_escalation,
      notify_agent_on_overdue:      row.notify_agent_on_overdue,
      whatsappNotifications:      row.whatsapp_notifications,
      agencyName:                 row.agency_name,
      currency:                   row.currency,
      timezone:                   row.timezone,
      locale:                     row.locale,
      customRules:                row.custom_rules,
      customFields:               row.custom_fields,
    })

    _configCache!.set(agencyId, config)
    return config
  }

  async function updateConfig(
    agencyId:  string,
    updates:   Partial<AgencyConfig>,
    updatedBy: string,
  ): Promise<AgencyConfig> {
    const current = await getConfig(agencyId)
    const merged  = AgencyConfigSchema.parse({ ...current, ...updates })

    // Archive current config
    await db.from('agency_config_history').insert({
      agency_id:  agencyId,
      snapshot:   current,
      changed_by: updatedBy,
    })

    await db.from('agency_config').upsert({
      agency_id:                    agencyId,
      inactivity_yellow_hours:      merged.inactivityYellowHours,
      inactivity_orange_hours:      merged.inactivityOrangeHours,
      inactivity_red_hours:         merged.inactivityRedHours,
      inactivity_critical_hours:    merged.inactivityCriticalHours,
      survival_threshold_dzd:       merged.survivalThresholdDZD,
      caution_threshold_dzd:        merged.cautionThresholdDZD,
      high_value_deal_dzd:          merged.highValueDealDZD,
      default_commission_pct:       merged.defaultCommissionPct,
      max_commission_pct:           merged.maxCommissionPct,
      commission_requires_approval: merged.commissionRequiresApproval,
      lead_expiry_days:             merged.leadExpiryDays,
      lead_reassign_after_hours:    merged.leadReassignAfterHours,
      max_leads_per_agent:          merged.maxLeadsPerAgent,
      monte_carlo_iterations:       merged.monteCarloIterations,
      forecast_window_months:       merged.forecastWindowMonths,
      min_sample_for_learning:      merged.minSampleForLearning,
      learning_rate:                merged.learningRate,
      notify_manager_on_escalation: merged.notifyManagerOnEscalation,
      notify_agent_on_overdue:      merged.notifyAgentOnOverdue,
      whatsapp_notifications:       merged.whatsappNotifications,
      agency_name:                  merged.agencyName ?? null,
      currency:                     merged.currency,
      timezone:                     merged.timezone,
      locale:                       merged.locale,
      custom_rules:                 merged.customRules,
      custom_fields:                merged.customFields,
      updated_by:                   updatedBy,
      updated_at:                   new Date().toISOString(),
    }, { onConflict: 'agency_id' })

    _configCache!.set(agencyId, merged)
    return merged
  }

  async function resetToDefaults(agencyId: string, updatedBy: string): Promise<AgencyConfig> {
    const defaults = AgencyConfigSchema.parse({})
    return updateConfig(agencyId, defaults, updatedBy)
  }

  async function getConfigHistory(
    agencyId: string,
    limit = 20,
  ) {
    const { data } = await db
      .from('agency_config_history')
      .select('snapshot, changed_at, changed_by, profiles:changed_by ( full_name )')
      .eq('agency_id', agencyId)
      .order('changed_at', { ascending: false })
      .limit(limit)

    return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      snapshot:  row.snapshot as AgencyConfig,
      changedAt: row.changed_at as string,
      changedBy: (row.profiles as { full_name?: string } | null)?.full_name ?? row.changed_by as string,
    }))
  }

  return { getConfig, updateConfig, resetToDefaults, getConfigHistory }
}


// =============================================================================
// DATA PIPELINE VALIDATOR
// Validates, deduplicates, and rejects corrupted incoming data
// =============================================================================

export type ValidationSource = 'api' | 'import' | 'webhook' | 'sync'
export type ValidationResultType = 'valid' | 'rejected' | 'quarantined' | 'auto_corrected'

export interface ValidationOutcome {
  result:          ValidationResultType
  data?:           Record<string, unknown>
  rejectionReason?: string
  corrections?:    Record<string, string>  // field → what was corrected
}

const PhoneSchema = z.string().min(8).max(20).regex(/^[\d+\-\s()]+$/, 'Invalid phone format')
const DateSchema  = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')

export const IncomingLeadSchema = z.object({
  full_name:  z.string().min(1).max(100).transform((v) => v.trim()),
  phone:      PhoneSchema.optional().nullable(),
  email:      z.string().email().optional().nullable(),
  source:     z.enum(['facebook','instagram','referral','walk_in','website','phone','whatsapp','other']).optional(),
  budget_min: z.number().positive().optional().nullable(),
  budget_max: z.number().positive().optional().nullable(),
  notes:      z.string().max(2000).optional().nullable(),
}).refine(
  (d) => d.phone || d.email,
  { message: 'Lead must have at least phone or email' }
).refine(
  (d) => !d.budget_min || !d.budget_max || d.budget_max >= d.budget_min,
  { message: 'budget_max must be >= budget_min', path: ['budget_max'] }
)

export const IncomingDealSchema = z.object({
  client_id:    z.string().uuid(),
  property_id:  z.string().uuid(),
  agent_id:     z.string().uuid(),
  deal_type:    z.enum(['sale','rental','resale']),
  agreed_price: z.number().positive().max(10_000_000_000),  // 10B DZD max sanity check
  notes:        z.string().max(2000).optional(),
})

export const IncomingPaymentSchema = z.object({
  deal_id:   z.string().uuid(),
  amount:    z.number().positive().max(10_000_000_000),
  due_date:  DateSchema,
  notes:     z.string().max(200).optional(),
})

const VALIDATION_SCHEMAS: Record<string, z.ZodTypeAny> = {
  lead:    IncomingLeadSchema,
  deal:    IncomingDealSchema,
  payment: IncomingPaymentSchema,
}

export interface PipelineValidatorInstance {
  validate:    (entityType: string, data: unknown, source: ValidationSource, agencyId?: string) => Promise<ValidationOutcome>
  validateBatch: (entityType: string, rows: unknown[], source: ValidationSource) => Promise<Array<ValidationOutcome>>
}

export function createPipelineValidator(db: SupabaseClient): PipelineValidatorInstance {

  async function validate(
    entityType: string,
    data:       unknown,
    source:     ValidationSource,
    agencyId?:  string,
  ): Promise<ValidationOutcome> {
    const schema = VALIDATION_SCHEMAS[entityType]

    if (!schema) {
      const outcome: ValidationOutcome = {
        result:          'rejected',
        rejectionReason: `Unknown entity type: ${entityType}`,
      }
      await logValidation(entityType, data as Record<string, unknown>, source, outcome)
      return outcome
    }

    const parseResult = schema.safeParse(data)

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]
      const outcome: ValidationOutcome = {
        result:          'rejected',
        rejectionReason: `${firstError?.path.join('.')} — ${firstError?.message}`,
      }
      await logValidation(entityType, data as Record<string, unknown>, source, outcome)
      return outcome
    }

    // Duplicate detection for leads/clients
    if (entityType === 'lead') {
      const lead = parseResult.data as { phone?: string; email?: string }
      const isDuplicate = await checkDuplicate('leads', lead.phone, lead.email)
      if (isDuplicate) {
        const outcome: ValidationOutcome = {
          result:          'auto_corrected',
          data:            parseResult.data as Record<string, unknown>,
          corrections:     { status: 'Duplicate detected — merged with existing record' },
        }
        await logValidation(entityType, data as Record<string, unknown>, source, outcome)
        return outcome
      }
    }

    const outcome: ValidationOutcome = {
      result: 'valid',
      data:   parseResult.data as Record<string, unknown>,
    }
    await logValidation(entityType, data as Record<string, unknown>, source, outcome)
    return outcome
  }

  async function validateBatch(
    entityType: string,
    rows:       unknown[],
    source:     ValidationSource,
  ): Promise<ValidationOutcome[]> {
    return Promise.all(rows.map((row) => validate(entityType, row, source)))
  }

  async function checkDuplicate(
    table:  string,
    phone?: string,
    email?: string,
  ): Promise<boolean> {
    if (!phone && !email) return false

    let query = db.from(table).select('id', { count: 'exact', head: true }).is('deleted_at', null)

    if (phone && email) {
      query = query.or(`phone.eq.${phone},email.eq.${email}`)
    } else if (phone) {
      query = query.eq('phone', phone)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { count } = await query
    return (count ?? 0) > 0
  }

  async function logValidation(
    entityType: string,
    raw:        Record<string, unknown>,
    source:     ValidationSource,
    outcome:    ValidationOutcome,
  ): Promise<void> {
    // Only log rejections and quarantines (don't bloat with valid records)
    if (outcome.result === 'valid') return

    await db.from('pipeline_validation_log').insert({
      source,
      entity_type:      entityType,
      raw_payload:      raw,
      result:           outcome.result,
      rejection_reason: outcome.rejectionReason ?? null,
      corrections:      outcome.corrections ?? {},
    })
  }

  return { validate, validateBatch }
}
