// src/app/api/commissions/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const { searchParams } = new URL(req.url)
    const view    = searchParams.get('view') ?? 'balance'
    const agentId = searchParams.get('agentId') ?? (actor.role === 'agent' ? actor.id : null)

    if (view === 'balance') {
      let query = db.from('vw_commission_balance').select('*').eq('agency_id', actor.agencyId)
      if (actor.role === 'agent') query = query.eq('agent_id', actor.id)
      else if (agentId)           query = query.eq('agent_id', agentId)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return ok(data ?? [])
    }

    if (view === 'payments') {
      requireRole(actor, 'admin', 'manager')
      const { data, error } = await db
        .from('commission_payments')
        .select('*, profiles!agent_id(full_name), commission_agreements(deal_id)')
        .eq('agency_id', actor.agencyId)
        .order('payment_date', { ascending: false })
        .limit(100)
      if (error) throw new Error(error.message)
      return ok(data ?? [])
    }

    return fail(new Error('VALIDATION: view must be balance | payments'))
  } catch (e) { return fail(e) }
}

// POST /api/commissions — set agreed amount or record payment
export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    requireRole(actor, 'admin', 'manager')

    const body   = await req.json()
    const action = body.action ?? 'set_amount'

    if (action === 'set_amount') {
      const { dealId, agentId, agreedAmount, notes } = body
      if (!dealId || !agentId || agreedAmount === undefined) {
        return fail(new Error('VALIDATION: dealId, agentId, agreedAmount required'))
      }

      // Verify deal belongs to agency
      const { data: deal } = await db.from('deals').select('id').eq('id', dealId).eq('agency_id', actor.agencyId).maybeSingle()
      if (!deal) return fail(new Error('DEAL_NOT_FOUND'))

      const { data, error } = await db.from('commission_agreements')
        .upsert({
          agency_id:     actor.agencyId,
          deal_id:       dealId,
          agent_id:      agentId,
          agreed_amount: Number(agreedAmount),
          notes:         notes ?? null,
        }, { onConflict: 'deal_id' })
        .select().single()

      if (error) throw new Error(error.message)
      return ok(data)
    }

    if (action === 'approve') {
      const { agreementId } = body
      if (!agreementId) return fail(new Error('VALIDATION: agreementId required'))

      const { data, error } = await db.from('commission_agreements')
        .update({ approved_by: actor.id, approved_at: new Date().toISOString() })
        .eq('id', agreementId)
        .eq('agency_id', actor.agencyId)
        .select().single()

      if (error) throw new Error(error.message)
      return ok(data)
    }

    if (action === 'record_payment') {
      const { agreementId, amountPaid, paymentDate, paymentMethod, referenceNo, notes } = body
      if (!agreementId || !amountPaid) return fail(new Error('VALIDATION: agreementId and amountPaid required'))

      // Verify agreement belongs to agency
      const { data: agreement } = await db.from('commission_agreements')
        .select('id, agreed_amount, agent_id')
        .eq('id', agreementId)
        .eq('agency_id', actor.agencyId)
        .maybeSingle()

      if (!agreement) return fail(new Error('AGREEMENT_NOT_FOUND'))

      const { data, error } = await db.from('commission_payments').insert({
        agency_id:               actor.agencyId,
        commission_agreement_id: agreementId,
        agent_id:                (agreement as any).agent_id,
        amount_paid:             Number(amountPaid),
        payment_date:            paymentDate ?? new Date().toISOString().split('T')[0],
        payment_method:          paymentMethod ?? null,
        reference_no:            referenceNo ?? null,
        created_by:              actor.id,
        notes:                   notes ?? null,
      }).select().single()

      if (error) throw new Error(error.message)

      // Financial audit
      await db.from('financial_audit').insert({
        agency_id:   actor.agencyId,
        actor_id:    actor.id,
        action:      'commission_payment_recorded',
        entity_type: 'commission_agreements',
        entity_id:   agreementId,
        amount:      Number(amountPaid),
        before_state: {},
        after_state:  { amount_paid: amountPaid, payment_date: paymentDate },
      })

      return ok(data)
    }

    return fail(new Error(`VALIDATION: Unknown action: ${action}`))
  } catch (e) { return fail(e) }
}
