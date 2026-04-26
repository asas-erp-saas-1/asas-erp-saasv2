// src/services/financeService.ts
// Advanced financial engine — refunds, penalties, multi-agent commissions

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog, AUDIT_ACTIONS } from '@/utils/auditLog'
import type { Expense, FinanceSummary, FinanceFilters } from '@/types/app'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// =============================================================================
// PAYMENT REFUNDS
// =============================================================================

export async function getRefundsForDeal(dealId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('payment_refunds')
    .select('*, profiles:processed_by ( full_name )')
    .eq('deal_id', dealId)
    .order('processed_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch refunds: ${error.message}`)
  return data ?? []
}

export async function processRefund(input: {
  payment_id:    string
  deal_id:       string
  amount:        number
  reason:        string
  refund_method: 'cash' | 'bank_transfer' | 'check'
  reference_no?: string
  notes?:        string
}, userId: string) {
  const supabase = await createServerSupabaseClient()

  if (input.amount <= 0) throw new Error('Refund amount must be positive')

  // Verify payment exists and was paid
  const { data: payment } = await supabase
    .from('deal_payments')
    .select('id, amount, status')
    .eq('id', input.payment_id)
    .single()

  if (!payment) throw new Error('Payment not found')
  if (payment.status !== 'paid') throw new Error('Can only refund paid payments')

  const { data: existing } = await supabase
    .from('payment_refunds')
    .select('amount')
    .eq('original_payment_id', input.payment_id)

  const alreadyRefunded = (existing ?? []).reduce((s, r) => s + r.amount, 0)
  const maxRefundable = payment.amount - alreadyRefunded

  if (input.amount > maxRefundable) {
    throw new Error(`Refund exceeds refundable balance (max: ${maxRefundable})`)
  }

  const { data, error } = await supabase
    .from('payment_refunds')
    .insert({
      original_payment_id: input.payment_id,
      deal_id:             input.deal_id,
      amount:              input.amount,
      reason:              input.reason,
      processed_by:        userId,
      refund_method:       input.refund_method,
      reference_no:        input.reference_no ?? null,
      notes:               input.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('OVER_REFUND_BLOCKED')) throw new Error('Over-refund blocked by database')
    throw new Error(`Failed to process refund: ${error.message}`)
  }

  // Update deal total_refunded
  const { data: allRefunds } = await supabase
    .from('payment_refunds')
    .select('amount')
    .eq('deal_id', input.deal_id)

  const totalRefunded = (allRefunds ?? []).reduce((s, r) => s + r.amount, 0)
  await supabase.from('deals').update({ total_refunded: totalRefunded }).eq('id', input.deal_id)

  await writeAuditLog({
    action: 'payment.refunded', entity_type: 'payment_refunds', entity_id: (data as any).id,
    new_data: { amount: input.amount, reason: input.reason }, user_id: userId,
  })

  return data
}

// =============================================================================
// CANCELLATION PENALTIES
// =============================================================================

export async function applyPenalty(input: {
  deal_id:       string
  amount:        number
  reason:        string
  notes?:        string
}, userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('status, agreed_price')
    .eq('id', input.deal_id)
    .single()

  if (!deal) throw new Error('Deal not found')
  if (deal.status !== 'cancelled') throw new Error('Penalties can only be applied to cancelled deals')

  const pct = deal.agreed_price > 0
    ? Math.round((input.amount / deal.agreed_price) * 10000) / 100
    : 0

  const { data, error } = await supabase
    .from('cancellation_penalties')
    .upsert({
      deal_id:     input.deal_id,
      amount:      input.amount,
      pct_of_deal: pct,
      reason:      input.reason,
      applied_by:  userId,
      notes:       input.notes ?? null,
    }, { onConflict: 'deal_id' })
    .select()
    .single()

  if (error) throw new Error(`Failed to apply penalty: ${error.message}`)

  await supabase.from('deals').update({ penalty_applied: true }).eq('id', input.deal_id)

  await writeAuditLog({
    action: 'deal.penalty_applied', entity_type: 'cancellation_penalties', entity_id: (data as any).id,
    new_data: { amount: input.amount, pct }, user_id: userId,
  })

  return data
}

export async function markPenaltyCollected(penaltyId: string, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('cancellation_penalties')
    .update({ collected: true, collected_at: new Date().toISOString() })
    .eq('id', penaltyId)

  if (error) throw new Error(`Failed: ${error.message}`)
}

// =============================================================================
// EXPENSES
// =============================================================================

export async function getExpenses(filters: FinanceFilters = {}, page = 1, limit = 30) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('expenses')
    .select('*, profiles:paid_by ( id, full_name )', { count: 'exact' })
    .order('expense_date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (filters.month && filters.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const end = format(endOfMonth(new Date(parseInt(filters.year), parseInt(filters.month) - 1)), 'yyyy-MM-dd')
    query = query.gte('expense_date', start).lte('expense_date', end)
  }

  const { data, error, count } = await query
  if (error) throw new Error(`Failed: ${error.message}`)
  return { data: (data ?? []) as unknown as Expense[], count: count ?? 0 }
}

