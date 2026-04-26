// src/app/api/billing/checkout/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    requireRole(actor, 'admin')

    const { priceId } = await req.json()
    if (!priceId) return fail(new Error('VALIDATION: priceId required'))

    // Get or create Stripe customer
    const { data: agency } = await db
      .from('agencies')
      .select('stripe_customer_id, name, billing_email')
      .eq('id', actor.agencyId)
      .single()

    if (!agency) return fail(new Error('AGENCY_NOT_FOUND'))
    const a = agency as any

    let customerId: string = a.stripe_customer_id

    if (!customerId) {
      const res = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: a.billing_email ?? actor.email,
          name:  a.name,
          'metadata[agency_id]': actor.agencyId,
        }).toString(),
      })
      const customer = await res.json() as any
      customerId = customer.id
      await db.from('agencies').update({ stripe_customer_id: customerId }).eq('id', actor.agencyId)
    }

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer:               customerId,
        mode:                   'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url:            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?upgraded=true`,
        cancel_url:             `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        'metadata[agency_id]':  actor.agencyId,
        allow_promotion_codes:  'true',
      }).toString(),
    })

    const session = await sessionRes.json() as any
    if (!session.url) return fail(new Error('STRIPE_ERROR: Could not create checkout session'))

    return ok({ url: session.url })
  } catch (e) { return fail(e) }
}
