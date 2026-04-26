// === FILE: src/app/api/metrics/trend/route.ts ===
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    const { searchParams } = new URL(req.url)
    const metric  = searchParams.get('metric') ?? 'revenue'
    const days    = Number(searchParams.get('days') ?? 30)
    const fromDate = new Date(Date.now()-days*86_400_000).toISOString().split('T')[0]!

    let data: Array<{date:string;value:number}> = []

    if (metric === 'revenue') {
      const { data:rows } = await db.from('deal_payments').select('paid_date,amount').eq('status','paid').gte('paid_date',fromDate).order('paid_date',{ascending:true})
      const byDay = new Map<string,number>()
      for (const r of rows??[]) {
        const d = (r as any).paid_date as string
        byDay.set(d, (byDay.get(d)??0)+Number((r as any).amount))
      }
      data = Array.from(byDay.entries()).map(([date,value])=>({date,value}))
    } else if (metric === 'pipeline') {
      const { data:snaps } = await db.from('pipeline_snapshots').select('snapshot_date,pipeline_value').gte('snapshot_date',fromDate).order('snapshot_date',{ascending:true})
      data = (snaps??[]).map((r:any)=>({date:r.snapshot_date,value:Number(r.pipeline_value)}))
    } else if (metric === 'deals_closed') {
      const { data:snaps } = await db.from('pipeline_snapshots').select('snapshot_date,deals_closed_today').gte('snapshot_date',fromDate).order('snapshot_date',{ascending:true})
      data = (snaps??[]).map((r:any)=>({date:r.snapshot_date,value:Number(r.deals_closed_today)}))
    }

    const vals = data.map(d=>d.value)
    const first = vals[0]??0, last = vals[vals.length-1]??0
    const trend = last>first*1.05?'up':last<first*0.95?'down':'flat'
    const changePct = first>0 ? Math.round((last-first)/first*100) : 0

    return NextResponse.json({ metric, data, trend, changePct, period:`${fromDate}–${new Date().toISOString().split('T')[0]}` })
  } catch (e) {
    const msg    = e instanceof Error ? e.message : String(e)
    const status = msg.includes('PERMISSION_DENIED')||msg.toLowerCase().includes('unauthorized') ? 403
      : ['not found','required','must be','invalid'].some(k=>msg.toLowerCase().includes(k)) ? 422
      : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
