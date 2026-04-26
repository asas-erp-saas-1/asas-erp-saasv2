// src/core/dealEngine.ts
// THE DEAL ENGINE — Central brain of ASAS
// All deal operations go through here. No service touches deal state directly.
// Engine → TransactionManager → Database

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog, AUDIT_ACTIONS } from '@/utils/auditLog'
import {
  DealStateMachine,
  computeRisk,
  generateNextAction,
  type DealStatus,
  type RiskResult,
  type NextActionOutput,
} from './stateMachine'
import {
  tx_createDealWithPayment,
  tx_registerPayment,
  tx_closeDeal,
  tx_cancelDealWithRefund,
  tx_processRefund,
  tx_transitionStatus,
  type TxCreateDealInput,
  type TxCreateDealResult,
  type TxCloseDealResult,
  type TxCancelDealResult,
  type TxRefundInput,
} from './transactionManager'
import { automationEngine } from './automationEngine'

// =============================================================================
// ENGINE INTERFACE
// =============================================================================

interface DealEngineContext {
  userId:    string
  userRole:  string
  isManager: boolean
}

interface DealSummary {
  id: string
  status: DealStatus
  agreedPrice: number
  totalReceived: number
  totalScheduled: number
  paymentPct: number
  overdueCount: number
  pendingCount: number
  riskScore: number
  riskLevel: string
  nextAction: NextActionOutput
  canClose: boolean
  blockers: string[]
}

// =============================================================================
// THE ENGINE CLASS
// =============================================================================

export class DealEngine {
  private ctx: DealEngineContext

  constructor(ctx: DealEngineContext) {
    this.ctx = ctx
  }

  // ---------------------------------------------------------------------------
  // CREATE DEAL
  // Entry point for all new deals — validates, creates, triggers first automation
  // ---------------------------------------------------------------------------
  async createDeal(input: TxCreateDealInput): Promise<TxCreateDealResult> {
    if (input.agreed_price <= 0) throw new Error('Agreed price must be greater than 0')
    if (!input.client_id)        throw new Error('Client is required')
    if (!input.property_id)      throw new Error('Property is required')
    if (!input.agent_id)         throw new Error('Agent is required')

    const result = await tx_createDealWithPayment(input, this.ctx.userId)

    // Trigger automation: schedule first activation reminder
    await automationEngine.onDealCreated(result.deal_id, input.agent_id)

    return result
  }

  // ---------------------------------------------------------------------------
  // ACTIVATE DEAL (draft → active)
  // ---------------------------------------------------------------------------
  async activateDeal(dealId: string): Promise<{ deal_id: string }> {
    const deal = await this._fetchDeal(dealId)
    const machine = new DealStateMachine(deal.status)
    const check = machine.validate('active')
    if (!check.ok) throw new Error(check.error)

    await tx_transitionStatus(dealId, 'active', this.ctx.userId)

    // Set smart next action
    const nextAction = generateNextAction({
      status: 'active', overduePayments: 0, pendingPayments: 0,
      daysSinceUpdate: 0, paymentPct: 0,
      next_action: null, next_action_due: null,
    })
    await this._setNextAction(dealId, nextAction)

    await automationEngine.onDealActivated(dealId, deal.agent_id)

    return { deal_id: dealId }
  }

  // ---------------------------------------------------------------------------
  // START NEGOTIATION (active → negotiation)
  // ---------------------------------------------------------------------------
  async startNegotiation(
    dealId: string,
    opts: { contract_date?: string; notes?: string } = {}
  ): Promise<{ deal_id: string }> {
    this._requireManager()

    const deal = await this._fetchDeal(dealId)
    const machine = new DealStateMachine(deal.status)
    const check = machine.validate('negotiation')
    if (!check.ok) throw new Error(check.error)

    await tx_transitionStatus(dealId, 'negotiation', this.ctx.userId, opts)

    const nextAction = generateNextAction({
      status: 'negotiation', overduePayments: 0, pendingPayments: 0,
      daysSinceUpdate: 0, paymentPct: 0,
      next_action: null, next_action_due: null, hasPaymentSchedule: false,
    })
    await this._setNextAction(dealId, nextAction)

    return { deal_id: dealId }
  }

  // ---------------------------------------------------------------------------
  // REGISTER PAYMENT
  // ---------------------------------------------------------------------------
  async registerPayment(
    paymentId: string,
    paidDate: string,
    paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'card',
    referenceNo?: string
  ) {
    this._requireManager()

    const result = await tx_registerPayment(paymentId, paidDate, paymentMethod, referenceNo, this.ctx.userId)

    // If deal status advanced, refresh next action
    if (result.deal_status_advanced && result.new_deal_status) {
      await this._refreshNextAction(result.deal_id)
    }

    // Refresh risk score
    await this.refreshRiskScore(result.deal_id)

    return result
  }

