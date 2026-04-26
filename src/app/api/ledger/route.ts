// src/app/api/ledger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { createFinanceLedger } from '@/services/financeLedger'

export const runtime = 'edge'

// GET /api/ledger?view=cash_position
// GET /api/ledger?view=aging
// GET /api/ledger?view=deal_pnl&dealId=<uuid>
// GET /api/ledger?view=company_profit&from=2025-01-01&to=2025-01-31
// GET /api/ledger?view=cash_flow&from=2025-01-01&to=2025-01-31
// GET /api/ledger?view=agent_commission&agentId=<uuid>
// GET /api/ledger?view=anomalies
// GET /api/ledger?view=fraud_signals
export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('finance.read')

    const { searchParams } = new URL(req.url)
    const view   = searchParams.get('view') ?? 'cash_position'
    const ledger = createFinanceLedger(db)

    switch (view) {
      case 'cash_position': {
        const pos = await ledger.getCashPosition()
        return NextResponse.json(pos)
      }

      case 'aging': {
        const aging = await ledger.getReceivablesAging()
        return NextResponse.json(aging)
      }

      case 'deal_pnl': {
        const dealId = searchParams.get('dealId')
        if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 422 })

        // Agents can only see their own deals' P&L
        if (ctx.role === 'agent') {
          const { data } = await db.from('deals').select('agent_id').eq('id', dealId).maybeSingle()
          if ((data as { agent_id?: string } | null)?.agent_id !== ctx.actorId) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
          }
        }

        const pnl = await ledger.getDealPnL(dealId)
        return NextResponse.json(pnl)
      }

      case 'company_profit': {
        await perms.enforce('finance.read')
        const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]!
        const to   = searchParams.get('to')   ?? new Date().toISOString().split('T')[0]!
        const profit = await ledger.getCompanyProfit(from, to)
        return NextResponse.json(profit)
      }

      case 'cash_flow': {
        const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]!
        const to   = searchParams.get('to')   ?? new Date().toISOString().split('T')[0]!
        const flow = await ledger.getCashFlow(from, to)
        return NextResponse.json(flow)
      }

      case 'agent_commission': {
        const agentId = searchParams.get('agentId') ?? (ctx.role === 'agent' ? ctx.actorId : null)
        if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 422 })

        // Agents can only see their own commissions
        if (ctx.role === 'agent' && agentId !== ctx.actorId) {
          return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }

        const comm = await ledger.getAgentCommission(agentId)
        return NextResponse.json(comm)
      }

      default:
        return NextResponse.json({
          error: `Unknown view: ${view}`,
          validViews: ['cash_position','aging','deal_pnl','company_profit','cash_flow','agent_commission'],
        }, { status: 422 })
    }
  } catch (e) {
    return errRes(e)
  }
}

function errRes(e: unknown): NextResponse {
  const msg    = e instanceof Error ? e.message : String(e)
  const status = msg.includes('PERMISSION_DENIED') ? 403
    : msg.includes('Unauthorized') ? 401
    : msg.includes('JOURNAL_IMBALANCED') ? 422
    : msg.includes('IMMUTABLE') ? 409
    : 500
  return NextResponse.json({ error: msg }, { status })
}
