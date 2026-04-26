// src/services/agentService.ts
// Agent performance system — KPIs, ranking, bonus tiers, scoring

import { createServerSupabaseClient } from '@/lib/supabase/server'

// =============================================================================
// TYPES
// =============================================================================

export interface AgentKPI {
  agentId:              string
  agentName:            string
  phone:                string | null
  // Leads
  totalLeads:           number
  activeLeads:          number
  convertedLeads:       number
  lostLeads:            number
  leadConversionRate:   number
  // Deals
  totalDeals:           number
  activeDeals:          number
  closedDeals:          number
  cancelledDeals:       number
  dealCloseRate:        number
  // Finance
  totalRevenue:         number
  avgDealSize:          number
  commissionAgreed:     number
  commissionReceived:   number
  commissionOutstanding: number
  // Risk
  highRiskDeals:        number
  overduePayments:      number
  // Score
  performanceScore:     number
  rank:                 number
  tier:                 'Elite' | 'Gold' | 'Silver' | 'Bronze' | 'Starter'
}

export interface AgentRanking {
  rank:             number
  agentId:          string
  agentName:        string
  performanceScore: number
  closedDeals:      number
  totalRevenue:     number
  tier:             string
  delta:            number | null  // change from previous snapshot
}

export interface BonusEligibility {
  tierName:    string
  dealsCount:  number
  revenue:     number
  bonusAmount: number
  qualifies:   boolean
}

// =============================================================================
// KPI QUERIES
// =============================================================================

export async function getAgentKPIs(): Promise<AgentKPI[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('vw_agent_performance')
    .select('*')
    .order('total_revenue', { ascending: false })

  if (error) throw new Error(`Failed to fetch agent KPIs: ${error.message}`)

  const raw = (data ?? []) as Record<string, any>[]
  const ranked = raw.map((a, idx) => ({
    agentId:               a.agent_id,
    agentName:             a.agent_name,
    phone:                 a.phone,
    totalLeads:            a.total_leads ?? 0,
    activeLeads:           a.active_leads ?? 0,
    convertedLeads:        a.converted_leads ?? 0,
    lostLeads:             a.lost_leads ?? 0,
    leadConversionRate:    a.lead_conversion_rate ?? 0,
    totalDeals:            a.total_deals ?? 0,
    activeDeals:           a.active_deals ?? 0,
    closedDeals:           a.closed_deals ?? 0,
    cancelledDeals:        a.cancelled_deals ?? 0,
    dealCloseRate:         a.deal_close_rate ?? 0,
    totalRevenue:          a.total_revenue ?? 0,
    avgDealSize:           a.avg_deal_size ?? 0,
    commissionAgreed:      a.commission_agreed ?? 0,
    commissionReceived:    a.commission_received ?? 0,
    commissionOutstanding: a.commission_outstanding ?? 0,
    highRiskDeals:         a.high_risk_deals ?? 0,
    overduePayments:       a.overdue_payments ?? 0,
    performanceScore:      _computePerformanceScore(a),
    rank:                  idx + 1,
    tier:                  _determineTier(a.closed_deals ?? 0, a.total_revenue ?? 0),
  }))

  // Sort by performance score and re-rank
  ranked.sort((a, b) => b.performanceScore - a.performanceScore)
  return ranked.map((a, idx) => ({ ...a, rank: idx + 1 }))
}

