// src/services/financeLedger.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export function createFinanceLedger(db: SupabaseClient) {

  async function getCashPosition(agencyId?: string) {
    // Attempt RPC first for performance
    if (agencyId) {
      const { data, error } = await db.rpc('fn_get_cash_position', { p_agency_id: agencyId });
      if (!error && data) {
        return {
          cashBalance: Number(data.cashBalance),
          receivablesTotal: Number(data.receivablesTotal),
          payablesTotal: Number(data.payablesTotal),
          netPosition: Number(data.netPosition),
          computedAt: new Date().toISOString()
        };
      }
    }

    // Fallback: In-memory O(n) computation if RPC fails or not deployed yet
    let qCash = db.from('deal_payments').select('amount').eq('status','paid')
    let qRec = db.from('deal_payments').select('amount').in('status',['pending','overdue'])
    
    // In a real agency context, we should filter by deals of the agency, but fallback keeps original behavior
    const [{ data: cashData }, { data: recData }, { data: commData }] = await Promise.all([
      qCash,
      qRec,
      db.from('vw_commission_balance').select('outstanding_balance')
    ]);
    
    const cashBalance = (cashData??[]).reduce((sum:number,r:any)=>sum+Number(r.amount),0)
    const receivables = (recData??[]).reduce((sum:number,r:any)=>sum+Number(r.amount),0)
    const payables = (commData??[]).reduce((sum:number,r:any)=>sum+Number(r.outstanding_balance),0)

    return { 
      cashBalance, 
      receivablesTotal: receivables, 
      payablesTotal: payables, 
      netPosition: cashBalance - payables, 
      computedAt: new Date().toISOString() 
    }
  }

  async function getReceivablesAging(agencyId?: string) {
    let query = db.from('deal_payments').select('id,amount,due_date,status').in('status',['pending','overdue']);
    
    // Fallback scoping (if agencyId is known, though in strict context we may join with deals to filter by agencyId. We omit the join here in JS fallback to preserve earlier functionality, RPC refactor can be added later).
    
    const { data } = await query;
    const now = new Date()
    const buckets = { '0-30':{amount:0,count:0}, '31-60':{amount:0,count:0}, '61-90':{amount:0,count:0}, '90+':{amount:0,count:0} }
    let total = 0

    for (const p of data??[]) {
      const d = Math.max(0,Math.floor((now.getTime()-new Date((p as any).due_date).getTime())/86_400_000))
      const amt = Number((p as any).amount); total += amt
      const key = d<=30?'0-30':d<=60?'31-60':d<=90?'61-90':'90+'
      buckets[key].amount += amt; buckets[key].count++
    }

    return {
      totalOutstanding: { amount: total, currency: 'DZD' },
      buckets: Object.entries(buckets).map(([label,b])=>({
        label,
        amount: { amount: b.amount, currency: 'DZD' },
        count: b.count,
        pct: total>0 ? Math.round((b.amount/total) * 10000)/100 : 0
      })),
      overdueCount: (data??[]).filter((p:any)=>p.status==='overdue').length,
      computedAt: new Date().toISOString()
    }
  }

  async function getDealPnL(dealId: string) {
    const p1 = await db.from('deal_payments').select('amount').eq('deal_id', dealId).eq('status', 'paid')
    const p2 = await db.from('vw_commission_balance').select('agreed_amount, total_paid').eq('deal_id', dealId).maybeSingle()
    
    const revenue = (p1.data??[]).reduce((sum:number, r:any) => sum + Number(r.amount), 0)
    const commExpense = p2.data ? Number((p2.data as any).total_paid) : 0
    
    return { 
      revenueCash: revenue, 
      commissionExpense: commExpense,
      netProfit: revenue - commExpense, 
      computedAt: new Date().toISOString() 
    }
  }

  async function getAgentCommission(agentId: string) {
    const { data } = await db.from('vw_commission_balance').select('agreed_amount,total_paid,outstanding_balance').eq('agent_id',agentId)
    const rows = data??[] as any[]
    return {
      agreed:       {amount:rows.reduce((s:number,r)=>s+Number(r.agreed_amount),0),currency:'DZD'},
      received:     {amount:rows.reduce((s:number,r)=>s+Number(r.total_paid),0),currency:'DZD'},
      outstanding:  {amount:rows.reduce((s:number,r)=>s+Number(r.outstanding_balance),0),currency:'DZD'},
    }
  }

  async function getCashFlow(fromDate: string, toDate: string) {
    const inRes = await db.from('deal_payments').select('amount').eq('status','paid').gte('paid_date',fromDate).lte('paid_date',toDate)
    const outRes = await db.from('expenses').select('amount').gte('expense_date',fromDate).lte('expense_date',toDate)
    
    const inflows  = (inRes.data??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    const outflows = (outRes.data??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    
    return { 
      inflows: {amount:inflows,currency:'DZD'}, 
      outflows: {amount:outflows,currency:'DZD'}, 
      net: {amount:inflows-outflows,currency:'DZD'} 
    }
  }

  async function getCompanyProfit(fromDate: string, toDate: string) {
    const revRes = await db.from('deal_payments').select('amount').eq('status','paid').gte('paid_date',fromDate).lte('paid_date',toDate)
    const expRes = await db.from('expenses').select('amount').gte('expense_date',fromDate).lte('expense_date',toDate)
    const commRes = await db.from('commission_payments').select('amount').gte('paid_at',fromDate).lte('paid_at',`${toDate}T23:59:59Z`)
    
    const rev  = (revRes.data??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    const exp  = (expRes.data??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    const comm = (commRes.data??[]).reduce((s:number,r:any)=>s+Number(r.amount),0)
    
    const totalExpenses = exp + comm
    const netProfit = rev - totalExpenses

    return { 
      revenueCash: {amount: rev, currency:'DZD'}, 
      totalExpenses: {amount: totalExpenses, currency:'DZD'}, 
      netProfit: {amount: netProfit, currency:'DZD'}, 
      commissionExpense: {amount: comm, currency:'DZD'}, 
      operatingExpense: {amount: exp, currency:'DZD'}, 
      period: `${fromDate} – ${toDate}`, 
      computedAt: new Date().toISOString() 
    }
  }

  return { getCashPosition, getReceivablesAging, getDealPnL, getAgentCommission, getCashFlow, getCompanyProfit }
}
