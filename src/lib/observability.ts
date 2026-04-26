// src/lib/observability.ts
// Structured logging, distributed tracing, circuit breaker
// EDGE COMPATIBLE — no Node.js APIs

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// TRACE CONTEXT (W3C-compatible)
// =============================================================================

export interface TraceContext {
  traceId:  string
  spanId:   string
  parentSpanId?: string
}

// Edge-compatible UUID v4 generation
function generateId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

export function createTraceContext(parent?: TraceContext): TraceContext {
  return {
    traceId:      parent?.traceId ?? generateId(),
    spanId:       generateId(),
    parentSpanId: parent?.spanId,
  }
}

// =============================================================================
// STRUCTURED LOG ENTRY
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level:          LogLevel
  timestamp:      string
  service:        string
  action:         string
  correlationId?: string
  causationId?:   string
  actorId?:       string
  durationMs?:    number
  // Sanitized payload — NO PII, NO raw financial data
  payload:        Record<string, unknown>
  error?: {
    code:     string
    message:  string
    stack?:   string
  }
  traceId?:       string
  spanId?:        string
}

// =============================================================================
// LOGGER IMPLEMENTATION
// =============================================================================

export interface Logger {
  debug: (service: string, action: string, payload?: Record<string, unknown>, ctx?: Partial<LogEntry>) => void
  info:  (service: string, action: string, payload?: Record<string, unknown>, ctx?: Partial<LogEntry>) => void
  warn:  (service: string, action: string, payload?: Record<string, unknown>, ctx?: Partial<LogEntry>) => void
  error: (service: string, action: string, error: unknown, payload?: Record<string, unknown>, ctx?: Partial<LogEntry>) => void
  child: (service: string, defaults: Partial<LogEntry>) => Logger
  flush: () => Promise<void>
}

export interface LoggerConfig {
  service:        string
  minLevel:       LogLevel
  shipToSupabase: boolean
  batchSize:      number
  flushIntervalMs: number
}

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  service:        'asas-core',
  minLevel:       'info',
  shipToSupabase: true,
  batchSize:      50,
  flushIntervalMs: 5_000,
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export function createLogger(
  db: SupabaseClient,
  config: LoggerConfig = DEFAULT_LOGGER_CONFIG,
  defaults: Partial<LogEntry> = {},
): Logger {
  // Buffer: flush in batches to avoid N+1 DB writes per log call
  const buffer: LogEntry[] = []
  let flushScheduled = false

  function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[config.minLevel]
  }

  function sanitize(payload: Record<string, unknown>): Record<string, unknown> {
    // Remove known sensitive keys
    const SENSITIVE = new Set(['password', 'token', 'secret', 'api_key', 'ssn', 'credit_card', 'card_number'])
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(payload)) {
      if (SENSITIVE.has(k.toLowerCase())) {
        clean[k] = '[REDACTED]'
      } else if (typeof v === 'number' && k.toLowerCase().includes('amount')) {
        // Redact exact monetary amounts in debug logs
        clean[k] = '[AMOUNT]'
      } else {
        clean[k] = v
      }
    }
    return clean
  }

  function buildEntry(
    level: LogLevel,
    service: string,
    action: string,
    payload: Record<string, unknown> = {},
    ctx: Partial<LogEntry> = {},
    error?: unknown,
  ): LogEntry {
    const entry: LogEntry = {
      level,
      timestamp:      new Date().toISOString(),
      service:        ctx.service ?? service,
      action,
      correlationId:  ctx.correlationId ?? defaults.correlationId,
      causationId:    ctx.causationId   ?? defaults.causationId,
      actorId:        ctx.actorId       ?? defaults.actorId,
      durationMs:     ctx.durationMs,
      traceId:        ctx.traceId       ?? defaults.traceId,
      spanId:         ctx.spanId        ?? defaults.spanId,
      payload:        sanitize({ ...defaults.payload, ...payload }),
    }

    if (error !== undefined) {
      const e = error instanceof Error ? error : new Error(String(error))
      entry.error = {
        code:    (error as { code?: string })?.code ?? 'UNKNOWN',
        message: e.message,
        stack:   process.env.NODE_ENV !== 'production' ? e.stack : undefined,
      }
    }

    return entry
  }

  async function flushBuffer(): Promise<void> {
    if (buffer.length === 0) return

    const batch = buffer.splice(0, config.batchSize)

    if (config.shipToSupabase && batch.length > 0) {
      try {
        await db.from('structured_logs').insert(
          batch.map((e) => ({
            level:          e.level,
            service:        e.service,
            action:         e.action,
            correlation_id: e.correlationId ?? null,
            causation_id:   e.causationId   ?? null,
            actor_id:       e.actorId        ?? null,
            duration_ms:    e.durationMs     ?? null,
            payload:        e.payload,
            error_code:     e.error?.code    ?? null,
            error_message:  e.error?.message ?? null,
            trace_id:       e.traceId        ?? null,
            span_id:        e.spanId         ?? null,
            event_time:     e.timestamp,
          }))
        )
      } catch {
        // Log shipping failure — fallback to console
        console.error('[logger] Failed to ship logs to Supabase, count:', batch.length)
      }
    }
  }

  function scheduleFlush(): void {
    if (flushScheduled) return
    flushScheduled = true
    // Edge-compatible: use Promise.resolve to defer (not setTimeout)
    Promise.resolve().then(async () => {
      flushScheduled = false
      await flushBuffer()
    })
  }

  function log(
    level: LogLevel,
    service: string,
    action: string,
    payload: Record<string, unknown> = {},
    ctx: Partial<LogEntry> = {},
    error?: unknown,
  ): void {
    if (!shouldLog(level)) return

    const entry = buildEntry(level, service, action, payload, ctx, error)

    // Always console-log in development
    if (process.env.NODE_ENV !== 'production') {
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
      fn(JSON.stringify(entry))
    }

    buffer.push(entry)
    scheduleFlush()
  }

  function child(service: string, childDefaults: Partial<LogEntry>): Logger {
    return createLogger(db, { ...config, service }, { ...defaults, ...childDefaults })
  }

  return {
    debug: (s, a, p, c) => log('debug', s, a, p, c),
    info:  (s, a, p, c) => log('info',  s, a, p, c),
    warn:  (s, a, p, c) => log('warn',  s, a, p, c),
    error: (s, a, err, p, c) => log('error', s, a, p, c, err),
    child,
    flush: flushBuffer,
  }
}

