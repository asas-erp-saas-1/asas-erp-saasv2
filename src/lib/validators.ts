// src/lib/validators.ts
// Centralized validation for all domain operations
// Used by services BEFORE hitting database
// Zod schemas are for API input; these are for business rule validation

import { z } from 'zod'
import { DEAL_STATUS, LEAD_STATUS } from '../core/stateMachine'

// =============================================================================
// PRIMITIVE VALIDATORS
// =============================================================================

export const positiveAmount = (amount: unknown, field = 'Amount'): void => {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new ValidationError(`${field} must be a positive number`, field)
  }
}

export const nonEmptyString = (value: unknown, field: string): void => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`, field)
  }
}

export const validUUID = (value: unknown, field: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (typeof value !== 'string' || !uuidRegex.test(value)) {
    throw new ValidationError(`${field} must be a valid UUID`, field)
  }
}

export const validDate = (value: unknown, field: string): void => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field} must be a valid date (YYYY-MM-DD)`, field)
  }
  const d = new Date(value)
  if (isNaN(d.getTime())) {
    throw new ValidationError(`${field} is not a valid date`, field)
  }
}

export const notFutureDate = (value: string, field: string): void => {
  validDate(value, field)
  if (new Date(value) > new Date()) {
    throw new ValidationError(`${field} cannot be in the future`, field)
  }
}

// =============================================================================
// VALIDATION ERROR
// =============================================================================

export class ValidationError extends Error {
  public readonly field?: string
  public readonly code: string

  constructor(message: string, field?: string, code = 'VALIDATION_ERROR') {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.code = code
  }
}

export class BusinessRuleError extends Error {
  public readonly code: string
  public readonly context?: Record<string, unknown>

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message)
    this.name = 'BusinessRuleError'
    this.code = code
    this.context = context
  }
}

// =============================================================================
// ZOD SCHEMAS (API input validation)
// =============================================================================

// Shared
const uuid   = z.string().uuid('Invalid ID')
const phone  = z.string().min(8).max(20)
const date   = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const money  = z.number().positive('Must be greater than 0')

// --- Client ---
export const ClientCreateSchema = z.object({
  full_name:   z.string().min(2).max(100),
  phone:       phone,
  phone_alt:   phone.optional().nullable(),
  email:       z.string().email().optional().nullable(),
  nationality: z.string().max(50).optional().nullable(),
  id_number:   z.string().max(30).optional().nullable(),
  type:        z.enum(['buyer', 'seller', 'tenant', 'investor']).default('buyer'),
  source:      z.enum(['facebook','instagram','referral','walk_in','website','phone','whatsapp','other']).optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
})

// --- Lead ---
const LeadBaseSchema = z.object({
  client_id:      uuid,
  assigned_agent: uuid.optional().nullable(),
  project_id:     uuid.optional().nullable(),
  source:         z.enum(['facebook','instagram','referral','walk_in','website','phone','whatsapp','other']).optional().nullable(),
  budget_min:     money.optional().nullable(),
  budget_max:     money.optional().nullable(),
  notes:          z.string().max(2000).optional().nullable(),
});

export const LeadCreateSchema = LeadBaseSchema.refine(
  d => !d.budget_min || !d.budget_max || d.budget_max >= d.budget_min,
  { message: 'Budget max must be >= budget min', path: ['budget_max'] }
)

export const LeadUpdateSchema = LeadBaseSchema.partial().omit({ client_id: true }).refine(
  d => !d.budget_min || !d.budget_max || d.budget_max >= d.budget_min,
  { message: 'Budget max must be >= budget min', path: ['budget_max'] }
)

export const LeadStatusSchema = z.object({
  status:      z.enum(['new','contacted','interested','visit_scheduled','converted','lost']),
  lost_reason: z.string().min(5).max(500).optional(),
})

