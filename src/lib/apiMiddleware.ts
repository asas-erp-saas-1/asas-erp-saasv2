// src/lib/apiMiddleware.ts
// Request middleware: latency tracking, rate limiting, structured request logging

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// LATENCY TRACKING WRAPPER
// Wraps any API route handler to record timing metrics
// =============================================================================

type RouteHandler = (req: Request, ...args: unknown[]) => Promise<Response>

export function withMetrics(
  db:       SupabaseClient,
  service:  string,
  endpoint: string,
  handler:  RouteHandler,
): RouteHandler {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    const start  = Date.now()
    let success  = true

    try {
      const response = await handler(req, ...args)
      success = response.ok
      return response
    } catch (err) {
      success = false
      throw err
    } finally {
      const durationMs = Date.now() - start
      // Fire-and-forget — never block the response
      Promise.resolve(db.from('uptime_checks').insert({
        service,
        status:    success ? 'up' : 'degraded',
        latency_ms: durationMs,
      })).catch(() => {})
    }
  }
}

// =============================================================================
// RATE LIMIT MIDDLEWARE
// Wraps route handler with per-user rate limiting
// =============================================================================

interface RateLimitOptions {
  action: string
  limit:  number   // requests per hour
}

export function withRateLimit(
  db:      SupabaseClient,
  options: RateLimitOptions,
  handler: () => Promise<NextResponse>,
): () => Promise<NextResponse> {
  return async (): Promise<NextResponse> => {
    // Extract user from auth header (Supabase session)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return handler()

    const { data: allowed } = await db.rpc('fn_check_rate_limit', {
      p_user_id: user.id,
      p_action:  options.action,
      p_limit:   options.limit,
    })

    if (allowed === false) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', action: options.action, limit: options.limit },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }

    return handler()
  }
}


// =============================================================================
// src/services/costService.ts
// Infrastructure and marketing cost tracking
// =============================================================================

export type CostType = 'infra' | 'marketing' | 'operational' | 'salary' | 'other'

export interface CostEntry {
  id:          string
  costType:    CostType
  provider:    string | null
  amount:      number
  currency:    string
  periodStart: string
  periodEnd:   string
  description: string | null
  metadata:    Record<string, unknown>
  createdAt:   string
}

export interface CostSummary {
  totalByType:   Record<CostType, number>
  totalUSD:      number
  period:        string
  topProviders:  Array<{ provider: string; amount: number }>
}

export interface CostServiceInstance {
  recordCost:      (input: Omit<CostEntry, 'id' | 'createdAt'>, recordedBy: string) => Promise<CostEntry>
  getCostSummary:  (fromDate: string, toDate: string) => Promise<CostSummary>
  getCostByType:   (type: CostType, fromDate: string, toDate: string) => Promise<CostEntry[]>
  estimateMonthly: () => Promise<{ infraUSD: number; marketingDZD: number; totalDZD: number }>
}

export function createCostService(db: SupabaseClient): CostServiceInstance {

  async function recordCost(
    input:      Omit<CostEntry, 'id' | 'createdAt'>,
    recordedBy: string,
  ): Promise<CostEntry> {
    const { data, error } = await db
      .from('cost_entries')
      .insert({
        cost_type:    input.costType,
        provider:     input.provider ?? null,
        amount:       input.amount,
        currency:     input.currency,
        period_start: input.periodStart,
        period_end:   input.periodEnd,
        description:  input.description ?? null,
        metadata:     input.metadata,
        recorded_by:  recordedBy,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to record cost: ${error.message}`)

    const row = data as Record<string, unknown>
    return {
      id:          row.id as string,
      costType:    row.cost_type as CostType,
      provider:    row.provider as string | null,
      amount:      Number(row.amount),
      currency:    row.currency as string,
      periodStart: row.period_start as string,
      periodEnd:   row.period_end as string,
      description: row.description as string | null,
      metadata:    row.metadata as Record<string, unknown>,
      createdAt:   row.created_at as string,
    }
  }

  async function getCostSummary(fromDate: string, toDate: string): Promise<CostSummary> {
    const { data } = await db
      .from('cost_entries')
      .select('cost_type, provider, amount, currency')
      .gte('period_start', fromDate)
      .lte('period_end', toDate)

    const rows = (data ?? []) as Array<{ cost_type: string; provider: string | null; amount: number; currency: string }>

    const byType: Record<string, number> = {}
    const byProvider: Record<string, number> = {}
    let totalUSD = 0

    for (const row of rows) {
      const amt = Number(row.amount)
      // Normalize to USD (simplified — DZD ÷ 133 ≈ USD)
      const usdEquiv = row.currency === 'USD' ? amt : row.currency === 'DZD' ? amt / 133 : amt
      byType[row.cost_type]   = (byType[row.cost_type] ?? 0) + usdEquiv
      totalUSD               += usdEquiv
      if (row.provider) {
        byProvider[row.provider] = (byProvider[row.provider] ?? 0) + usdEquiv
      }
    }

    const topProviders = Object.entries(byProvider)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([provider, amount]) => ({ provider, amount: Math.round(amount * 100) / 100 }))

    return {
      totalByType:  byType as Record<CostType, number>,
      totalUSD:     Math.round(totalUSD * 100) / 100,
      period:       `${fromDate} – ${toDate}`,
      topProviders,
    }
  }

  async function getCostByType(type: CostType, fromDate: string, toDate: string): Promise<CostEntry[]> {
    const { data } = await db
      .from('cost_entries')
      .select('*')
      .eq('cost_type', type)
      .gte('period_start', fromDate)
      .lte('period_end', toDate)
      .order('period_start', { ascending: false })

    return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      id:          row.id as string,
      costType:    row.cost_type as CostType,
      provider:    row.provider as string | null,
      amount:      Number(row.amount),
      currency:    row.currency as string,
      periodStart: row.period_start as string,
      periodEnd:   row.period_end as string,
      description: row.description as string | null,
      metadata:    row.metadata as Record<string, unknown>,
      createdAt:   row.created_at as string,
    }))
  }

  async function estimateMonthly(): Promise<{ infraUSD: number; marketingDZD: number; totalDZD: number }> {
    const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]!
    const to   = new Date().toISOString().split('T')[0]!
    const summary = await getCostSummary(from, to)

    const infraUSD     = summary.totalByType['infra'] ?? 0
    const marketingDZD = (summary.totalByType['marketing'] ?? 0) * 133 // USD→DZD
    const totalDZD     = (summary.totalUSD * 133)

    return { infraUSD: Math.round(infraUSD * 100) / 100, marketingDZD: Math.round(marketingDZD), totalDZD: Math.round(totalDZD) }
  }

  return { recordCost, getCostSummary, getCostByType, estimateMonthly }
}