  // ---------------------------------------------------------------------------
  // CLOSE DEAL (negotiation → closed)
  // ---------------------------------------------------------------------------
  async closeDeal(dealId: string, closingNotes?: string): Promise<TxCloseDealResult> {
    this._requireManager()

    // Pre-validate via health check
    const health = await this.getDealHealth(dealId)
    if (!health.canClose) {
      throw new Error(`Cannot close deal: ${health.blockers.join('; ')}`)
    }

    const result = await tx_closeDeal(dealId, closingNotes, this.ctx.userId)

    await automationEngine.onDealClosed(dealId)

    return result
  }

  // ---------------------------------------------------------------------------
  // CANCEL DEAL
  // ---------------------------------------------------------------------------
  async cancelDeal(
    dealId: string,
    reason: string,
    opts: {
      penaltyAmount?: number
      penaltyReason?: string
      refunds?: Array<{ payment_id: string; amount: number; refund_method: 'cash' | 'bank_transfer' | 'check' }>
    } = {}
  ): Promise<TxCancelDealResult> {
    this._requireManager()

    if (!reason?.trim() || reason.trim().length < 5) {
      throw new Error('Cancellation reason is required (min 5 characters)')
    }

    const result = await tx_cancelDealWithRefund(dealId, reason, this.ctx.userId, opts)

    await automationEngine.onDealCancelled(dealId)

    return result
  }

  // ---------------------------------------------------------------------------
  // PROCESS REFUND
  // ---------------------------------------------------------------------------
  async processRefund(input: TxRefundInput) {
    this._requireManager()
    return tx_processRefund(input, this.ctx.userId)
  }

  // ---------------------------------------------------------------------------
  // UPDATE NEXT ACTION
  // ---------------------------------------------------------------------------
  async updateNextAction(
    dealId: string,
    nextAction: string,
    nextActionDue: string | null
  ) {
    const supabase = await createServerSupabaseClient()
    const deal = await this._fetchDeal(dealId)

    if (new DealStateMachine(deal.status).isLocked) {
      throw new Error(`Cannot update a ${deal.status} deal`)
    }

    await supabase
      .from('deals')
      .update({ next_action: nextAction, next_action_due: nextActionDue, updated_at: new Date().toISOString() })
      .eq('id', dealId)

    await writeAuditLog({
      action: AUDIT_ACTIONS.DEAL_UPDATED,
      entity_type: 'deals',
      entity_id: dealId,
      new_data: { next_action: nextAction, next_action_due: nextActionDue },
      user_id: this.ctx.userId,
    })
  }

  // ---------------------------------------------------------------------------
  // REFRESH RISK SCORE (compute + persist)
  // ---------------------------------------------------------------------------
  async refreshRiskScore(dealId: string): Promise<RiskResult> {
    const supabase = await createServerSupabaseClient()

    const { data: deal } = await supabase
      .from('deals')
      .select('status, updated_at, next_action, next_action_due, agreed_price, total_payments_scheduled, total_payments_received')
      .eq('id', dealId)
      .single()

    if (!deal) throw new Error('Deal not found')

    const { data: payments } = await supabase
      .from('deal_payments')
      .select('status, due_date')
      .eq('deal_id', dealId)

    const overdue  = (payments ?? []).filter(p => p.status === 'overdue')
    const pending  = (payments ?? []).filter(p => p.status === 'pending')
    const daysSince = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000)
    const maxOverdue = overdue.length > 0
      ? Math.max(...overdue.map(p => Math.floor((Date.now() - new Date(p.due_date).getTime()) / 86_400_000)))
      : 0
    const nextDue = deal.next_action_due
      ? Math.floor((Date.now() - new Date(deal.next_action_due).getTime()) / 86_400_000)
      : 0
    const pct = deal.agreed_price > 0
      ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
      : 0

    const risk = computeRisk({
      status:                 deal.status as DealStatus,
      daysSinceUpdate:        daysSince,
      overduePayments:        overdue.length,
      maxOverdueDays:         maxOverdue,
      pendingPayments:        pending.length,
      hasNextAction:          !!deal.next_action,
      nextActionOverdueDays:  Math.max(0, nextDue),
      paymentCompletionPct:   pct,
      totalPaymentsScheduled: deal.total_payments_scheduled ?? 0,
      agreedPrice:            deal.agreed_price,
    })

    // Persist risk to history
    await supabase.from('deal_risk_history').insert({
      deal_id:    dealId,
      score:      risk.score,
      level:      risk.level,
      signals:    risk.signals as any,
    })

    // Update deal risk_level
    if (risk.level !== (deal as any).risk_level) {
      await supabase
        .from('deals')
        .update({ risk_level: risk.level, at_risk_since: risk.level !== 'low' ? new Date().toISOString() : null })
        .eq('id', dealId)
    }

