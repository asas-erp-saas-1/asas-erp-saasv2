// === FILE: src/app/api/metrics/risk/route.ts ===
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    const { data:riskDeals } = await db.from('vw_deal_pipeline').select('id,client_name,agreed_price,is_high_risk,overdue_payment_count').eq('is_high_risk',true).limit(10)
    const { count:escalated } = await db.from('deal_pressure').select('id',{count:'exact',head:true}).eq('is_escalated',true)
    const { data:overdue }    = await db.from('deal_payments').select('amount').eq('status','overdue')
    const overdueAmt          = (overdue??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    const { count:totalPend } = await db.from('deal_payments').select('id',{count:'exact',head:true}).in('status',['pending','overdue'])

    return NextResponse.json({
      dealsAtRisk:       riskDeals?.length ?? 0,
      totalRiskExposure: (riskDeals??[]).reduce((s:number,r:any)=>s+Number(r.agreed_price),0),
      overduePCT:        totalPend ? Math.round((overdue?.length??0)/totalPend*100) : 0,
      criticalDeals:     0,
      escalatedDeals:    escalated ?? 0,
      topRisks:          (riskDeals??[]).map((d:any)=>({ dealId:d.id, clientName:d.client_name, riskScore:70, amount:Number(d.agreed_price) })),
    })
  } catch (e) {
    const msg    = e instanceof Error ? e.message : String(e)
    const status = msg.includes('PERMISSION_DENIED')||msg.toLowerCase().includes('unauthorized') ? 403
      : ['not found','required','must be','invalid'].some(k=>msg.toLowerCase().includes(k)) ? 422
      : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
