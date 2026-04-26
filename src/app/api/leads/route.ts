// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { getLeads, createLead } from '@/services/leadService'
import { createEventBus } from '@/core/eventBus'
import type { LeadFilters } from '@/types/app'

export const runtime = 'edge'

// GET /api/leads?status=new&status=contacted&agentId=&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('lead.read.own')

    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit  = Math.min(Number(searchParams.get('limit') ?? '20'), 100)
    const statuses = searchParams.getAll('status')

    const filters: LeadFilters = {
      status:         statuses.length === 1 ? statuses[0] as LeadFilters['status'] : undefined,
      assignedAgent:  ctx.role === 'agent' ? ctx.actorId : (searchParams.get('agentId') ?? undefined),
      source:         searchParams.get('source') ?? undefined,
      dateFrom:       searchParams.get('dateFrom') ?? undefined,
      dateTo:         searchParams.get('dateTo')   ?? undefined,
    }

    const { data: result } = await getLeads(filters)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}

// POST /api/leads — create lead
export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('lead.create')

    const body = await req.json()
    const { clientId, assignedAgent, projectId, source, budgetMin, budgetMax, notes } = body

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 422 })
    }

    const lead = await createLead({
      client_id: clientId,
      assigned_agent: assignedAgent ?? (ctx.role === 'agent' ? ctx.actorId : undefined),
      project_id:     projectId  ?? undefined,
      source:        source     ?? undefined,
      budget_min:     budgetMin  ? Number(budgetMin)  : undefined,
      budget_max:     budgetMax  ? Number(budgetMax)  : undefined,
      notes:         notes      ?? undefined,
    }, ctx.actorId)

    return NextResponse.json(lead, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
