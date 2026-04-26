// src/utils/auditLog.ts
// Immutable audit trail for all sensitive operations

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface AuditEntry {
  action:      string
  entity_type: string
  entity_id?:  string
  old_data?:   Record<string, unknown>
  new_data?:   Record<string, unknown>
  user_id?:    string
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('audit_logs').insert({
      user_id:     entry.user_id ?? user?.id ?? null,
      action:      entry.action,
      entity_type: entry.entity_type,
      entity_id:   entry.entity_id ?? null,
      old_data:    entry.old_data ?? null,
      new_data:    entry.new_data ?? null,
    })
  } catch (err) {
    // Audit failures must never break business operations
    console.error('[AuditLog] Write failed:', err)
  }
}

export const AUDIT_ACTIONS = {
  // Leads
  LEAD_CREATED:   'lead.created',
  LEAD_UPDATED:   'lead.updated',
  LEAD_CONVERTED: 'lead.converted',
  LEAD_LOST:      'lead.lost',
  LEAD_ARCHIVED:  'lead.archived',
  // Deals
  DEAL_CREATED:   'deal.created',
  DEAL_UPDATED:   'deal.updated',
  DEAL_ACTIVATED: 'deal.activated',
  DEAL_NEGOTIATION_STARTED: 'deal.negotiation_started',
  DEAL_CLOSED:    'deal.closed',
  DEAL_CANCELLED: 'deal.cancelled',
  DEAL_ARCHIVED:  'deal.archived',
  // Payments
  PAYMENT_ADDED:       'payment.added',
  PAYMENT_MARKED_PAID: 'payment.marked_paid',
  PAYMENT_CANCELLED:   'payment.cancelled',
  // Commission
  COMMISSION_AGREED:   'commission.agreed',
  COMMISSION_UPDATED:  'commission.updated',
  COMMISSION_PAID:     'commission.paid',
  // Finance
  EXPENSE_ADDED: 'expense.added',
} as const
