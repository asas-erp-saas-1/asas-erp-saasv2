// src/services/healthService.ts
// System health monitoring — uptime, latency, error rates, queue depth

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export type ServiceStatus = 'up' | 'down' | 'degraded'

export interface ServiceHealth {
  service:      string
  status:       ServiceStatus
  latencyMs:    number | null
  errorRatePct: number | null
  p50Ms:        number | null
  p95Ms:        number | null
  p99Ms:        number | null
  checkedAt:    string
}

export interface SystemHealth {
  overall:         ServiceStatus
  services:        ServiceHealth[]
  queueDepth:      number
  dlqDepth:        number
  snapshotFreshness: {
    rmPipeline:  number | null   // seconds
    rmFinance:   number | null
    rmAgents:    number | null
  }
  activeAlerts:    number
  checkedAt:       string
}

export interface HealthServiceInstance {
  checkHealth:         () => Promise<SystemHealth>
  checkService:        (service: string, pingFn: () => Promise<boolean>) => Promise<ServiceHealth>
  recordMetrics:       (service: string, endpoint: string, durationMs: number, success: boolean) => Promise<void>
  getLatencyStats:     (service: string, windowMinutes?: number) => Promise<{ p50: number; p95: number; p99: number; errorRate: number } | null>
  emitAlertIfDegraded: (health: SystemHealth) => Promise<void>
}

