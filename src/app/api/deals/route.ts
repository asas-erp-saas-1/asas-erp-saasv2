// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { tx_createDealWithPayment } from '@/core/transactionManager'
import type { DealFilters } from '@/types/app'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('deal.read.own')

    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100)
    const offset = (page - 1) * limit

    const statuses = searchParams.getAll('status').filter(Boolean)
    
    const filters: DealFilters = {
      agentId:   ctx.role === 'agent' ? ctx.actorId : (searchParams.get('agentId') ?? undefined),
      riskLevel: (searchParams.get('riskLevel') as DealFilters['riskLevel']) ?? undefined,
      dateFrom:  searchParams.get('dateFrom') ?? undefined,
      dateTo:    searchParams.get('dateTo')   ?? undefined,
    }

    let query = db.from('deals').select(`
      *,
      clients(id, full_name, phone, email),
      properties(id, reference_code, list_price, projects(name, city))
    `, { count: 'exact' })

    if (filters.agentId) {
      query = query.eq('agent_id', filters.agentId)
    }
    if (statuses.length > 0) {
      // Supabase handles array correctly with .in()
      query = query.in('status', statuses)
    }
    if (filters.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    query = query.order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: result, count, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ data: result, count, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('deal.create')

    const body = await req.json()
    const { clientId, propertyId, agentId, dealType, agreedPrice, leadId, notes, initialPayments } = body

    if (!clientId || !propertyId || !agreedPrice) {
      return NextResponse.json({ error: 'clientId, propertyId, and agreedPrice are required' }, { status: 422 })
    }

    const deal = await tx_createDealWithPayment({
      client_id: clientId,
      property_id: propertyId,
      agent_id:    agentId ?? ctx.actorId,
      deal_type:   dealType ?? 'sale',
      agreed_price: Number(agreedPrice),
      lead_id:     leadId ?? undefined,
      notes:      notes  ?? undefined,
      initialPayments
    }, ctx.actorId)

    return NextResponse.json(deal, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
