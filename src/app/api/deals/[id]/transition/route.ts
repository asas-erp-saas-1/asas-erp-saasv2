// src/app/api/deals/[id]/transition/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db     = await createServerSupabaseClient()
    const actor  = await requireAuth(db)
    const body   = await req.json()
    const { status, reason } = body

    const VALID = ['active','negotiation','closed','cancelled']
    if (!status || !VALID.includes(status)) {
      return fail(new Error(`VALIDATION: status must be one of ${VALID.join(', ')}`))
    }

    // Verify deal belongs to agency + actor has access
    const { data: deal, error: fetchErr } = await db
      .from('deals')
      .select('id, status, agent_id, agency_id')
      .eq('id', id)
      .eq('agency_id', actor.agencyId)
      .is('deleted_at', null)
      .single()

    if (fetchErr || !deal) return fail(new Error('DEAL_NOT_FOUND'))

    const d = deal as any
    if (actor.role === 'agent' && d.agent_id !== actor.id) {
      return fail(new Error('PERMISSION_DENIED: Not your deal'))
    }

    // Perform update — DB trigger enforces state machine
    const { data: updated, error: updateErr } = await db
      .from('deals')
      .update({
        status,
        cancellation_reason: status === 'cancelled' ? (reason ?? null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('agency_id', actor.agencyId)
      .select()
      .single()

    if (updateErr) {
      // DB trigger raises meaningful exceptions — pass them through
      return fail(new Error(updateErr.message))
    }

    // Log status history
    await db.from('deal_status_history').insert({
      agency_id:   actor.agencyId,
      deal_id:     id,
      from_status: d.status,
      to_status:   status,
      changed_by:  actor.id,
      notes:       reason ?? null,
    })

    // Financial audit for closes
    if (status === 'closed') {
      await db.from('financial_audit').insert({
        agency_id:   actor.agencyId,
        actor_id:    actor.id,
        action:      'deal.closed',
        entity_type: 'deals',
        entity_id:   id,
        before_state: { status: d.status },
        after_state:  { status: 'closed' },
      })
    }

    return ok(updated)
  } catch (e) { return fail(e) }
}
