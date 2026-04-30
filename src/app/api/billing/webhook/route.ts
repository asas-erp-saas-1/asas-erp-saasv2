// src/app/api/billing/webhook/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { env } from '@/lib/env'

export const runtime = 'nodejs' // Stripe signature verification requires Node crypto

function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY  ?? '']:  'starter',
  [process.env.STRIPE_PRICE_STARTER_ANNUAL   ?? '']:  'starter',
  [process.env.STRIPE_PRICE_GROWTH_MONTHLY   ?? '']:  'growth',
  [process.env.STRIPE_PRICE_GROWTH_ANNUAL    ?? '']:  'growth',
  [process.env.STRIPE_PRICE_PRO_MONTHLY      ?? '']:  'professional',
  [process.env.STRIPE_PRICE_PRO_ANNUAL       ?? '']:  'professional',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''
  
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing Stripe environment variables')
    return new Response('Stripe not configured', { status: 500 })
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const db = createAdminClient()

  // Idempotency check
  const { data: existing } = await db
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) return new Response('Already processed', { status: 200 })

  const obj      = (event.data?.object as any) ?? {}
  const agencyId = obj.metadata?.agency_id as string | undefined

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        if (!agencyId) break
        const priceId = obj.items?.data?.[0]?.price?.id as string
        const plan    = PLAN_BY_PRICE[priceId] ?? 'starter'
        const { data: planData } = await db.from('plans').select('*').eq('id', plan).single()
        if (!planData) break
        const p = planData as any

        await db.from('agencies').update({
          plan,
          plan_started_at:  new Date().toISOString(),
          plan_expires_at:  new Date(obj.current_period_end * 1000).toISOString(),
          stripe_sub_id:    obj.id,
          is_active:        true,
          is_suspended:     false,
          suspension_reason: null,
          max_agents:       p.max_agents,
          max_deals_mtd:    p.max_deals_mtd,
          max_properties:   p.max_properties,
          max_leads_mtd:    p.max_leads_mtd,
          feature_ai:       p.feature_ai,
          feature_api_access: p.feature_api_access,
          feature_white_label: p.feature_white_label,
          feature_multi_branch: p.feature_multi_branch,
          feature_advanced_reports: p.feature_advanced_reports,
        }).eq('id', agencyId)
        break
      }
      case 'invoice.payment_succeeded': {
        const subId = obj.subscription as string
        const { data: ag } = await db.from('agencies').select('id').eq('stripe_sub_id', subId).maybeSingle()
        if (ag) await db.from('agencies').update({ is_suspended: false, is_active: true, suspension_reason: null }).eq('id', (ag as any).id)
        break
      }
      case 'invoice.payment_failed': {
        const subId = obj.subscription as string
        const { data: ag } = await db.from('agencies').select('id').eq('stripe_sub_id', subId).maybeSingle()
        if (ag) await db.from('agencies').update({ is_suspended: true, suspension_reason: 'payment_failed' }).eq('id', (ag as any).id)
        break
      }
      case 'customer.subscription.deleted': {
        if (!agencyId) break
        await db.from('agencies').update({
          plan: 'trial', is_suspended: true, suspension_reason: 'subscription_cancelled',
          max_agents: 3, max_deals_mtd: 10, max_properties: 50, feature_ai: false,
        }).eq('id', agencyId)
        break
      }
    }

    await db.from('billing_events').insert({
      agency_id:       agencyId ?? '00000000-0000-0000-0000-000000000000',
      event_type:      event.type,
      stripe_event_id: event.id,
      payload:         event,
    })

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[stripe_webhook]', err)
    return new Response('Handler error', { status: 500 })
  }
}
