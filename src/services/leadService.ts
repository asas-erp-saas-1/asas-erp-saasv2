// src/services/leadService.ts
// DOMAIN MODEL — lifecycle-aware lead management

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog, AUDIT_ACTIONS } from '@/utils/auditLog'
import { LeadStateMachine } from '@/core/stateMachine'
import {
  parseAndValidate,
  LeadCreateSchema,
  LeadUpdateSchema,
  ActivityCreateSchema,
  ValidationError,
  BusinessRuleError,
  type LeadCreateInput,
  type LeadUpdateInput,
} from '@/lib/validators'
import type {
  Lead,
  LeadFilters,
  Activity,
  PaginatedResponse,
} from '@/types/app'

const LEAD_SELECT = `
  id, status, source, budget_min, budget_max, notes, lost_reason,
  last_activity, created_at, assigned_agent, client_id, project_id, deleted_at,
  clients:client_id     ( id, full_name, phone ),
  profiles:assigned_agent ( id, full_name ),
  projects:project_id   ( id, name )
`

// =============================================================================
// QUERIES
// =============================================================================

export async function getLeads(
  filters: LeadFilters = {},
  page = 1,
  limit = 30
): Promise<PaginatedResponse<Lead>> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('leads')
    .select(LEAD_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('last_activity', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (filters.status)        query = query.eq('status', filters.status)
  if (filters.assignedAgent) query = query.eq('assigned_agent', filters.assignedAgent)
  if (filters.source)        query = query.eq('source', filters.source)
  if (filters.dateFrom)      query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo)        query = query.lte('created_at', filters.dateTo)

  const { data, error, count } = await query
  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)

  return {
    data: (data ?? []) as unknown as Lead[],
    count: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_SELECT)
    .eq('id', leadId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch lead: ${error.message}`)
  }
  return data as unknown as Lead
}

export async function getLeadActivities(leadId: string): Promise<Activity[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, profiles:created_by ( id, full_name )')
    .eq('lead_id', leadId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch activities: ${error.message}`)
  return (data ?? []) as unknown as Activity[]
}

export async function getInactiveLeads(thresholdHours = 48): Promise<Lead[]> {
  const supabase = await createServerSupabaseClient()
  const cutoff = new Date(Date.now() - thresholdHours * 3_600_000).toISOString()

  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_SELECT)
    .in('status', ['new', 'contacted', 'interested', 'visit_scheduled'])
    .is('deleted_at', null)
    .lt('last_activity', cutoff)
    .order('last_activity', { ascending: true })
    .limit(50)

  if (error) throw new Error(`Failed to fetch inactive leads: ${error.message}`)
  return (data ?? []) as unknown as Lead[]
}

export async function getLeadStatusHistory(leadId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('lead_status_history')
    .select('*, profiles:changed_by ( full_name )')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
  return data ?? []
}

// =============================================================================
// DOMAIN OPERATIONS
// =============================================================================

export async function createLead(rawInput: unknown, userId: string): Promise<Lead> {
  const input = parseAndValidate(LeadCreateSchema, rawInput, 'Create lead')
  const supabase = await createServerSupabaseClient()

  // Guard: no duplicate active lead for same client
  const { data: existing } = await supabase
    .from('leads')
    .select('id, status')
    .eq('client_id', input.client_id)
    .not('status', 'in', '("lost","converted")')
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    throw new BusinessRuleError(
      `Client already has an active lead (${existing.status}). Update it instead.`,
      'DUPLICATE_LEAD',
      { existingLeadId: existing.id, status: existing.status }
    )
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...input,
      assigned_agent: input.assigned_agent ?? userId,
      status: 'new',
    })
    .select(LEAD_SELECT)
    .single()

  if (error) throw new Error(`Failed to create lead: ${error.message}`)

  await writeAuditLog({
    action:      AUDIT_ACTIONS.LEAD_CREATED,
    entity_type: 'leads',
    entity_id:   (data as any).id,
    new_data:    input as Record<string, unknown>,
    user_id:     userId,
  })

  return data as unknown as Lead
}

