// src/types/events.ts
export * from '@/core/eventBus'

export const EVENT_TYPES = {
  DEAL_CREATED:              'deal.created',
  DEAL_ACTIVATED:            'deal.activated',
  DEAL_NEGOTIATION_STARTED:  'deal.negotiation_started',
  DEAL_CLOSED:               'deal.closed',
  DEAL_CANCELLED:            'deal.cancelled',
  DEAL_AT_RISK:              'deal.at_risk',
  DEAL_ESCALATED:            'deal.escalated',
  LEAD_CREATED:              'lead.created',
  LEAD_CONTACTED:            'lead.contacted',
  LEAD_CONVERTED:            'lead.converted',
  LEAD_LOST:                 'lead.lost',
  PAYMENT_ADDED:             'payment.added',
  PAYMENT_PAID:              'payment.paid',
  PAYMENT_OVERDUE:           'payment.overdue',
  PAYMENT_REFUNDED:          'payment.refunded',
  COMMISSION_AGREED:         'commission.agreed',
  COMMISSION_PAID:           'commission.paid',
  AGENT_ASSIGNED:            'agent.assigned',
  AGENT_REASSIGNED:          'agent.reassigned',
  AUTOMATION_TRIGGERED:      'automation.triggered',
  SYSTEM_ERROR:              'system.error',
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]

export interface EventRow {
  id:             string
  event_type:     EventType
  status:         string
  entity_type:    string
  entity_id:      string
  triggered_by:   string | null
  assigned_agent: string | null
  payload:        Record<string, unknown>
  metadata:       Record<string, unknown>
  attempts:       number
  max_attempts:   number
  last_error:     string | null
  processed_at:   string | null
  scheduled_for:  string
  expires_at:     string | null
  created_at:     string
}
