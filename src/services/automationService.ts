// src/services/automationService.ts
// Automation engine — detects risk, creates tasks, updates deal intelligence

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { computeRisk, generateNextAction } from '@/core/stateMachine'

// =============================================================================
// TYPES
// =============================================================================

export interface AutomationRunResult {
  tasksCreated: number
  dealsRiskUpdated: number
  dealsNextActionUpdated: number
  errors: string[]
  log: string[]
}

// =============================================================================
// MAIN ENGINE
// =============================================================================

export async function runAllAutomations(): Promise<AutomationRunResult> {
  const result: AutomationRunResult = {
    tasksCreated: 0,
    dealsRiskUpdated: 0,
    dealsNextActionUpdated: 0,
    errors: [],
    log: [],
  }

  await Promise.allSettled([
    automation_inactiveLeadFollowUp(result),
    automation_dealRiskAssessment(result),
    automation_overduePaymentAlerts(result),
    automation_unpaidCommissionAlerts(result),
    automation_smartNextActionRefresh(result),
  ])

  // Record this run
  const supabase = createAdminSupabaseClient()
  await supabase.from('automation_runs').insert({
    run_type:    'full_automation',
    entity_type: 'system',
    result:      result as any,
  })

  return result
}

// =============================================================================
// AUTOMATION 1: Inactive lead follow-up (48h+ without contact)
// =============================================================================

async function automation_inactiveLeadFollowUp(
  result: AutomationRunResult
): Promise<void> {
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
      const alreadyHasTask = await _hasRecentTask(supabase, { lead_id: lead.id })
      if (alreadyHasTask) continue

      const hours = Math.floor((Date.now() - new Date(lead.last_activity).getTime()) / 3_600_000)
      const clientName = (lead as any).clients?.full_name ?? 'Client'

      await supabase.from('tasks').insert({
        assigned_to:  lead.assigned_agent,
        created_by:   lead.assigned_agent,
        lead_id:      lead.id,
        title:        `Call ${clientName} — no contact for ${hours}h`,
        description:  `Lead has been inactive for ${hours} hours. Risk of going cold.`,
        priority:     hours > 72 ? 'urgent' : 'high',
        status:       'pending',
        due_date:     new Date().toISOString().split('T')[0],
        is_automated: true,
      })
      result.tasksCreated++
    }

    result.log.push(`Lead inactivity: processed ${leads?.length ?? 0} leads, ${result.tasksCreated} tasks`)
  } catch (e) {
    result.errors.push(`Lead inactivity check failed: ${String(e)}`)
  }
}

// =============================================================================
// AUTOMATION 2: Deal risk scoring
// =============================================================================

async function automation_dealRiskAssessment(
  result: AutomationRunResult
): Promise<void> {
  const supabase = createAdminSupabaseClient()

  try {
    const { data: deals } = await supabase
      .from('deals')
      .select(`
        id, status, risk_level, updated_at, next_action, next_action_due,
        agent_id, agreed_price, total_payments_received,
        clients:client_id ( full_name ),
        deal_payments ( status, due_date )
      `)
      .not('status', 'in', '("closed","cancelled")')
      .is('deleted_at', null)

    for (const deal of deals ?? []) {
      const payments = (deal as any).deal_payments ?? []
      const daysSince = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000)
      const overdue = payments.filter((p: any) => p.status === 'overdue')
      const maxOverdueDays = overdue.length > 0
        ? Math.max(...overdue.map((p: any) => Math.floor((Date.now() - new Date(p.due_date).getTime()) / 86_400_000)))
        : 0

      const nextActionDue = deal.next_action_due
        ? Math.floor((Date.now() - new Date(deal.next_action_due).getTime()) / 86_400_000)
        : 0

      const totalPct = deal.agreed_price > 0
        ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
        : 0

      const risk = computeRisk({
        status:                 deal.status as any,
        daysSinceUpdate:        daysSince,
        overduePayments:        overdue.length,
        maxOverdueDays,
        pendingPayments:        payments.filter((p: any) => p.status === 'pending').length,
        hasNextAction:          !!deal.next_action,
        nextActionOverdueDays:  Math.max(0, nextActionDue),
        paymentCompletionPct:   totalPct,
        totalPaymentsScheduled: (deal as any).total_payments_scheduled ?? 0,
        agreedPrice:            deal.agreed_price,
      })

      if (risk.level !== deal.risk_level) {
        await supabase
          .from('deals')
          .update({
            risk_level:    risk.level,
            at_risk_since: risk.level !== 'low' ? new Date().toISOString() : null,
          })
          .eq('id', deal.id)
        result.dealsRiskUpdated++
      }

      // Create task for high/critical risk deals
      if (['high', 'critical'].includes(risk.level)) {
        const hasTask = await _hasRecentTask(supabase, { deal_id: deal.id })
        if (!hasTask) {
          const clientName = (deal as any).clients?.full_name ?? 'Client'
          const suggestion = generateNextAction({
            status:               deal.status as any,
            overduePayments:  overdue.length,
            pendingPayments:  payments.filter((p: any) => p.status === 'pending').length,
            daysSinceUpdate:      daysSince,
            paymentPct:      totalPct,
            next_action:          deal.next_action,
            next_action_due:      deal.next_action_due,
          })

          await supabase.from('tasks').insert({
            assigned_to:  deal.agent_id,
            created_by:   deal.agent_id,
            deal_id:      deal.id,
            title:        `${risk.level === 'critical' ? '🔴 CRITICAL' : '⚠ HIGH RISK'}: ${clientName} — ${suggestion.action}`,
            description:  `Risk score: ${risk.score}/100. Signals: ${risk.signals.join(', ')}`,
            priority:     risk.level === 'critical' ? 'urgent' : 'high',
            status:       'pending',
            due_date:     suggestion.dueDate,
            is_automated: true,
          })
          result.tasksCreated++
        }
      }
    }

    result.log.push(`Risk assessment: ${deals?.length ?? 0} deals scanned, ${result.dealsRiskUpdated} updated`)
  } catch (e) {
    result.errors.push(`Deal risk assessment failed: ${String(e)}`)
  }
}

