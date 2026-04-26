// src/lib/apiResponse.ts
import { NextResponse } from 'next/server'
import { PlanLimitExceeded, FeatureNotAvailable } from '@/lib/planEnforcement'
import { AuthError, PermissionError } from '@/lib/auth'

export interface ApiSuccess<T> {
  success: true
  data:    T
  meta?:   { page?: number; total?: number; limit?: number; totalPages?: number }
}

export interface ApiError {
  success:    false
  error:      string
  code:       string
  statusCode: number
  details?:   Record<string, unknown>
}

export function ok<T>(data: T, meta?: ApiSuccess<T>['meta']): NextResponse {
  return NextResponse.json({ success: true, data, meta } satisfies ApiSuccess<T>)
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiSuccess<T>, { status: 201 })
}

export function fail(error: unknown): NextResponse {
  if (error instanceof PlanLimitExceeded) {
    return NextResponse.json({
      success: false, code: 'PLAN_LIMIT_EXCEEDED',
      error: error.message, statusCode: 402,
      details: { resource: error.resource, limit: error.limit, current: error.current, upgradeTo: error.upgradeRequired },
    } satisfies ApiError, { status: 402 })
  }

  if (error instanceof FeatureNotAvailable) {
    return NextResponse.json({
      success: false, code: 'FEATURE_NOT_AVAILABLE',
      error: error.message, statusCode: 402,
      details: { feature: error.feature, currentPlan: error.currentPlan, requiredPlan: error.requiredPlan },
    } satisfies ApiError, { status: 402 })
  }

  if (error instanceof AuthError) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', error: error.message, statusCode: 401 } satisfies ApiError, { status: 401 })
  }

  if (error instanceof PermissionError) {
    return NextResponse.json({ success: false, code: 'PERMISSION_DENIED', error: error.message, statusCode: 403 } satisfies ApiError, { status: 403 })
  }

  const msg    = error instanceof Error ? error.message : String(error)
  const code   = msg.startsWith('STATE_LOCKED')        ? 'INVALID_TRANSITION'
    : msg.startsWith('INVALID_TRANSITION')             ? 'INVALID_TRANSITION'
    : msg.startsWith('CLOSE_BLOCKED')                  ? 'BUSINESS_RULE_VIOLATION'
    : msg.startsWith('OVERPAYMENT_BLOCKED')            ? 'BUSINESS_RULE_VIOLATION'
    : msg.startsWith('DUPLICATE')                      ? 'CONFLICT'
    : msg.startsWith('VALIDATION')                     ? 'VALIDATION_ERROR'
    : msg.includes('NOT_FOUND')                        ? 'NOT_FOUND'
    : 'INTERNAL_ERROR'

  const status = code === 'VALIDATION_ERROR'       ? 422
    : code === 'NOT_FOUND'                         ? 404
    : code === 'CONFLICT'                          ? 409
    : code === 'BUSINESS_RULE_VIOLATION'           ? 422
    : code === 'INVALID_TRANSITION'                ? 422
    : 500

  return NextResponse.json({ success: false, code, error: msg, statusCode: status } satisfies ApiError, { status })
}
