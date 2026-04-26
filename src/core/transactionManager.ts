// src/core/transactionManager.ts
// Atomic operations for all critical business flows
// Each transaction: validates → executes → logs → handles failure cleanly

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { writeAuditLog, AUDIT_ACTIONS } from '@/utils/auditLog'
import { DealStateMachine } from './stateMachine'

// =============================================================================
// TYPES
// =============================================================================

export interface TxCreateDealInput {
  lead_id?:     string
  client_id:    string
  property_id:  string
  agent_id:     string
  deal_type:    'sale' | 'rental' | 'resale'
  agreed_price: number
  notes?:       string
  next_action?: string
  initialPayments?: Array<{ amount: number; due_date: string; notes?: string }>
}

export interface TxCreateDealResult {
  deal_id:          string
  payments_created: number
  lead_converted:   boolean
}

export interface TxRegisterPaymentResult {
  payment_id:           string
  deal_id:              string
  new_total_received:   number
  payment_pct:          number
  deal_status_advanced: boolean
  new_deal_status:      string | null
}

export interface TxCloseDealResult {
  deal_id:              string
  closing_date:         string
  commission_generated: boolean
}

export interface TxCancelDealResult {
  deal_id:              string
  payments_cancelled:   number
  lead_restored:        boolean
  penalty_applied:      boolean
  penalty_amount:       number
}

export interface TxRefundInput {
  payment_id:    string
  amount:        number
  reason:        string
  refund_method: 'cash' | 'bank_transfer' | 'check'
  reference_no?: string
  notes?:        string
}

// =============================================================================
// TX: CREATE DEAL WITH INITIAL PAYMENTS
// =============================================================================

