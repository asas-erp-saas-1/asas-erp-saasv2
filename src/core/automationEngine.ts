// src/core/automationEngine.ts
// Intelligent automation — dynamic risk scoring, priority ranking, event hooks

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { computeRisk, generateNextAction, type DealStatus } from './stateMachine'

// =============================================================================
// AUTOMATION ENGINE CLASS (singleton for event hooks)
// =============================================================================

class AutomationEngineClass {

  // ─── Event Hooks (called by DealEngine) ────────────────────────────────────

  async onDealCreated(dealId: string, agentId: string): Promise<void> {
    await this._createTask({
      deal_id:     dealId,
      assigned_to: agentId,
      title:       'New deal created — activate and verify details',
      priority:    'high',
      due_date:    new Date().toISOString().split('T')[0],
    })
  }

  async onDealActivated(dealId: string, agentId: string): Promise<void> {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
    await this._createTask({
      deal_id:     dealId,
      assigned_to: agentId,
      title:       'Deal activated — schedule client meeting',
      priority:    'medium',
      due_date:    tomorrow,
    })
  }

  async onDealClosed(dealId: string): Promise<void> {
    const supabase = createAdminSupabaseClient()
    const { data: deal } = await supabase
      .from('deals')
      .select('agent_id, clients:client_id ( full_name )')
      .eq('id', dealId)
      .single()

    if (!deal) return

    // Find manager
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])
      .eq('is_active', true)
      .limit(1)

    const managerId = managers?.[0]?.id ?? deal.agent_id
    const clientName = (deal as any).clients?.full_name ?? 'Client'

    await this._createTask({
      deal_id:     dealId,
      assigned_to: managerId,
      title:       `Deal closed: ${clientName} — define commission splits`,
      priority:    'high',
      due_date:    new Date().toISOString().split('T')[0],
    })
  }

  async onDealCancelled(dealId: string): Promise<void> {
    const supabase = createAdminSupabaseClient()
    const { data: deal } = await supabase
      .from('deals')
      .select('agent_id, lead_id')
      .eq('id', dealId)
      .single()

    if (!deal) return

    await this._createTask({
      deal_id:     dealId,
      assigned_to: deal.agent_id,
      title:       'Deal cancelled — document reason and recover lead if possible',
      priority:    'medium',
      due_date:    new Date().toISOString().split('T')[0],
    })
  }

  // ─── FULL AUTOMATION SWEEP ─────────────────────────────────────────────────

  async runFullSweep(): Promise<{
    tasksCreated: number
    dealsRiskUpdated: number
    nextActionsRefreshed: number
    errors: string[]
    log: string[]
  }> {
    const result = { tasksCreated: 0, dealsRiskUpdated: 0, nextActionsRefreshed: 0, errors: [] as string[], log: [] as string[] }

    await Promise.allSettled([
      this._sweepInactiveLeads(result),
      this._sweepDealRisk(result),
      this._sweepOverduePayments(result),
      this._sweepMissingNextActions(result),
      this._sweepUnpaidCommissions(result),
    ])

    // Record this sweep
    const supabase = createAdminSupabaseClient()
    await supabase.from('automation_runs').insert({
      run_type:    'full_sweep',
      entity_type: 'system',
      result:      result as any,
    })

    return result
  }

  // ─── 1. INACTIVE LEADS (48h+) ──────────────────────────────────────────────

  private async _sweepInactiveLeads(result: typeof automationEngine extends AutomationEngineClass ? ReturnType<AutomationEngineClass['runFullSweep']> extends Promise<infer R> ? R : never : never) {
    const supabase = createAdminSupabaseClient()
    const cutoff = new Date(Date.now() - 48 * 3_600_000).toISOString()

    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, assigned_agent, last_activity, clients:client_id ( full_name )')
        .in('status', ['new', 'contacted', 'interested', 'visit_scheduled'])
        .is('deleted_at', null)
        .lt('last_activity', cutoff)
        .not('assigned_agent', 'is', null)

      for (const lead of leads ?? []) {
        const hasTask = await this._hasRecentTask({ lead_id: lead.id })
        if (hasTask) continue

        const hours = Math.floor((Date.now() - new Date(lead.last_activity).getTime()) / 3_600_000)
        const name = (lead as any).clients?.full_name ?? 'Client'

        await this._createTask({
          lead_id:     lead.id,
          assigned_to: lead.assigned_agent,
          title:       `Call ${name} — no contact for ${hours}h`,
          description: `Lead inactive for ${hours} hours. Risk of losing client.`,
          priority:    hours > 72 ? 'urgent' : 'high',
          due_date:    new Date().toISOString().split('T')[0],
        })
        ;(result as any).tasksCreated++
      }

      result.log.push(`Leads: ${leads?.length ?? 0} checked, ${(result as any).tasksCreated} tasks`)
    } catch (e) {
      result.errors.push(`Inactive leads: ${String(e)}`)
    }
  }

  // ─── 2. DEAL RISK SCORING ─────────────────────────────────────────────────

  private async _sweepDealRisk(result: any) {
    const supabase = createAdminSupabaseClient()

    try {
      const { data: deals } = await supabase
        .from('deals')
        .select(`
          id, status, risk_level, updated_at, next_action, next_action_due,
          agent_id, agreed_price, total_payments_scheduled, total_payments_received,
          commission_generated, clients:client_id ( full_name ),
          deal_payments ( status, due_date, amount )
        `)
        .not('status', 'in', '("closed","cancelled")')
        .is('deleted_at', null)

      for (const deal of deals ?? []) {
        const payments = (deal as any).deal_payments ?? []
        const overdue = payments.filter((p: any) => p.status === 'overdue')
        const pending = payments.filter((p: any) => p.status === 'pending')
        const daysSince = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000)
        const maxOverdueDays = overdue.length > 0
          ? Math.max(...overdue.map((p: any) => Math.floor((Date.now() - new Date(p.due_date).getTime()) / 86_400_000)))
          : 0
        const nextDue = deal.next_action_due
          ? Math.floor((Date.now() - new Date(deal.next_action_due).getTime()) / 86_400_000)
          : 0
        const pct = deal.agreed_price > 0
          ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
          : 0

        const risk = computeRisk({
          status:                 deal.status as DealStatus,
          daysSinceUpdate:        daysSince,
          overduePayments:        overdue.length,
          maxOverdueDays,
          pendingPayments:        pending.length,
          hasNextAction:          !!deal.next_action,
          nextActionOverdueDays:  Math.max(0, nextDue),
          paymentCompletionPct:   pct,
          totalPaymentsScheduled: deal.total_payments_scheduled ?? 0,
          agreedPrice:            deal.agreed_price,
        })

        // Persist risk history
        await supabase.from('deal_risk_history').insert({
          deal_id: deal.id, score: risk.score, level: risk.level, signals: risk.signals as any,
        })

        // Update deal if level changed
        if (risk.level !== deal.risk_level) {
          await supabase
            .from('deals')
            .update({ risk_level: risk.level, at_risk_since: risk.level !== 'low' ? new Date().toISOString() : null })
            .eq('id', deal.id)
          result.dealsRiskUpdated++
        }

        // Create urgent task for high/critical deals
        if (['high', 'critical'].includes(risk.level)) {
          const hasTask = await this._hasRecentTask({ deal_id: deal.id })
          if (!hasTask) {
            const clientName = (deal as any).clients?.full_name ?? 'Client'
            const suggestion = generateNextAction({
              status: deal.status as DealStatus,
              overduePayments: overdue.length, pendingPayments: pending.length,
              daysSinceUpdate: daysSince, paymentPct: pct,
              next_action: deal.next_action, next_action_due: deal.next_action_due,
              commissionGenerated: deal.commission_generated,
              hasPaymentSchedule: payments.length > 0,
            })

            await this._createTask({
              deal_id:     deal.id,
              assigned_to: deal.agent_id,
              title:       `${risk.level === 'critical' ? '🔴 CRITICAL' : '⚠ HIGH RISK'}: ${clientName} — ${suggestion.action}`,
              description: `Risk: ${risk.score}/100. ${risk.signals.join(' | ')}`,
              priority:    risk.level === 'critical' ? 'urgent' : 'high',
              due_date:    suggestion.dueDate,
            })
            result.tasksCreated++
          }
        }
      }

      result.log.push(`Risk: ${deals?.length ?? 0} deals, ${result.dealsRiskUpdated} updated`)
    } catch (e) {
      result.errors.push(`Deal risk: ${String(e)}`)
    }
  }

  // ─── 3. OVERDUE PAYMENTS ──────────────────────────────────────────────────

  private async _sweepOverduePayments(result: any) {
    const supabase = createAdminSupabaseClient()
    try {
      const { error } = await supabase
        .from('deal_payments')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString().split('T')[0])

      if (!error) result.log.push('Overdue payments: marked')
      else result.errors.push(`Overdue: ${error.message}`)
    } catch (e) {
      result.errors.push(`Overdue payments: ${String(e)}`)
    }
  }

  // ─── 4. MISSING NEXT ACTIONS ──────────────────────────────────────────────

  private async _sweepMissingNextActions(result: any) {
    const supabase = createAdminSupabaseClient()
    try {
      const { data: deals } = await supabase
        .from('deals')
        .select('id, status, next_action, next_action_due, total_payments_received, agreed_price, commission_generated, updated_at')
        .is('next_action', null)
        .not('status', 'in', '("closed","cancelled")')
        .is('deleted_at', null)
        .limit(50)

      for (const deal of deals ?? []) {
        const pct = deal.agreed_price > 0
          ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
          : 0
        const days = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000)

        const s = generateNextAction({
          status: deal.status as DealStatus,
          overduePayments: 0, pendingPayments: 0, daysSinceUpdate: days, paymentPct: pct,
          next_action: null, next_action_due: null,
          commissionGenerated: deal.commission_generated,
        })

        await supabase
          .from('deals')
          .update({ next_action: s.action, next_action_due: s.dueDate })
          .eq('id', deal.id)

        result.nextActionsRefreshed++
      }
      result.log.push(`Next actions: ${result.nextActionsRefreshed} refreshed`)
    } catch (e) {
      result.errors.push(`Next actions: ${String(e)}`)
    }
  }

  // ─── 5. UNPAID COMMISSIONS 30+ DAYS AFTER CLOSE ───────────────────────────

  private async _sweepUnpaidCommissions(result: any) {
    const supabase = createAdminSupabaseClient()
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0]

    try {
      const { data: unpaid } = await supabase
        .from('vw_commission_splits_balance')
        .select('split_id, agent_id, agent_name, outstanding, deal_id')
        .gt('outstanding', 0)

      for (const cs of unpaid ?? []) {
        const { data: deal } = await supabase
          .from('deals')
          .select('status, closing_date, agent_id')
          .eq('id', cs.deal_id)
          .eq('status', 'closed')
          .single()

        if (!deal || !deal.closing_date || deal.closing_date > cutoff) continue

        const hasTask = await this._hasRecentTask({ deal_id: cs.deal_id, title_ilike: '%commission%' })
        if (hasTask) continue

        const { data: mgr } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'manager'])
          .eq('is_active', true)
          .limit(1)

        await this._createTask({
          deal_id:     cs.deal_id,
          assigned_to: mgr?.[0]?.id ?? deal.agent_id,
          title:       `Commission unpaid: ${cs.agent_name} — ${cs.outstanding} DZD overdue`,
          description: 'Deal closed 30+ days ago. Commission has not been paid.',
          priority:    'high',
          due_date:    new Date().toISOString().split('T')[0],
        })
        result.tasksCreated++
      }
      result.log.push(`Commissions: ${result.tasksCreated} alerts`)
    } catch (e) {
      result.errors.push(`Commission alerts: ${String(e)}`)
    }
  }

  // ─── PRIORITY QUEUE ───────────────────────────────────────────────────────

  async getPriorityQueue(agentId?: string, limit = 20) {
    const supabase = createAdminSupabaseClient()

    let query = supabase
      .from('vw_deal_priority_queue')
      .select('*')
      .limit(limit)

    if (agentId) query = query.eq('agent_id', agentId)

    const { data, error } = await query
    if (error) throw new Error(`Failed to get priority queue: ${error.message}`)
    return data ?? []
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private async _createTask(input: {
    deal_id?: string
    lead_id?: string
    assigned_to: string
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    due_date: string
  }): Promise<void> {
    const supabase = createAdminSupabaseClient()
    await supabase.from('tasks').insert({
      ...input,
      created_by:   input.assigned_to,
      status:       'pending',
      is_automated: true,
    })
  }

  private async _hasRecentTask(filter: {
    deal_id?: string
    lead_id?: string
    title_ilike?: string
  }): Promise<boolean> {
    const supabase = createAdminSupabaseClient()
    const since = new Date(Date.now() - 23 * 3_600_000).toISOString()

    let query = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('is_automated', true)
      .eq('status', 'pending')
      .gt('created_at', since)

    if (filter.deal_id)    query = query.eq('deal_id', filter.deal_id)
    if (filter.lead_id)    query = query.eq('lead_id', filter.lead_id)
    if (filter.title_ilike) query = query.ilike('title', filter.title_ilike)

    const { count } = await query
    return (count ?? 0) > 0
  }
}

// Singleton
export const automationEngine = new AutomationEngineClass()