export async function getAgentKPIById(agentId: string): Promise<AgentKPI | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('vw_agent_performance')
    .select('*')
    .eq('agent_id', agentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch agent KPI: ${error.message}`)
  }

  const a = data as Record<string, any>
  return {
    agentId:               a.agent_id,
    agentName:             a.agent_name,
    phone:                 a.phone,
    totalLeads:            a.total_leads ?? 0,
    activeLeads:           a.active_leads ?? 0,
    convertedLeads:        a.converted_leads ?? 0,
    lostLeads:             a.lost_leads ?? 0,
    leadConversionRate:    a.lead_conversion_rate ?? 0,
    totalDeals:            a.total_deals ?? 0,
    activeDeals:           a.active_deals ?? 0,
    closedDeals:           a.closed_deals ?? 0,
    cancelledDeals:        a.cancelled_deals ?? 0,
    dealCloseRate:         a.deal_close_rate ?? 0,
    totalRevenue:          a.total_revenue ?? 0,
    avgDealSize:           a.avg_deal_size ?? 0,
    commissionAgreed:      a.commission_agreed ?? 0,
    commissionReceived:    a.commission_received ?? 0,
    commissionOutstanding: a.commission_outstanding ?? 0,
    highRiskDeals:         a.high_risk_deals ?? 0,
    overduePayments:       a.overdue_payments ?? 0,
    performanceScore:      _computePerformanceScore(a),
    rank:                  1,
    tier:                  _determineTier(a.closed_deals ?? 0, a.total_revenue ?? 0),
  }
}

export async function getAgentRankings(): Promise<AgentRanking[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('agent_kpi_snapshots')
    .select('rank, agent_id, profiles(full_name), performance_score, closed_deals, total_revenue')
    .order('snapshot_date', { ascending: false })
    .order('rank', { ascending: true })
    .limit(20)

  if (error) return []

  return (data ?? []).map((s: any) => ({
    rank:             s.rank,
    agentId:          s.agent_id,
    agentName:        s.profiles?.full_name ?? 'Unknown',
    performanceScore: s.performance_score,
    closedDeals:      s.closed_deals,
    totalRevenue:     s.total_revenue,
    tier:             _determineTier(s.closed_deals, s.total_revenue),
    delta:            null
  }))
}

export async function getKPIHistory(
  agentId: string,
  days = 30
): Promise<Array<any>> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('agent_kpi_snapshots')
    .select('*')
    .eq('agent_id', agentId)
    .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('snapshot_date', { ascending: true })

  if (error) return []
  return data ?? []
}

// =============================================================================
// BONUS TIER SYSTEM
// =============================================================================

export async function checkBonusEligibility(
  agentId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<BonusEligibility[]> {
  throw new Error('Not implemented: fn_compute_agent_bonus does not exist')
}

export async function recordBonusEarning(
  agentId: string,
  tierName: string,
  periodStart: string,
  periodEnd: string,
  bonusAmount: number,
  dealsCount: number,
  revenueTotal: number,
  userId: string
): Promise<void> {
  throw new Error('Not implemented: commission_bonus_tiers does not exist')
}

export async function markBonusPaid(earningId: string): Promise<void> {
  throw new Error('Not implemented: agent_bonus_earnings does not exist')
}

// =============================================================================
// COMMISSION SPLITS
// =============================================================================

export async function createCommissionSplit(input: any, approvedBy: string) {
  throw new Error('Not implemented: commission_splits does not exist')
}

export async function getCommissionSplitsForDeal(dealId: string) {
  throw new Error('Not implemented: vw_commission_splits_balance does not exist')
}

export async function payCommissionSplit(input: any, paidBy: string) {
  throw new Error('Not implemented: split_payments does not exist')
}

// =============================================================================
// HELPERS
// =============================================================================

function _computePerformanceScore(a: Record<string, any>): number {
  const conversionWeight  = (a.lead_conversion_rate ?? 0) * 0.25
  const closeRateWeight   = (a.deal_close_rate ?? 0) * 0.35
  const revenueWeight     = Math.min(25,
    (a.total_revenue ?? 0) > 50_000_000 ? 25 :
    (a.total_revenue ?? 0) > 20_000_000 ? 18 :
    (a.total_revenue ?? 0) > 5_000_000  ? 10 : 0
  )
  const cleanlinessWeight = Math.max(0, 15 - ((a.overdue_payments ?? 0) * 3))

  return Math.min(100, Math.max(0, Math.round(
    conversionWeight + closeRateWeight + revenueWeight + cleanlinessWeight
  )))
}

function _determineTier(
  closedDeals: number,
  revenue: number
): AgentKPI['tier'] {
  if (closedDeals >= 10 && revenue >= 40_000_000) return 'Elite'
  if (closedDeals >= 6  && revenue >= 20_000_000) return 'Gold'
  if (closedDeals >= 4  && revenue >= 10_000_000) return 'Silver'
  if (closedDeals >= 2  && revenue >= 5_000_000)  return 'Bronze'
  return 'Starter'
}