export async function updateLead(
  leadId: string,
  rawInput: unknown,
  userId: string
): Promise<Lead> {
  const input = parseAndValidate(LeadUpdateSchema, rawInput, 'Update lead')

  if ('status' in input) {
    throw new ValidationError(
      'Use transitionLeadStatus() to change lead status',
      'status'
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('leads')
    .update({ ...input, last_activity: new Date().toISOString() })
    .eq('id', leadId)
    .is('deleted_at', null)
    .select(LEAD_SELECT)
    .single()

  if (error) throw new Error(`Failed to update lead: ${error.message}`)

  await writeAuditLog({
    action:      AUDIT_ACTIONS.LEAD_UPDATED,
    entity_type: 'leads',
    entity_id:   leadId,
    new_data:    input as Record<string, unknown>,
    user_id:     userId,
  })

  return data as unknown as Lead
}

export async function transitionLeadStatus(
  leadId: string,
  newStatus: string,
  userId: string,
  options: { lost_reason?: string } = {}
): Promise<Lead> {
  const lead = await getLeadById(leadId)
  if (!lead) throw new ValidationError('Lead not found', 'lead_id')

  const machine = new LeadStateMachine(lead.status)
  const check = machine.validate(newStatus as any, options)
  if (!check.ok) throw new BusinessRuleError(check.error!, 'INVALID_LEAD_TRANSITION')

  const supabase = await createServerSupabaseClient()
  const update: Record<string, unknown> = {
    status: newStatus,
    last_activity: new Date().toISOString(),
  }
  if (newStatus === 'lost') update.lost_reason = options.lost_reason

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId)
    .select(LEAD_SELECT)
    .single()

  if (error) throw new Error(`Failed to update lead status: ${error.message}`)

  // Log to lead_status_history
  await supabase.from('lead_status_history').insert({
    lead_id:     leadId,
    from_status: lead.status,
    to_status:   newStatus,
    changed_by:  userId,
    reason:      options.lost_reason ?? null,
  })

  await writeAuditLog({
    action:      newStatus === 'lost' ? AUDIT_ACTIONS.LEAD_LOST : AUDIT_ACTIONS.LEAD_UPDATED,
    entity_type: 'leads',
    entity_id:   leadId,
    old_data:    { status: lead.status },
    new_data:    { status: newStatus, ...options },
    user_id:     userId,
  })

  return data as unknown as Lead
}

export async function logLeadActivity(
  leadId: string,
  type: Activity['type'],
  notes: string,
  userId: string
): Promise<Activity> {
  if (!notes?.trim()) throw new ValidationError('Notes are required', 'notes')

  const lead = await getLeadById(leadId)
  if (!lead) throw new ValidationError('Lead not found', 'lead_id')
  if (lead.status === 'converted') {
    throw new BusinessRuleError(
      'Lead is converted — log activities on the deal instead',
      'LEAD_CONVERTED'
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .insert({ lead_id: leadId, type, notes: notes.trim(), created_by: userId })
    .select('*, profiles:created_by ( id, full_name )')
    .single()

  if (error) throw new Error(`Failed to log activity: ${error.message}`)
  return data as unknown as Activity
}

export async function convertLeadToDeal(
  leadId: string,
  dealInput: {
    property_id: string
    agent_id: string
    deal_type: 'sale' | 'rental' | 'resale'
    agreed_price: number
    notes?: string
    initialPayments?: Array<{ amount: number; due_date: string }>
  },
  userId: string
): Promise<{ deal_id: string; payments_created: number }> {
  const lead = await getLeadById(leadId)
  if (!lead) throw new ValidationError('Lead not found', 'lead_id')
  if (!lead.client_id) throw new ValidationError('Lead has no client', 'client_id')

  const machine = new LeadStateMachine(lead.status)
  if (machine.isConverted) throw new BusinessRuleError('Lead is already converted', 'LEAD_ALREADY_CONVERTED')
  if (machine.isLost) throw new BusinessRuleError('Cannot convert a lost lead — reactivate first', 'LEAD_IS_LOST')

  const { tx_createDealWithPayment } = await import('@/core/transactionManager')
  const result = await tx_createDealWithPayment(
    {
      lead_id:     leadId,
      client_id:   lead.client_id,
      property_id: dealInput.property_id,
      agent_id:    dealInput.agent_id,
      deal_type:   dealInput.deal_type,
      agreed_price: dealInput.agreed_price,
      notes:        dealInput.notes,
      initialPayments: dealInput.initialPayments,
    },
    userId
  )

  await writeAuditLog({
    action:      AUDIT_ACTIONS.LEAD_CONVERTED,
    entity_type: 'leads',
    entity_id:   leadId,
    new_data:    { deal_id: result.deal_id },
    user_id:     userId,
  })

  return { deal_id: result.deal_id, payments_created: result.payments_created }
}

export async function softDeleteLead(leadId: string, userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const lead = await getLeadById(leadId)
  if (!lead) throw new ValidationError('Lead not found', 'lead_id')

  const machine = new LeadStateMachine(lead.status)
  if (!machine.isTerminal) {
    throw new BusinessRuleError('Only lost or converted leads can be archived', 'ARCHIVE_BLOCKED')
  }

  await supabase.from('leads').update({ deleted_at: new Date().toISOString() }).eq('id', leadId)
  await writeAuditLog({ action: 'lead.archived', entity_type: 'leads', entity_id: leadId, user_id: userId })
}