export async function createExpense(input: {
  category:     string
  amount:       number
  expense_date: string
  description:  string
  receipt_url?: string
  notes?:       string
}, userId: string): Promise<Expense> {
  const supabase = await createServerSupabaseClient()

  if (input.amount <= 0) throw new Error('Expense amount must be positive')
  if (!input.description?.trim()) throw new Error('Description is required')

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, paid_by: userId })
    .select('*, profiles:paid_by ( id, full_name )')
    .single()

  if (error) throw new Error(`Failed: ${error.message}`)

  await writeAuditLog({
    action: AUDIT_ACTIONS.EXPENSE_ADDED, entity_type: 'expenses', entity_id: (data as any).id,
    new_data: input as Record<string, unknown>, user_id: userId,
  })

  return data as unknown as Expense
}

// =============================================================================
// FINANCIAL SUMMARY
// =============================================================================

export async function getFinanceSummary(monthDate = new Date()): Promise<FinanceSummary> {
  const supabase = await createServerSupabaseClient()
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end   = format(endOfMonth(monthDate), 'yyyy-MM-dd')
  const label = format(monthDate, 'MMMM yyyy')

  const [paymentsRes, expensesRes, commissionsRes, refundsRes, penaltiesRes] = await Promise.all([
    supabase.from('deal_payments').select('amount').eq('status', 'paid').gte('paid_date', start).lte('paid_date', end),
    supabase.from('expenses').select('amount').gte('expense_date', start).lte('expense_date', end),
    supabase.from('vw_commission_splits_balance').select('agreed_amount, total_paid, outstanding'),
    supabase.from('payment_refunds').select('amount').gte('processed_at', start).lte('processed_at', end),
    supabase.from('cancellation_penalties').select('amount').eq('collected', true).gte('applied_at', start).lte('applied_at', end),
  ])

  const totalRevenue   = (paymentsRes.data  ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalExpenses  = (expensesRes.data  ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
  const totalRefunds   = (refundsRes.data   ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalPenalties = (penaltiesRes.data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const commAgreed     = (commissionsRes.data ?? []).reduce((s, c) => s + (c.agreed_amount ?? 0), 0)
  const commReceived   = (commissionsRes.data ?? []).reduce((s, c) => s + (c.total_paid ?? 0), 0)
  const commOutstanding = (commissionsRes.data ?? []).reduce((s, c) => s + (c.outstanding ?? 0), 0)

  const netRevenue = totalRevenue - totalRefunds + totalPenalties

  return {
    totalRevenue:          netRevenue,
    commissionAgreed:      commAgreed,
    commissionReceived:    commReceived,
    commissionOutstanding: commOutstanding,
    totalExpenses,
    netProfit:             netRevenue - totalExpenses,
    periodLabel:           label,
    totalRefunds,
    totalPenalties,
  }
}
