// === FILE: src/app/api/metrics/signals/route.ts ===
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    const [snap, cash, risk] = await Promise.all([
      db.from('pipeline_snapshots').select('pipeline_value,deals_active,conversion_rate_pct').order('snapshot_date',{ascending:false}).limit(1).maybeSingle(),
      db.from('finance_snapshot').select('cash_balance,liquidity_mode').order('created_at',{ascending:false}).limit(1).maybeSingle(),
      db.from('deals').select('id').in('risk_level',['high','critical']).not('status','in','("closed","cancelled")').is('deleted_at',null),
    ])

    const signals: string[] = []
    const cashMode = (cash.data as any)?.liquidity_mode ?? 'growth'
    const convRate = Number((snap.data as any)?.conversion_rate_pct ?? 0)
    const riskCount = risk.data?.length ?? 0

    if (cashMode === 'survival') { signals.push('slowAcquisition'); signals.push('focusCollection') }
    else if (cashMode === 'caution') signals.push('focusCollection')
    else if (convRate < 15) signals.push('reducePricing')
    else signals.push('expandMarket')

    if (riskCount > 5) signals.push('retainAgents')

    return NextResponse.json([...new Set(signals)])
  } catch (e) {
    const msg    = e instanceof Error ? e.message : String(e)
    const status = msg.includes('PERMISSION_DENIED')||msg.toLowerCase().includes('unauthorized') ? 403
      : ['not found','required','must be','invalid'].some(k=>msg.toLowerCase().includes(k)) ? 422
      : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
