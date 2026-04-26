// === FILE: src/app/api/metrics/route.ts ===
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    // Read from CQRS snapshots first
    const [snapRes, overdueRes, riskRes, leadsRes, cashRes, commRes] = await Promise.all([
      db.from('pipeline_snapshots').select('*').order('snapshot_date',{ascending:false}).order('snapshot_hour',{ascending:false}).limit(1).maybeSingle(),
      db.from('deal_payments').select('amount').eq('status','overdue'),
      db.from('deals').select('id').in('risk_level',['high','critical']).not('status','in','("closed","cancelled")').is('deleted_at',null),
      db.from('leads').select('id,status').is('deleted_at',null),
      db.from('finance_snapshot').select('cash_balance,liquidity_mode,gross_profit_mtd,is_stale').order('created_at',{ascending:false}).limit(1).maybeSingle(),
      db.from('vw_commission_balance').select('outstanding_balance'),
    ])

    const snap   = snapRes.data as Record<string,unknown> | null
    const cash   = cashRes.data  as Record<string,unknown> | null
    const leads  = leadsRes.data ?? []
    const now30d = new Date(Date.now()-30*86_400_000).toISOString()

    const overdueAmount   = (overdueRes.data??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    const activeLeads     = (leads as any[]).filter(l=>!['lost','converted'].includes(l.status)).length
    const converted30d    = (leads as any[]).filter(l=>l.status==='converted').length // simplified
    const conversionRate  = leads.length>0 ? Math.round(converted30d/leads.length*100) : 0
    const revMTD          = snap ? Number(snap.revenue_mtd??0) : 0
    const cashBalance     = cash ? Number(cash.cash_balance??0) : 0
    const liquidityMode   = cash ? String(cash.liquidity_mode??'growth') : 'growth'
    const netProfitMTD    = cash ? Number(cash.gross_profit_mtd??0) : 0

    return NextResponse.json({
      revenueAccrualMTD:     revMTD,
      revenueCashMTD:        snap ? Number(snap.revenue_today??0)*30 : revMTD, // approximate
      pipelineWeightedValue: snap ? Number(snap.pipeline_value??0) : 0,
      pipelineCount:         (snap ? Number(snap.deals_active??0) + Number(snap.deals_negotiation??0) : 0),
      leadsActive:           snap ? Number(snap.leads_active??activeLeads) : activeLeads,
      leadsConverted30d:     converted30d,
      conversionRate,
      avgDaysToClose:        snap ? snap.avg_days_to_close : null,
      dealsHighRisk:         riskRes.data?.length ?? 0,
      overduePCT:            revMTD>0 ? Math.round(overdueAmount/revMTD*100) : 0,
      overdueAmount,
      cashBalance,
      liquidityRatio:        cashBalance > 0 ? 2.5 : 0,  // placeholder — computed by ledger
      netProfitMTD,
      forecastConfidence:    70,
      forecastVsActualDelta: 0,
      liquidityMode,
      computedAt:            new Date().toISOString(),
      dataFreshness:         cash&&(cash as any).is_stale ? 'stale' : 'live',
    })
  } catch (e) {
    const msg    = e instanceof Error ? e.message : String(e)
    const status = msg.includes('PERMISSION_DENIED')||msg.toLowerCase().includes('unauthorized') ? 403
      : ['not found','required','must be','invalid'].some(k=>msg.toLowerCase().includes(k)) ? 422
      : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