// --- Deal ---
export const DealCreateSchema = z.object({
  lead_id:      uuid.optional().nullable(),
  client_id:    uuid,
  property_id:  uuid,
  agent_id:     uuid,
  deal_type:    z.enum(['sale','rental','resale']),
  agreed_price: money,
  notes:        z.string().max(2000).optional().nullable(),
  next_action:  z.string().max(500).optional().nullable(),
  initialPayments: z.array(z.object({
    amount:   money,
    due_date: date,
    notes:    z.string().max(200).optional().nullable(),
  })).optional(),
}).refine(
  d => {
    if (!d.initialPayments || d.initialPayments.length === 0) return true
    const total = d.initialPayments.reduce((s, p) => s + p.amount, 0)
    return total <= d.agreed_price
  },
  {
    message: 'Total of initial payments cannot exceed agreed price',
    path: ['initialPayments'],
  }
)

export const DealTransitionSchema = z.object({
  status:       z.enum(['draft','active','negotiation','closed','cancelled']),
  reason:       z.string().min(5).max(500).optional(),
  contract_date: date.optional().nullable(),
  notes:        z.string().max(1000).optional().nullable(),
})

export const DealNextActionSchema = z.object({
  next_action:     z.string().min(3).max(500),
  next_action_due: date.optional().nullable(),
})

// --- Payment ---
export const PaymentAddSchema = z.object({
  deal_id:        uuid,
  amount:         money,
  due_date:       date,
  notes:          z.string().max(200).optional().nullable(),
  payment_method: z.enum(['cash','bank_transfer','check','card']).optional().nullable(),
})

export const PaymentMarkPaidSchema = z.object({
  paid_date:      date,
  payment_method: z.enum(['cash','bank_transfer','check','card']),
  reference_no:   z.string().max(100).optional().nullable(),
})

// --- Commission ---
export const CommissionAgreementSchema = z.object({
  deal_id:      uuid,
  agent_id:     uuid,
  agreed_amount: z.number().min(0),
  currency:     z.string().max(10).default('DZD'),
  notes:        z.string().max(1000).optional().nullable(),
})

export const CommissionPaymentSchema = z.object({
  commission_agreement_id: uuid,
  agent_id:               uuid,
  amount_paid:            money,
  payment_date:           date,
  payment_method:         z.enum(['cash','bank_transfer','check']).optional().nullable(),
  reference_no:           z.string().max(100).optional().nullable(),
})

// --- Expense ---
export const ExpenseCreateSchema = z.object({
  category:     z.enum(['rent','salaries','marketing','utilities','travel','equipment','software','other']),
  amount:       money,
  expense_date: date,
  description:  z.string().min(3).max(500),
  receipt_url:  z.string().url().optional().nullable(),
  notes:        z.string().max(500).optional().nullable(),
})

// --- Activity ---
export const ActivityCreateSchema = z.object({
  lead_id:   uuid.optional().nullable(),
  deal_id:   uuid.optional().nullable(),
  type:      z.enum(['call','whatsapp','email','visit','meeting','note','status_change']),
  notes:     z.string().min(1).max(2000),
}).refine(
  d => d.lead_id !== null || d.deal_id !== null,
  { message: 'Activity must be linked to a lead or deal' }
)

// --- Task ---
export const TaskCreateSchema = z.object({
  assigned_to:  uuid,
  lead_id:      uuid.optional().nullable(),
  deal_id:      uuid.optional().nullable(),
  title:        z.string().min(3).max(200),
  description:  z.string().max(1000).optional().nullable(),
  priority:     z.enum(['low','medium','high','urgent']).default('medium'),
  due_date:     date.optional().nullable(),
})

// =============================================================================
// BUSINESS RULE VALIDATORS
// (called in services, AFTER Zod schema parsing)
// =============================================================================

