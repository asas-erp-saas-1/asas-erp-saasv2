// src/app/api/payments/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

// GET /api/payments?dealId=&status=overdue&page=1
export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const { searchParams } = new URL(req.url)
    const dealId = searchParams.get('dealId') ?? ''
    const status = searchParams.get('status') ?? ''
    const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit  = Math.min(Number(searchParams.get('limit') ?? '50'), 200)

    let query = db
      .from('deal_payments')
      .select(`
        id, deal_id, amount, due_date, paid_date, status, payment_method, reference_no, notes, created_at,
        deals!inner ( id, agency_id, agent_id, agreed_price,
          clients ( full_name, phone ),
          profiles ( full_name )
        )
      `, { count: 'exact' })
      .eq('deals.agency_id', actor.agencyId)
      .order('due_date', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    // Agents only see their own deals' payments
    if (actor.role === 'agent') query = query.eq('deals.agent_id', actor.id)
    if (dealId) query = query.eq('deal_id', dealId)
    if (status) query = query.eq('status', status)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return ok({ data: data ?? [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / limit) })
  } catch (e) { return fail(e) }
}

// POST /api/payments — add payment to deal
export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    requireRole(actor, 'admin', 'manager')

    const body = await req.json()
    const { dealId, amount, dueDate, notes } = body

    if (!dealId || !amount || !dueDate) {
      return fail(new Error('VALIDATION: dealId, amount, dueDate required'))
    }
    if (Number(amount) <= 0) return fail(new Error('VALIDATION: amount must be > 0'))

    // Verify deal belongs to agency
    const { data: deal } = await db.from('deals').select('id, status, agency_id').eq('id', dealId).eq('agency_id', actor.agencyId).maybeSingle()
    if (!deal) return fail(new Error('DEAL_NOT_FOUND'))
    if (['closed', 'cancelled'].includes((deal as any).status)) {
      return fail(new Error('INVALID_STATE: Cannot add payment to closed/cancelled deal'))
    }

    const { data, error } = await db.from('deal_payments').insert({
      deal_id:   dealId,
      amount:    Number(amount),
      due_date:  dueDate,
      status:    'pending',
      notes:     notes ?? null,
      created_by: actor.id,
    }).select().single()

    if (error) {
      if (error.message.includes('OVERPAYMENT_BLOCKED')) {
        return fail(new Error(error.message))
      }
      throw new Error(error.message)
    }

    return ok(data)
  } catch (e) { return fail(e) }
}

// PATCH /api/payments — mark payment paid
export async function PATCH(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    requireRole(actor, 'admin', 'manager')

    const body = await req.json()
    const { id, paidDate, paymentMethod, referenceNo } = body
    if (!id) return fail(new Error('VALIDATION: id required'))

    // Verify payment belongs to agency
    const { data: payment } = await db
      .from('deal_payments')
      .select('id, status, deals!inner(agency_id)')
      .eq('id', id)
      .eq('deals.agency_id', actor.agencyId)
      .maybeSingle()

    if (!payment) return fail(new Error('PAYMENT_NOT_FOUND'))
    if ((payment as any).status === 'paid') return fail(new Error('ALREADY_PAID'))
    if ((payment as any).status === 'cancelled') return fail(new Error('CANCELLED_PAYMENT'))

    const { data, error } = await db.from('deal_payments').update({
      status:         'paid',
      paid_date:      paidDate ?? new Date().toISOString().split('T')[0],
      payment_method: paymentMethod ?? null,
      reference_no:   referenceNo ?? null,
      updated_at:     new Date().toISOString(),
    }).eq('id', id).select().single()

    if (error) throw new Error(error.message)

    // Log to financial audit
    await db.from('financial_audit').insert({
      agency_id:   actor.agencyId,
      actor_id:    actor.id,
      action:      'payment_marked_paid',
      entity_type: 'deal_payments',
      entity_id:   id,
      amount:      (data as any).amount,
      before_state: { status: 'pending' },
      after_state:  { status: 'paid', paid_date: (data as any).paid_date },
    })

    return ok(data)
  } catch (e) { return fail(e) }
}
