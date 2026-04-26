// src/services/dealService.ts
// Public API for deal operations — delegates to DealEngine

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createDealEngine } from '@/core/dealEngine'
import type { Deal, DealFilters, DealPayment, Activity, PaginatedResponse } from '@/types/app'

// =============================================================================
// ENGINE FACTORY (requires auth context)
// =============================================================================

export async function getDealEngine() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    engine: createDealEngine(user.id, profile?.role ?? 'agent'),
    userId: user.id,
    role:   profile?.role ?? 'agent',
  }
}

// =============================================================================
// QUERIES
// =============================================================================

const DEAL_SELECT = `
  id, lead_id, client_id, property_id, agent_id, deal_type, status,
  agreed_price, contract_date, closing_date, notes, next_action,
  next_action_due, risk_level, at_risk_since, commission_generated,
  total_payments_scheduled, total_payments_received,
  activated_at, negotiation_started_at, cancellation_reason,
  penalty_applied, total_refunded, created_at, updated_at,
  clients:client_id       ( id, full_name, phone ),
  profiles:agent_id       ( id, full_name ),
  properties:property_id  (
    id, reference_code, type, rooms, area_sqm, list_price,
    projects:project_id ( id, name, city, location )
  )
`

export async function getDeals(
  filters: DealFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Deal>> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('deals')
    .select(DEAL_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (filters.status)   query = query.eq('status', filters.status)
  if (filters.agentId)  query = query.eq('agent_id', filters.agentId)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo)   query = query.lte('created_at', filters.dateTo)

  const { data, error, count } = await query
  if (error) throw new Error(`Failed to fetch deals: ${error.message}`)

  return {
    data: (data ?? []) as unknown as Deal[],
    count: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function getDealById(dealId: string): Promise<Deal | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('id', dealId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch deal: ${error.message}`)
  }
  return data as unknown as Deal
}

export async function getDealsAtRisk(inactiveDays = 7): Promise<Deal[]> {
  const supabase = await createServerSupabaseClient()
  const cutoff = new Date(Date.now() - inactiveDays * 86_400_000).toISOString()

  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .not('status', 'in', '("closed","cancelled")')
    .is('deleted_at', null)
    .or(`updated_at.lt.${cutoff},risk_level.in.(high,critical)`)
    .order('risk_level', { ascending: false })
    .limit(20)

  if (error) throw new Error(`Failed: ${error.message}`)
  return (data ?? []) as unknown as Deal[]
}

export async function getDealPayments(dealId: string): Promise<DealPayment[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('deal_payments')
    .select('*')
    .eq('deal_id', dealId)
    .order('due_date', { ascending: true })

  if (error) throw new Error(`Failed: ${error.message}`)
  return (data ?? []) as DealPayment[]
}

export async function getDealActivities(dealId: string): Promise<Activity[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, profiles:created_by ( id, full_name )')
    .eq('deal_id', dealId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed: ${error.message}`)
  return (data ?? []) as unknown as Activity[]
}

export async function getOverduePayments() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('deal_payments')
    .select(`
      *,
      deals:deal_id (
        id, agreed_price, status, risk_level,
        clients:client_id ( full_name, phone ),
        profiles:agent_id ( full_name )
      )
    `)
    .eq('status', 'overdue')
    .order('due_date', { ascending: true })

  if (error) throw new Error(`Failed: ${error.message}`)
  return (data ?? []) as unknown as DealPayment[]
}

// =============================================================================
// DOMAIN OPERATIONS (via Engine)
// =============================================================================

export async function createDeal(input: Parameters<ReturnType<typeof createDealEngine>['createDeal']>[0]) {
  const { engine } = await getDealEngine()
  return engine.createDeal(input)
}

export async function activateDeal(dealId: string) {
  const { engine } = await getDealEngine()
  return engine.activateDeal(dealId)
}

export async function startNegotiation(dealId: string, opts: { contract_date?: string; notes?: string } = {}) {
  const { engine } = await getDealEngine()
  return engine.startNegotiation(dealId, opts)
}

export async function registerPayment(
  paymentId: string,
  paidDate: string,
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'card',
  referenceNo?: string
) {
  const { engine } = await getDealEngine()
  return engine.registerPayment(paymentId, paidDate, paymentMethod, referenceNo)
}

export async function addPaymentSchedule(input: {
  deal_id: string; amount: number; due_date: string; notes?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: deal } = await supabase
    .from('deals')
    .select('status, agreed_price, total_payments_scheduled')
    .eq('id', input.deal_id)
    .single()

  if (!deal) throw new Error('Deal not found')
  if (['closed', 'cancelled'].includes(deal.status)) throw new Error(`Cannot add payment to ${deal.status} deal`)

  const remaining = deal.agreed_price - (deal.total_payments_scheduled ?? 0)
  if (input.amount > remaining) throw new Error(`Payment exceeds remaining capacity (${remaining})`)

  const { data, error } = await supabase
    .from('deal_payments')
    .insert({ ...input, created_by: user.id, status: 'pending' })
    .select()
    .single()

  if (error) {
    if (error.message.includes('OVERPAYMENT_BLOCKED')) throw new Error('Overpayment blocked by database')
    throw new Error(`Failed: ${error.message}`)
  }
  return data
}

export async function closeDeal(dealId: string, closingNotes?: string) {
  const { engine } = await getDealEngine()
  return engine.closeDeal(dealId, closingNotes)
}

export async function cancelDeal(
  dealId: string,
  reason: string,
  opts: {
    penaltyAmount?: number
    penaltyReason?: string
    refunds?: Array<{ payment_id: string; amount: number; refund_method: 'cash' | 'bank_transfer' | 'check' }>
  } = {}
) {
  const { engine } = await getDealEngine()
  return engine.cancelDeal(dealId, reason, opts)
}

export async function processRefund(input: Parameters<ReturnType<typeof createDealEngine>['processRefund']>[0]) {
  const { engine } = await getDealEngine()
  return engine.processRefund(input)
}

export async function updateNextAction(dealId: string, nextAction: string, nextActionDue: string | null) {
  const { engine } = await getDealEngine()
  return engine.updateNextAction(dealId, nextAction, nextActionDue)
}

export async function getDealHealth(dealId: string) {
  const { engine } = await getDealEngine()
  return engine.getDealHealth(dealId)
}

export async function refreshRiskScore(dealId: string) {
  const { engine } = await getDealEngine()
  return engine.refreshRiskScore(dealId)
}

export async function logDealActivity(dealId: string, type: string, notes: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (!notes?.trim()) throw new Error('Notes are required')

  const { data, error } = await supabase
    .from('activities')
    .insert({ deal_id: dealId, type, notes: notes.trim(), created_by: user.id })
    .select('*, profiles:created_by ( id, full_name )')
    .single()

  if (error) throw new Error(`Failed: ${error.message}`)

  await supabase
    .from('deals')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .not('status', 'in', '("closed","cancelled")')

  return data
}

export async function softDeleteDeal(dealId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: deal } = await supabase.from('deals').select('status').eq('id', dealId).single()
  if (!deal) throw new Error('Deal not found')
  if (!['closed', 'cancelled'].includes(deal.status)) throw new Error('Only terminal deals can be archived')

  await supabase.from('deals').update({ deleted_at: new Date().toISOString() }).eq('id', dealId)
}