// =============================================================================
// AUTOMATION 3: Overdue payment alerts
// =============================================================================

async function automation_overduePaymentAlerts(
  result: AutomationRunResult
): Promise<void> {
  const supabase = createAdminSupabaseClient()

  try {
    // Mark payments as overdue first
    await supabase
      .from('deal_payments')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])

    result.log.push('Overdue payments: marked pending → overdue')
  } catch (e) {
    result.errors.push(`Overdue payment check failed: ${String(e)}`)
  }
}

// =============================================================================
// AUTOMATION 4: Unpaid commission > 30 days after close
// =============================================================================

async function automation_unpaidCommissionAlerts(
  result: AutomationRunResult
): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0]

  try {
    const { data: unpaid } = await supabase
      .from('vw_commission_balance')
      .select('agreement_id, agent_id, agent_name, outstanding_balance, deal_id')
      .gt('outstanding_balance', 0)

    for (const commission of unpaid ?? []) {
      const { data: deal } = await supabase
        .from('deals')
        .select('id, status, closing_date, agent_id')
        .eq('id', commission.deal_id)
        .eq('status', 'closed')
        .single()

      if (!deal || !deal.closing_date || deal.closing_date > thirtyDaysAgo) continue

      const hasTask = await _hasRecentTask(supabase, {
        deal_id: commission.deal_id,
        title_ilike: '%commission%',
      })
      if (hasTask) continue

      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'manager'])
        .eq('is_active', true)
        .limit(1)

      const assignTo = managers?.[0]?.id ?? deal.agent_id

      await supabase.from('tasks').insert({
        assigned_to:  assignTo,
        created_by:   assignTo,
        deal_id:      commission.deal_id,
        title:        `Commission unpaid: ${commission.agent_name} — ${commission.outstanding_balance} DZD outstanding`,
        description:  `Deal closed 30+ days ago. Commission unpaid.`,
        priority:     'high',
        status:       'pending',
        due_date:     new Date().toISOString().split('T')[0],
        is_automated: true,
      })
      result.tasksCreated++
    }

    result.log.push(`Commission alerts: ${result.tasksCreated} tasks created`)
  } catch (e) {
    result.errors.push(`Commission alert check failed: ${String(e)}`)
  }
}

// =============================================================================
// AUTOMATION 5: Refresh next_action for deals without one
// =============================================================================

async function automation_smartNextActionRefresh(
  result: AutomationRunResult
): Promise<void> {
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
      const daysSince = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86_400_000)
      const totalPct = deal.agreed_price > 0
        ? Math.round(((deal.total_payments_received ?? 0) / deal.agreed_price) * 100)
        : 0

      const suggestion = generateNextAction({
        status:               deal.status as any,
        overduePayments:  0,
        pendingPayments:  0,
        daysSinceUpdate:      daysSince,
        paymentPct:      totalPct,
        next_action:          deal.next_action,
        next_action_due:      deal.next_action_due,
        commissionGenerated: deal.commission_generated,
      })

      await supabase
        .from('deals')
        .update({
          next_action:     suggestion.action,
          next_action_due: suggestion.dueDate,
        })
        .eq('id', deal.id)

      result.dealsNextActionUpdated++
    }

    result.log.push(`Next action refresh: ${result.dealsNextActionUpdated} deals updated`)
  } catch (e) {
    result.errors.push(`Next action refresh failed: ${String(e)}`)
  }
}

// =============================================================================
// FIRST CONTACT TASK — called on lead creation
// =============================================================================

export async function createFirstContactTask(
  leadId: string,
  agentId: string,
  clientName: string
): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]

  await supabase.from('tasks').insert({
    assigned_to:  agentId,
    created_by:   agentId,
    lead_id:      leadId,
    title:        `First contact: ${clientName} — within 24h`,
    description:  'New lead assigned. Initial contact required within 24 hours.',
    priority:     'high',
    status:       'pending',
    due_date:     tomorrow,
    is_automated: true,
  })
}

// =============================================================================
// HELPERS
// =============================================================================

async function _hasRecentTask(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  filter: { lead_id?: string; deal_id?: string; title_ilike?: string }
): Promise<boolean> {
  const since = new Date(Date.now() - 23 * 3_600_000).toISOString()
  let query = supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('is_automated', true)
    .eq('status', 'pending')
    .gt('created_at', since)

  if (filter.lead_id)     query = query.eq('lead_id', filter.lead_id)
  if (filter.deal_id)     query = query.eq('deal_id', filter.deal_id)
  if (filter.title_ilike) query = query.ilike('title', filter.title_ilike)

  const { count } = await query
  return (count ?? 0) > 0
}
