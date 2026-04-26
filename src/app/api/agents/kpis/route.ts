// src/app/api/agents/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { getAgentKPIs } from '@/services/agentService'

export const runtime = 'edge'

// GET /api/agents/kpis?view=rankings&limit=10
// GET /api/agents/kpis?view=snapshot&agentId=<uuid>
// GET /api/agents/kpis?view=bonuses
export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('agent.score.view.own')

    const { searchParams } = new URL(req.url)
    const view  = searchParams.get('view') ?? 'rankings'
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100)

    if (view === 'rankings') {
      await perms.enforce('agent.score.view.all')
      const rankings = await getAgentKPIs()
      return NextResponse.json({ rankings })
    }

    if (view === 'snapshot') {
      const agentId = searchParams.get('agentId') ?? (ctx.role === 'agent' ? ctx.actorId : null)
      if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 422 })

      if (ctx.role === 'agent' && agentId !== ctx.actorId) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }

      const snap = await getAgentKPIs()
      return NextResponse.json(snap.find(s => s.agentId === agentId))
    }

    if (view === 'bonuses') {
      await perms.enforce('agent.score.view.all')
      const agentId = searchParams.get('agentId') ?? null
      if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 422 })
      // TODO: Implement getBonusTiers
      return NextResponse.json([])
    }

    if (view === 'commission_splits') {
      await perms.enforce('commission.read.all')
      const dealId = searchParams.get('dealId') ?? null
      if (!dealId) return NextResponse.json({ error: 'dealId required for splits view' }, { status: 422 })
      // TODO: Implement getCommissionSplits
      return NextResponse.json([])
    }

    return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 422 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}

function errRes(e: unknown): NextResponse {
  const msg    = e instanceof Error ? e.message : String(e)
  const status = msg.includes('PERMISSION_DENIED') ? 403 : msg.includes('Unauthorized') ? 401 : 500
  return NextResponse.json({ error: msg }, { status })
}