export function validateDealCanClose(deal: {
  status: string
  pendingPaymentCount: number
  overduePaymentCount: number
  agreed_price: number
  total_payments_received: number
}): void {
  if (deal.status !== 'negotiation') {
    throw new BusinessRuleError(
      `Deal must be in "negotiation" to close. Current: "${deal.status}"`,
      'INVALID_STATE_FOR_CLOSE'
    )
  }
  if (deal.pendingPaymentCount > 0) {
    throw new BusinessRuleError(
      `${deal.pendingPaymentCount} payment(s) still pending. All must be paid before closing.`,
      'PENDING_PAYMENTS_BLOCK_CLOSE',
      { pendingPaymentCount: deal.pendingPaymentCount }
    )
  }
  if (deal.overduePaymentCount > 0) {
    throw new BusinessRuleError(
      `${deal.overduePaymentCount} overdue payment(s). Resolve before closing.`,
      'OVERDUE_PAYMENTS_BLOCK_CLOSE',
      { overduePaymentCount: deal.overduePaymentCount }
    )
  }
}

export function validatePaymentDoesNotOverpay(
  paymentAmount: number,
  agreedPrice: number,
  alreadyScheduled: number,
  excludeId?: string
): void {
  const newTotal = alreadyScheduled + paymentAmount
  if (newTotal > agreedPrice) {
    const remaining = agreedPrice - alreadyScheduled
    throw new BusinessRuleError(
      `Payment of ${paymentAmount} would exceed agreed price ${agreedPrice}. Maximum allowed: ${remaining}`,
      'OVERPAYMENT_BLOCKED',
      { agreedPrice, alreadyScheduled, paymentAmount, remaining }
    )
  }
}

export function validateCommissionAmount(
  commissionAmount: number,
  dealAgreedPrice: number
): void {
  if (commissionAmount < 0) {
    throw new BusinessRuleError('Commission amount cannot be negative', 'NEGATIVE_COMMISSION')
  }
  if (commissionAmount > dealAgreedPrice) {
    throw new BusinessRuleError(
      `Commission (${commissionAmount}) cannot exceed deal price (${dealAgreedPrice})`,
      'COMMISSION_EXCEEDS_DEAL_PRICE',
      { commissionAmount, dealAgreedPrice }
    )
  }
}

export function validateCommissionPaymentDoesNotOverpay(
  paymentAmount: number,
  agreedCommission: number,
  alreadyPaid: number
): void {
  if (alreadyPaid + paymentAmount > agreedCommission) {
    const remaining = agreedCommission - alreadyPaid
    throw new BusinessRuleError(
      `Commission payment of ${paymentAmount} exceeds outstanding balance of ${remaining}`,
      'COMMISSION_OVERPAYMENT',
      { agreedCommission, alreadyPaid, paymentAmount, remaining }
    )
  }
}

// =============================================================================
// PARSE + VALIDATE HELPER
// Combines Zod parsing with business rule validation
// =============================================================================

export function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  label = 'Input'
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    const field = firstError.path.join('.')
    throw new ValidationError(
      `${label}: ${firstError.message}${field ? ` (field: ${field})` : ''}`,
      field
    )
  }
  return result.data
}

// Infer output types from schemas
export type ClientCreateInput         = z.infer<typeof ClientCreateSchema>
export type LeadCreateInput           = z.infer<typeof LeadCreateSchema>
export type LeadUpdateInput           = z.infer<typeof LeadUpdateSchema>
export type DealCreateInput           = z.infer<typeof DealCreateSchema>
export type DealTransitionInput       = z.infer<typeof DealTransitionSchema>
export type DealNextActionInput       = z.infer<typeof DealNextActionSchema>
export type PaymentAddInput           = z.infer<typeof PaymentAddSchema>
export type PaymentMarkPaidInput      = z.infer<typeof PaymentMarkPaidSchema>
export type CommissionAgreementInput  = z.infer<typeof CommissionAgreementSchema>
export type CommissionPaymentInput    = z.infer<typeof CommissionPaymentSchema>
export type ExpenseCreateInput        = z.infer<typeof ExpenseCreateSchema>
export type ActivityCreateInput       = z.infer<typeof ActivityCreateSchema>
export type TaskCreateInput           = z.infer<typeof TaskCreateSchema>
