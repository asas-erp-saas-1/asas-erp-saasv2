// src/app/api/leads/[id]/convert/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { enforcePlanLimit } from '@/lib/planEnforcement'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)

    await enforcePlanLimit(db, actor.agencyId, 'deals_mtd')

    const body = await req.json()
    const { propertyId, agreedPrice, dealType = 'sale' } = body

    if (!propertyId || !agreedPrice) {
      return fail(new Error('VALIDATION: propertyId and agreedPrice are required'))
    }
    if (Number(agreedPrice) <= 0) {
      return fail(new Error('VALIDATION: agreedPrice must be > 0'))
    }

    // Fetch lead
    const { data: lead, error: leadErr } = await db
      .from('leads')
      .select('id, client_id, assigned_agent, status, agency_id')
      .eq('id', id)
      .eq('agency_id', actor.agencyId)
      .is('deleted_at', null)
      .single()

    if (leadErr || !lead) return fail(new Error('LEAD_NOT_FOUND'))

    const l = lead as any
    if (l.status === 'converted') return fail(new Error('ALREADY_CONVERTED: Lead is already a deal'))
    if (l.status === 'lost')      return fail(new Error('LEAD_LOST: Cannot convert a lost lead'))

    // Verify property is available
    const { data: prop } = await db
      .from('properties')
      .select('id, status')
      .eq('id', propertyId)
      .eq('agency_id', actor.agencyId)
      .maybeSingle()

    if (!prop) return fail(new Error('PROPERTY_NOT_FOUND'))
    if ((prop as any).status === 'sold') return fail(new Error('PROPERTY_SOLD'))

    // Create deal
    const { data: deal, error: dealErr } = await db
      .from('deals')
      .insert({
        agency_id:   actor.agencyId,
        lead_id:     id,
        client_id:   l.client_id,
        property_id: propertyId,
        agent_id:    l.assigned_agent ?? actor.id,
        deal_type:   dealType,
        status:      'draft',
        agreed_price: Number(agreedPrice),
      })
      .select()
      .single()

    if (dealErr) return fail(new Error(dealErr.message))

    // Mark lead as converted
    await db.from('leads')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', id)

    return ok({ deal, leadId: id })
  } catch (e) { return fail(e) }
}