// =============================================================================
// TIMED SPAN — wraps an operation with automatic duration tracking
// =============================================================================

export async function withSpan<T>(
  logger: Logger,
  service: string,
  action: string,
  fn: () => Promise<T>,
  ctx: Partial<LogEntry> = {},
): Promise<T> {
  const start = Date.now()
  logger.info(service, `${action}.start`, {}, ctx)

  try {
    const result = await fn()
    const durationMs = Date.now() - start
    logger.info(service, `${action}.complete`, {}, { ...ctx, durationMs })
    return result
  } catch (err) {
    const durationMs = Date.now() - start
    logger.error(service, `${action}.failed`, err, {}, { ...ctx, durationMs })
    throw err
  }
}

// =============================================================================
// CIRCUIT BREAKER (state machine: closed → open → half-open → closed)
// =============================================================================

export type CircuitState = 'closed' | 'open' | 'half_open'

export interface CircuitBreakerConfig {
  failureThreshold:  number    // consecutive failures before opening
  resetTimeoutMs:    number    // time in open state before half-open probe
  probeBatchSize:    number    // how many probes in half-open (default: 1)
  name:              string    // identifier for logging
}

export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs:   30_000,
  probeBatchSize:   1,
  name:             'default',
}

export interface CircuitBreaker {
  execute:   <T>(fn: () => Promise<T>) => Promise<T>
  getState:  () => CircuitState
  getStats:  () => { failures: number; successes: number; state: CircuitState }
  reset:     () => void
}

export class CircuitOpenError extends Error {
  public readonly code = 'CIRCUIT_OPEN'
  constructor(circuitName: string) {
    super(`Circuit breaker "${circuitName}" is OPEN — request rejected`)
    this.name = 'CircuitOpenError'
  }
}

export function createCircuitBreaker(
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG,
  logger?: Pick<Logger, 'warn' | 'info'>,
): CircuitBreaker {
  let state: CircuitState = 'closed'
  let failures = 0
  let successes = 0
  let openedAt: number | null = null
  let probeCount = 0

  function getState(): CircuitState { return state }
  function getStats() { return { failures, successes, state } }

  function onSuccess(): void {
    failures = 0
    if (state === 'half_open') {
      probeCount++
      if (probeCount >= config.probeBatchSize) {
        state = 'closed'
        probeCount = 0
        logger?.info('circuitBreaker', 'circuit.closed', { name: config.name })
      }
    }
    successes++
  }

  function onFailure(): void {
    failures++
    if (state === 'half_open') {
      // Probe failed → reopen
      state = 'open'
      openedAt = Date.now()
      probeCount = 0
      logger?.warn('circuitBreaker', 'circuit.reopened', { name: config.name, failures })
    } else if (state === 'closed' && failures >= config.failureThreshold) {
      state = 'open'
      openedAt = Date.now()
      logger?.warn('circuitBreaker', 'circuit.opened', { name: config.name, failures })
    }
  }

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should transition from open → half_open
    if (state === 'open') {
      const elapsed = Date.now() - (openedAt ?? 0)
      if (elapsed >= config.resetTimeoutMs) {
        state = 'half_open'
        logger?.info('circuitBreaker', 'circuit.half_open', { name: config.name })
      } else {
        throw new CircuitOpenError(config.name)
      }
    }

    try {
      const result = await fn()
      onSuccess()
      return result
    } catch (err) {
      onFailure()
      throw err
    }
  }

  function reset(): void {
    state = 'closed'
    failures = 0
    successes = 0
    openedAt = null
    probeCount = 0
  }

  return { execute, getState, getStats, reset }
}