export async function tx_createDealWithPayment(
  input: TxCreateDealInput,
  userId: string
): Promise<TxCreateDealResult> {
  const supabase = await createServerSupabaseClient()

  // --- Pre-flight ---
  const { data: property } = await supabase
    .from('properties')
    .select('id, status, list_price')
    .eq('id', input.property_id)
    .single()

  if (!property) throw new Error('Property not found')
  if (!['available', 'reserved'].includes(property.status)) {
    throw new Error(`Property is "${property.status}" — not available for a new deal`)
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('id', input.client_id)
    .single()

  if (!client) throw new Error('Client not found')

  if (input.initialPayments?.length) {
    const total = input.initialPayments.reduce((s, p) => s + p.amount, 0)
    if (total > input.agreed_price) {
      throw new Error(`Initial payments (${total}) exceed agreed price (${input.agreed_price})`)
    }
  }

  // --- Create deal ---
  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .insert({
      lead_id:      input.lead_id ?? null,
      client_id:    input.client_id,
      property_id:  input.property_id,
      agent_id:     input.agent_id,
      deal_type:    input.deal_type,
      agreed_price: input.agreed_price,
      status:       'draft',
      notes:        input.notes ?? null,
      next_action:  input.next_action ?? 'Activate deal — verify details',
    })
    .select('id')
    .single()

  if (dealErr) {
    const msg = dealErr.message
    if (msg.includes('DUPLICATE_DEAL'))        throw new Error('Property already has an active deal')
    if (msg.includes('PROPERTY_UNAVAILABLE'))  throw new Error('Property is not available')
    if (msg.includes('INVALID_LEAD'))          throw new Error(msg.split('INVALID_LEAD: ')[1] ?? msg)
    throw new Error(`Failed to create deal: ${msg}`)
  }

  // --- Create initial payments ---
  let paymentsCreated = 0
  if (input.initialPayments?.length) {
    const { data: payments, error: payErr } = await supabase
      .from('deal_payments')
      .insert(input.initialPayments.map(p => ({
        deal_id:    deal.id,
        amount:     p.amount,
        due_date:   p.due_date,
        status:     'pending',
        notes:      p.notes ?? null,
        created_by: userId,
      })))
      .select('id')

    if (payErr) {
      await writeAuditLog({
        action:      'deal.partial_failure.payments',
        entity_type: 'deals',
        entity_id:   deal.id,
        new_data:    { error: payErr.message },
        user_id:     userId,
      })
    } else {
      paymentsCreated = payments?.length ?? 0
    }
  }

  // --- Convert lead ---
  let leadConverted = false
  if (input.lead_id) {
    const { error } = await supabase
      .from('leads')
      .update({ status: 'converted', last_activity: new Date().toISOString() })
      .eq('id', input.lead_id)
      .not('status', 'in', '("lost","converted")')

    leadConverted = !error
  }

  await writeAuditLog({
    action:      AUDIT_ACTIONS.DEAL_CREATED,
    entity_type: 'deals',
    entity_id:   deal.id,
    new_data:    { agreed_price: input.agreed_price, payments_created: paymentsCreated, lead_converted: leadConverted },
    user_id:     userId,
  })

  return { deal_id: deal.id, payments_created: paymentsCreated, lead_converted: leadConverted }
}

// =============================================================================
// TX: REGISTER PAYMENT (mark as paid + sync totals + advance deal if needed)
// =============================================================================

export async function tx_registerPayment(
  paymentId: string,
  paidDate: string,
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'card',
  referenceNo: string | undefined,
  userId: string
): Promise<TxRegisterPaymentResult> {
  const supabase = await createServerSupabaseClient()

  const { data: payment } = await supabase
    .from('deal_payments')
    .select('id, deal_id, amount, status')
    .eq('id', paymentId)
    .single()

  if (!payment)                      throw new Error('Payment not found')
  if (payment.status === 'paid')     throw new Error('Payment is already paid')
  if (payment.status === 'cancelled') throw new Error('Cannot pay a cancelled payment')

  const { data: deal } = await supabase
    .from('deals')
    .select('id, status, agreed_price, total_payments_received')
    .eq('id', payment.deal_id)
    .single()

  if (!deal) throw new Error('Deal not found')
  if (['closed', 'cancelled'].includes(deal.status)) {
    throw new Error(`Cannot register payment on a ${deal.status} deal`)
  }

  const { error } = await supabase
    .from('deal_payments')
    .update({
      status:         'paid',
      paid_date:      paidDate,
      payment_method: paymentMethod,
      reference_no:   referenceNo ?? null,
    })
    .eq('id', paymentId)

  if (error) throw new Error(`Failed to register payment: ${error.message}`)

  // Read fresh state after DB trigger ran
  const { data: freshDeal } = await supabase
    .from('deals')
    .select('status, total_payments_received, agreed_price')
    .eq('id', payment.deal_id)
    .single()

  const received = freshDeal?.total_payments_received ?? 0
  const pct = deal.agreed_price > 0 ? Math.round((received / deal.agreed_price) * 100) : 0
  const advanced = freshDeal?.status !== deal.status

  await writeAuditLog({
    action:      AUDIT_ACTIONS.PAYMENT_MARKED_PAID,
    entity_type: 'deal_payments',
    entity_id:   paymentId,
    new_data:    { deal_id: payment.deal_id, amount: payment.amount, pct, deal_status_advanced: advanced },
    user_id:     userId,
  })

  return {
    payment_id:           paymentId,
    deal_id:              payment.deal_id,
    new_total_received:   received,
    payment_pct:          pct,
    deal_status_advanced: advanced,
    new_deal_status:      freshDeal?.status ?? null,
  }
}

// =============================================================================
// TX: CLOSE DEAL (validate + close + trigger commission generation)
// =============================================================================

export async function tx_closeDeal(
  dealId: string,
  closingNotes: string | undefined,
  userId: string
): Promise<TxCloseDealResult> {
  const supabase = await createServerSupabaseClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('id, status, agreed_price, total_payments_received')
    .eq('id', dealId)
    .single()

  if (!deal) throw new Error('Deal not found')

  const machine = new DealStateMachine(deal.status)
  const check = machine.validate('closed')
  if (!check.ok) throw new Error(check.error)

  // Validate all payments paid (app layer — DB trigger is final guard)
  const { count: unpaid } = await supabase
    .from('deal_payments')
    .select('id', { count: 'exact', head: true })
    .eq('deal_id', dealId)
    .in('status', ['pending', 'overdue'])

  if ((unpaid ?? 0) > 0) {
    throw new Error(`${unpaid} payment(s) still unpaid — cannot close deal`)
  }

  const closingDate = new Date().toISOString().split('T')[0]

  const { error: closeErr } = await supabase
    .from('deals')
    .update({
      status:       'closed',
      closing_date: closingDate,
      notes:        closingNotes ?? null,
      next_action:  null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', dealId)

  if (closeErr) {
    const msg = closeErr.message
    if (msg.includes('CLOSE_BLOCKED'))      throw new Error(msg.split('CLOSE_BLOCKED: ')[1] ?? msg)
    if (msg.includes('INVALID_TRANSITION')) throw new Error(msg.split('INVALID_TRANSITION: ')[1] ?? msg)
    if (msg.includes('STATE_LOCKED'))       throw new Error('Deal is locked')
    throw new Error(`Failed to close deal: ${closeErr.message}`)
  }

  // Check commission was auto-generated by DB trigger
  const { data: commission } = await supabase
    .from('commission_splits')
    .select('id')
    .eq('deal_id', dealId)
    .limit(1)

  await writeAuditLog({
    action:      AUDIT_ACTIONS.DEAL_CLOSED,
    entity_type: 'deals',
    entity_id:   dealId,
    new_data:    { closing_date: closingDate, commission_auto_generated: !!commission },
    user_id:     userId,
  })

  return { deal_id: dealId, closing_date: closingDate, commission_generated: !!commission }
}

// =============================================================================
// TX: CANCEL DEAL WITH OPTIONAL REFUND AND PENALTY
// =============================================================================

export async function tx_cancelDealWithRefund(
  dealId: string,
  reason: string,
  userId: string,
  options: {
    penaltyAmount?: number
    penaltyReason?: string
    refunds?: Array<{
      payment_id: string
      amount: number
      refund_method: 'cash' | 'bank_transfer' | 'check'
    }>
  } = {}
): Promise<TxCancelDealResult> {
  const supabase = await createServerSupabaseClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('id, status, lead_id, agent_id, agreed_price')
    .eq('id', dealId)
    .single()

  if (!deal) throw new Error('Deal not found')
  if (['closed', 'cancelled'].includes(deal.status)) {
    throw new Error(`Deal is already ${deal.status}`)
  }

  const machine = new DealStateMachine(deal.status)
  const check = machine.validate('cancelled')
  if (!check.ok) throw new Error(check.error)

  // --- Cancel pending/overdue payments ---
  const { data: cancelled } = await supabase
    .from('deal_payments')
    .update({ status: 'cancelled' })
    .eq('deal_id', dealId)
    .in('status', ['pending', 'overdue'])
    .select('id')

  const paymentsCancelled = cancelled?.length ?? 0

  // --- Process refunds for paid payments ---
  if (options.refunds?.length) {
    for (const refund of options.refunds) {
      const { error: refundErr } = await supabase
        .from('payment_refunds')
        .insert({
          original_payment_id: refund.payment_id,
          deal_id:             dealId,
          amount:              refund.amount,
          reason,
          processed_by:        userId,
          refund_method:       refund.refund_method,
        })

      if (refundErr) {
        // Non-blocking — log but continue
        await writeAuditLog({
          action: 'deal.refund_failed',
          entity_type: 'payment_refunds',
          new_data: { error: refundErr.message, payment_id: refund.payment_id },
          user_id: userId,
        })
      }
    }

    // Update deal total_refunded
    const totalRefunded = options.refunds.reduce((s, r) => s + r.amount, 0)
    await supabase
      .from('deals')
      .update({ total_refunded: totalRefunded })
      .eq('id', dealId)
  }

  // --- Apply penalty if requested ---
  let penaltyApplied = false
  let penaltyAmount = 0
  if (options.penaltyAmount && options.penaltyAmount > 0) {
    const pct = deal.agreed_price > 0
      ? Math.round((options.penaltyAmount / deal.agreed_price) * 100 * 100) / 100
      : 0

    const { error: penaltyErr } = await supabase
      .from('cancellation_penalties')
      .insert({
        deal_id:       dealId,
        amount:        options.penaltyAmount,
        pct_of_deal:   pct,
        reason:        options.penaltyReason ?? reason,
        applied_by:    userId,
      })

    if (!penaltyErr) {
      penaltyApplied = true
      penaltyAmount = options.penaltyAmount
      await supabase
        .from('deals')
        .update({ penalty_applied: true })
        .eq('id', dealId)
    }
  }

  // --- Cancel the deal ---
  const { error: cancelErr } = await supabase
    .from('deals')
    .update({
      status:              'cancelled',
      cancellation_reason: reason,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', dealId)

  if (cancelErr) throw new Error(`Failed to cancel deal: ${cancelErr.message}`)

  // --- Log status history ---
  await supabase.from('deal_status_history').insert({
    deal_id:     dealId,
    from_status: deal.status,
    to_status:   'cancelled',
    changed_by:  userId,
    notes:       reason,
  })

  // --- Restore lead ---
  let leadRestored = false
  if (deal.lead_id) {
    const { error } = await supabase
      .from('leads')
      .update({ status: 'lost', lost_reason: `Deal cancelled: ${reason}`, last_activity: new Date().toISOString() })
      .eq('id', deal.lead_id)
      .eq('status', 'converted')

    leadRestored = !error
  }

  await writeAuditLog({
    action:      AUDIT_ACTIONS.DEAL_CANCELLED,
    entity_type: 'deals',
    entity_id:   dealId,
    new_data:    { reason, payments_cancelled: paymentsCancelled, penalty_applied: penaltyApplied, penalty_amount: penaltyAmount },
    user_id:     userId,
  })

  return {
    deal_id:            dealId,
    payments_cancelled: paymentsCancelled,
    lead_restored:      leadRestored,
    penalty_applied:    penaltyApplied,
    penalty_amount:     penaltyAmount,
  }
}

// =============================================================================
// TX: PROCESS REFUND (standalone — after cancellation)
// =============================================================================

export async function tx_processRefund(
  input: TxRefundInput,
  userId: string
): Promise<{ refund_id: string; amount: number }> {
  const supabase = await createServerSupabaseClient()

  // Verify original payment exists and is paid
  const { data: payment } = await supabase
    .from('deal_payments')
    .select('id, deal_id, amount, status')
    .eq('id', input.payment_id)
    .single()

  if (!payment) throw new Error('Original payment not found')
  if (payment.status !== 'paid') throw new Error('Can only refund paid payments')

  // Check existing refunds (DB trigger also validates)
  const { data: existingRefunds } = await supabase
    .from('payment_refunds')
    .select('amount')
    .eq('original_payment_id', input.payment_id)

  const alreadyRefunded = (existingRefunds ?? []).reduce((s, r) => s + r.amount, 0)
  if (alreadyRefunded + input.amount > payment.amount) {
    throw new Error(
      `Refund of ${input.amount} exceeds refundable balance ${payment.amount - alreadyRefunded}`
    )
  }

  const { data: refund, error } = await supabase
    .from('payment_refunds')
    .insert({
      original_payment_id: input.payment_id,
      deal_id:             payment.deal_id,
      amount:              input.amount,
      reason:              input.reason,
      processed_by:        userId,
      refund_method:       input.refund_method,
      reference_no:        input.reference_no ?? null,
      notes:               input.notes ?? null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('OVER_REFUND_BLOCKED')) {
      throw new Error('Over-refund blocked by database')
    }
    throw new Error(`Failed to process refund: ${error.message}`)
  }

  await writeAuditLog({
    action:      'payment.refunded',
    entity_type: 'payment_refunds',
    entity_id:   refund.id,
    new_data:    { amount: input.amount, reason: input.reason },
    user_id:     userId,
  })

  return { refund_id: refund.id, amount: input.amount }
}

// =============================================================================
// TX: TRANSITION DEAL STATUS (generic — for activate/negotiate/back-to-active)
// =============================================================================

export async function tx_transitionStatus(
  dealId: string,
  newStatus: string,
  userId: string,
  opts: { notes?: string; contract_date?: string; reason?: string } = {}
): Promise<{ from: string; to: string }> {
  const supabase = await createServerSupabaseClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('id, status')
    .eq('id', dealId)
    .single()

  if (!deal) throw new Error('Deal not found')

  const machine = new DealStateMachine(deal.status)
  const check = machine.validate(newStatus as any)
  if (!check.ok) throw new Error(check.error)

  const payload: Record<string, unknown> = {
    status:     newStatus,
    updated_at: new Date().toISOString(),
  }

  if (opts.notes)         payload.notes         = opts.notes
  if (opts.contract_date) payload.contract_date  = opts.contract_date
  if (opts.reason)        payload.cancellation_reason = opts.reason

  const { error } = await supabase.from('deals').update(payload).eq('id', dealId)
  if (error) {
    const msg = error.message
    if (msg.includes('STATE_LOCKED'))       throw new Error('Deal is locked')
    if (msg.includes('INVALID_TRANSITION')) throw new Error(msg.split('INVALID_TRANSITION: ')[1] ?? msg)
    throw new Error(`Transition failed: ${msg}`)
  }

  await supabase.from('deal_status_history').insert({
    deal_id:     dealId,
    from_status: deal.status,
    to_status:   newStatus,
    changed_by:  userId,
    notes:       opts.notes ?? opts.reason ?? null,
  })

  return { from: deal.status, to: newStatus }
}