export function createHealthService(db: SupabaseClient): HealthServiceInstance {

  // ==========================================================================
  // RECORD METRICS (called by API middleware)
  // ==========================================================================

  async function recordMetrics(
    service:    string,
    endpoint:   string,
    durationMs: number,
    success:    boolean,
  ): Promise<void> {
    try {
      // Record raw uptime check
      await db.from('uptime_checks').insert({
        service,
        status:     success ? 'up' : 'degraded',
        latency_ms: durationMs,
        checked_at: new Date().toISOString(),
      })
    } catch {
      // Never let health recording break the main request
    }
  }

  // ==========================================================================
  // GET LATENCY STATS (p50/p95/p99 from recent samples)
  // ==========================================================================

  async function getLatencyStats(
    service:        string,
    windowMinutes = 60,
  ): Promise<{ p50: number; p95: number; p99: number; errorRate: number } | null> {
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString()

    const { data } = await db
      .from('uptime_checks')
      .select('latency_ms, status')
      .eq('service', service)
      .gte('checked_at', since)
      .order('latency_ms', { ascending: true })

    if (!data || data.length < 3) return null

    const latencies = (data as Array<{ latency_ms: number | null; status: string }>)
      .filter((r) => r.latency_ms !== null)
      .map((r) => r.latency_ms!)

    if (latencies.length === 0) return null

    const errors    = (data as Array<{ status: string }>).filter((r) => r.status === 'down').length
    const errorRate = errors / data.length

    const sorted = [...latencies].sort((a, b) => a - b)
    const pct = (p: number) => sorted[Math.floor(p * sorted.length)] ?? 0

    return {
      p50:       pct(0.50),
      p95:       pct(0.95),
      p99:       pct(0.99),
      errorRate: Math.round(errorRate * 10000) / 10000,
    }
  }

  // ==========================================================================
  // CHECK SINGLE SERVICE
  // ==========================================================================

  async function checkService(
    service: string,
    pingFn:  () => Promise<boolean>,
  ): Promise<ServiceHealth> {
    const start = Date.now()
    let ok    = false
    let error = false

    try {
      ok = await Promise.race([
        pingFn(),
        new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5_000)),
      ])
    } catch {
      error = true
    }

    const latencyMs  = Date.now() - start
    const stats      = await getLatencyStats(service)
    const status: ServiceStatus = error ? 'down' : ok ? 'up' : 'degraded'

    await db.from('uptime_checks').insert({
      service,
      status,
      latency_ms:  latencyMs,
      checked_at:  new Date().toISOString(),
    })

    return {
      service,
      status,
      latencyMs,
      errorRatePct: stats ? Math.round(stats.errorRate * 100 * 100) / 100 : null,
      p50Ms:        stats?.p50 ?? null,
      p95Ms:        stats?.p95 ?? null,
      p99Ms:        stats?.p99 ?? null,
      checkedAt:    new Date().toISOString(),
    }
  }

  // ==========================================================================
  // FULL SYSTEM HEALTH CHECK
  // ==========================================================================

  async function checkHealth(): Promise<SystemHealth> {
    const now = new Date().toISOString()

    // Check Supabase DB connectivity
    const dbHealth = await checkService('supabase_db', async () => {
      const { error } = await db.from('profiles').select('id', { count: 'exact', head: true }).limit(1)
      return !error
    })

    // Check queue depth
    const { count: queueCount } = await db
      .from('queue_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: dlqCount } = await db
      .from('dead_letter_queue')
      .select('id', { count: 'exact', head: true })
      .eq('is_reviewed', false)

    // Snapshot freshness
    const [rmPipeline, rmFinance, rmAgents] = await Promise.all([
      db.from('rm_pipeline').select('projected_at').order('projected_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('rm_finance').select('projected_at').order('projected_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('rm_agent_scores').select('projected_at').order('projected_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    const freshness = (row: { projected_at?: string } | null) =>
      row?.projected_at
        ? Math.floor((Date.now() - new Date(row.projected_at).getTime()) / 1000)
        : null

    // Active alerts
    const { count: alertCount } = await db
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('is_resolved', false)
      .eq('severity', 'critical')

    // Aggregate service health
    const services: ServiceHealth[] = [dbHealth]
    const allUp = services.every((s) => s.status === 'up')
    const anyDown = services.some((s) => s.status === 'down')

    const overall: ServiceStatus = anyDown ? 'down' : allUp ? 'up' : 'degraded'

    const health: SystemHealth = {
      overall,
      services,
      queueDepth:  queueCount ?? 0,
      dlqDepth:    dlqCount ?? 0,
      snapshotFreshness: {
        rmPipeline: freshness(rmPipeline.data as { projected_at?: string } | null),
        rmFinance:  freshness(rmFinance.data  as { projected_at?: string } | null),
        rmAgents:   freshness(rmAgents.data   as { projected_at?: string } | null),
      },
      activeAlerts: alertCount ?? 0,
      checkedAt:    now,
    }

    await emitAlertIfDegraded(health)

    return health
  }

  // ==========================================================================
  // ALERT ON DEGRADED STATE
  // ==========================================================================

  async function emitAlertIfDegraded(health: SystemHealth): Promise<void> {
    if (health.overall === 'down') {
      await db.from('alerts').insert({
        severity:       'critical',
        entity_type:    'cash',
        message:        'System degraded: database connectivity issue detected',
        action_required: true,
        dedup_key:      `system.down:${new Date().toISOString().split('T')[0]}`,
      })
    }

    // Alert on stale snapshots
    const { rmFinance, rmPipeline } = health.snapshotFreshness
    if (rmFinance && rmFinance > 600) {
      await db.from('alerts').insert({
        severity:       'medium',
        entity_type:    'forecast',
        message:        `Finance snapshot stale: ${Math.round(rmFinance / 60)}m old (SLO: 10m)`,
        action_required: false,
        dedup_key:      `snapshot.stale.finance:${new Date().toISOString().split('T')[0]}`,
      })
    }

    if (rmPipeline && rmPipeline > 300) {
      await db.from('alerts').insert({
        severity:       'medium',
        entity_type:    'deal',
        message:        `Pipeline snapshot stale: ${Math.round(rmPipeline / 60)}m old (SLO: 5m)`,
        action_required: false,
        dedup_key:      `snapshot.stale.pipeline:${new Date().toISOString().split('T')[0]}`,
      })
    }

    // Alert on DLQ build-up
    if (health.dlqDepth > 5) {
      await db.from('alerts').insert({
        severity:       'critical',
        entity_type:    'deal',
        message:        `${health.dlqDepth} jobs in dead-letter queue — manual review required`,
        action_required: true,
        dedup_key:      `dlq.buildup:${new Date().toISOString().split('T')[0]}`,
      })
    }
  }

  return {
    checkHealth,
    checkService,
    recordMetrics,
    getLatencyStats,
    emitAlertIfDegraded,
  }
}