    return risk
  }

  // ---------------------------------------------------------------------------
  // GET DEAL HEALTH (pre-close validation)
  // ---------------------------------------------------------------------------
  async getDealHealth(dealId: string): Promise<DealSummary> {
    const supabase = await createServerSupabaseClient()

    const [dealRes, paymentsRes, commissionsRes] = await Promise.all([
      supabase
        .from('deals')
        .select('id, status, agreed_price, total_payments_scheduled, total_payments_received, next_action, next_action_due, commission_generated, updated_at')
        .eq('id', dealId)
        .single(),
      supabase
        .from('deal_payments')
        .select('status, due_date, amount')
        .eq('deal_id', dealId),
      supabase
        .from('commission_splits')
        .select('id')
        .eq('deal_id', dealId)
        .limit(1),
    ])

    const deal = dealRes.data
    if (!deal) throw new Error('Deal not found')

    const payments = paymentsRes.data ?? []
    const overdue  = payments.filter(p => p.status === 'overdue')
    const pending  = payments.filter(p => p.status === 'pending')
    const pct      = deal.agreed_price > 0
      ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
      : 0

    const risk = computeRisk({
      status:                 deal.status as DealStatus,
      daysSinceUpdate:        Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000),
      overduePayments:        overdue.length,
      maxOverdueDays:         overdue.length > 0 ? Math.max(...overdue.map(p => Math.floor((Date.now() - new Date(p.due_date).getTime()) / 86_400_000))) : 0,
      pendingPayments:        pending.length,
      hasNextAction:          !!deal.next_action,
      nextActionOverdueDays:  0,
      paymentCompletionPct:   pct,
      totalPaymentsScheduled: deal.total_payments_scheduled ?? 0,
      agreedPrice:            deal.agreed_price,
    })

    const nextAction = generateNextAction({
      status:              deal.status as DealStatus,
      overduePayments:     overdue.length,
      pendingPayments:     pending.length,
      daysSinceUpdate:     0,
      paymentPct:          pct,
      next_action:         deal.next_action,
      next_action_due:     deal.next_action_due,
      commissionGenerated: deal.commission_generated,
      hasPaymentSchedule:  payments.length > 0,
    })

    const blockers: string[] = []
    if (deal.status !== 'negotiation') blockers.push(`Deal must be in negotiation (currently: ${deal.status})`)
    if (pending.length > 0) blockers.push(`${pending.length} pending payment(s)`)
    if (overdue.length > 0) blockers.push(`${overdue.length} overdue payment(s)`)

    return {
      id:             deal.id,
      status:         deal.status as DealStatus,
      agreedPrice:    deal.agreed_price,
      totalReceived:  deal.total_payments_received ?? 0,
      totalScheduled: deal.total_payments_scheduled ?? 0,
      paymentPct:     pct,
      overdueCount:   overdue.length,
      pendingCount:   pending.length,
      riskScore:      risk.score,
      riskLevel:      risk.level,
      nextAction,
      canClose:       blockers.length === 0,
      blockers,
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private async _fetchDeal(dealId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('deals')
      .select('id, status, agent_id, agreed_price, total_payments_received')
      .eq('id', dealId)
      .is('deleted_at', null)
      .single()

    if (error || !data) throw new Error('Deal not found')
    return data
  }

  private _requireManager(): void {
    if (!this.ctx.isManager) {
      throw new Error('This operation requires manager or admin role')
    }
  }

  private async _setNextAction(dealId: string, suggestion: NextActionOutput) {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('deals')
      .update({ next_action: suggestion.action, next_action_due: suggestion.dueDate })
      .eq('id', dealId)
  }

  private async _refreshNextAction(dealId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: deal } = await supabase
      .from('deals')
      .select('status, next_action, next_action_due, commission_generated, total_payments_received, agreed_price, updated_at')
      .eq('id', dealId)
      .single()

    if (!deal) return

    const pct = deal.agreed_price > 0
      ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
      : 0

    const suggestion = generateNextAction({
      status: deal.status as DealStatus,
      overduePayments: 0, pendingPayments: 0,
      daysSinceUpdate: 0, paymentPct: pct,
      next_action: null, next_action_due: null,
      commissionGenerated: deal.commission_generated,
    })

    await supabase
      .from('deals')
      .update({ next_action: suggestion.action, next_action_due: suggestion.dueDate })
      .eq('id', dealId)
  }
}

// =============================================================================
// FACTORY — create engine with user context
// =============================================================================

export function createDealEngine(
  userId: string,
  userRole: string
): DealEngine {
  return new DealEngine({
    userId,
    userRole,
    isManager: ['admin', 'manager'].includes(userRole),
  })
}
