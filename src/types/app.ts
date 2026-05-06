// src/types/app.ts
// Central domain type definitions — all services import from here

export type UserRole    = 'admin' | 'manager' | 'agent'
export type DealStatus  = 'draft' | 'active' | 'negotiation' | 'closed' | 'cancelled'
export type LeadStatus  = 'new' | 'contacted' | 'interested' | 'visit_scheduled' | 'converted' | 'lost'
export type RiskLevel   = 'low' | 'medium' | 'high' | 'critical'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type ActivityType  = 'call' | 'whatsapp' | 'email' | 'visit' | 'meeting' | 'note' | 'status_change'
export type TaskPriority  = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus    = 'pending' | 'in_progress' | 'done' | 'cancelled'
export type DealType      = 'sale' | 'rental' | 'resale'
export type ClientType    = 'buyer' | 'seller' | 'tenant' | 'investor'

export interface Profile {
  id:         string
  agency_id:  string | null
  full_name:  string
  phone:      string | null
  email:      string | null
  role:       UserRole
  is_active:  boolean
  avatar_url: string | null
  created_at: string
  updated_at?: string
}

export interface Client {
  id:         string
  full_name:  string
  phone:      string | null
  phone_alt:  string | null
  email:      string | null
  nationality: string | null
  type:        ClientType
  source:      string | null
  notes:       string | null
  deleted_at:  string | null
  created_at:  string
}

export interface Project {
  id:          string
  name:        string
  city:        string | null
  location:    string | null
  address:     string | null
  status:      string
  developer?:  { id: string; name: string } | null
}

export interface Property {
  id:             string
  project_id:     string
  reference_code: string | null
  type:           string
  rooms:          string | null
  area_sqm:       number | null
  list_price:     number
  status:         string
  images:         string[]
  deleted_at:     string | null
  projects?:      Project | null
}

export interface Lead {
  id:             string
  client_id:      string
  assigned_agent: string | null
  project_id:     string | null
  status:         LeadStatus
  source:         string | null
  budget_min:     number | null
  budget_max:     number | null
  lost_reason:    string | null
  notes:          string | null
  last_activity:  string
  deleted_at:     string | null
  created_at:     string
  updated_at:     string
  // Joined
  clients?:       { id: string; full_name: string; phone: string | null } | null
  profiles?:      { id: string; full_name: string } | null
  projects?:      { id: string; name: string } | null
}

export interface Deal {
  id:                       string
  lead_id:                  string | null
  client_id:                string
  property_id:              string
  agent_id:                 string
  deal_type:                DealType
  status:                   DealStatus
  agreed_price:             number
  contract_date:            string | null
  closing_date:             string | null
  notes:                    string | null
  next_action:              string | null
  next_action_due:          string | null
  risk_level:               RiskLevel
  at_risk_since:            string | null
  total_payments_scheduled: number
  total_payments_received:  number
  activated_at:             string | null
  negotiation_started_at:   string | null
  commission_generated:     boolean
  cancellation_reason:      string | null
  penalty_applied:          boolean
  total_refunded:           number
  version:                  number
  deleted_at:               string | null
  created_at:               string
  updated_at:               string
  // Joined
  clients?:     { id: string; full_name: string; phone: string | null } | null
  profiles?:    { id: string; full_name: string } | null
  properties?:  Property & { projects?: Project | null } | null
}

export interface DealPayment {
  id:             string
  deal_id:        string
  amount:         number
  due_date:       string
  paid_date:      string | null
  status:         PaymentStatus
  payment_method: string | null
  reference_no:   string | null
  notes:          string | null
  created_at:     string
  // Joined (optional)
  deals?:         Partial<Deal> | null
}

export interface Activity {
  id:         string
  lead_id:    string | null
  deal_id:    string | null
  type:       ActivityType
  description: string
  created_by: string
  deleted_at: string | null
  created_at: string
  // Joined
  profiles?:  { id: string; full_name: string } | null
}

export interface Task {
  id:          string
  assigned_to: string
  created_by:  string
  lead_id:     string | null
  deal_id:     string | null
  title:       string
  description: string | null
  priority:    TaskPriority
  status:      TaskStatus
  due_date:    string | null
  done_at:     string | null
  is_automated: boolean
  created_at:  string
  updated_at:  string
}

export interface CommissionAgreement {
  id:            string
  deal_id:       string
  agent_id:      string
  agreed_amount: number
  currency:      string
  approved_by:   string | null
  approved_at:   string | null
  notes:         string | null
  created_at:    string
  // Joined
  profiles?:     { id: string; full_name: string } | null
  deals?:        Partial<Deal> | null
}

export interface CommissionBalance {
  agreement_id:      string
  deal_id:           string
  agent_id:          string
  agent_name:        string
  agreed_amount:     number
  total_paid:        number
  outstanding_balance: number
  payment_status:    'fully_paid' | 'partially_paid' | 'unpaid'
  paid_pct:          number
}

export interface CommissionPayment {
  id:                      string
  commission_agreement_id: string
  agent_id:                string
  amount_paid:             number
  payment_date:            string
  payment_method:          string | null
  reference_no:            string | null
  notes:                   string | null
  created_at:              string
}

export interface Expense {
  id:           string
  category:     string
  amount:       number
  expense_date: string
  description:  string
  paid_by:      string | null
  receipt_url:  string | null
  notes:        string | null
  created_at:   string
  // Joined
  profiles?:    { id: string; full_name: string } | null
}

export interface FinanceSummary {
  totalRevenue:          number
  commissionAgreed:      number
  commissionReceived:    number
  commissionOutstanding: number
  totalExpenses:         number
  netProfit:             number
  periodLabel:           string
  totalRefunds?:         number
  totalPenalties?:       number
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface DealFilters {
  status?:    DealStatus
  agentId?:   string
  dateFrom?:  string
  dateTo?:    string
  riskLevel?: RiskLevel
}

export interface LeadFilters {
  status?:        LeadStatus
  assignedAgent?: string
  source?:        string
  dateFrom?:      string
  dateTo?:        string
}

export interface FinanceFilters {
  agentId?: string
  month?:   string
  year?:    string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:       T[]
  count:      number
  page:       number
  limit:      number
  totalPages: number
}
