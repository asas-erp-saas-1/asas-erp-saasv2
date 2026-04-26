// src/services/queueService.ts
// Production PostgreSQL queue — no in-memory state (serverless compatible)
// All queue infrastructure lives in Supabase

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Logger } from '@/lib/observability'
import { createConsoleLogger } from '@/core/eventBus'

// =============================================================================
// TYPES
// =============================================================================

export type QueuePriority = 'p0_critical' | 'p1_high' | 'p2_normal'
export type JobStatus     = 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'

// Priority tiers — P0 never shed, P2 shed first
export const PRIORITY_TIERS = {
  P0: 'p0_critical' as const,   // finance writes, audit logs, security events
  P1: 'p1_high'     as const,   // deal updates, commission records
  P2: 'p2_normal'   as const,   // learning updates, forecast reruns, snapshots
}

export interface QueueJob {
  id:              string
  jobType:         string
  priority:        QueuePriority
  payload:         Record<string, unknown>
  status:          JobStatus
  attempts:        number
  maxAttempts:     number
  nextRetryAt:     string
  scheduledFor:    string
  lastError:       string | null
  result:          Record<string, unknown> | null
  idempotencyKey:  string | null
  startedAt:       string | null
  completedAt:     string | null
  createdAt:       string
}

export interface EnqueueInput {
  jobType:         string
  priority?:       QueuePriority
  payload:         Record<string, unknown>
  idempotencyKey?: string
  scheduledFor?:   Date
  maxAttempts?:    number
}

export interface JobHandler {
  (job: QueueJob): Promise<Record<string, unknown>>
}

export interface ProcessResult {
  claimed:   number
  succeeded: number
  failed:    number
  dlq:       number
  skipped:   number   // load-shedded
}

// =============================================================================
// QUEUE CONFIG
// =============================================================================

export interface QueueServiceConfig {
  batchSize:            number
  baseDelayMs:          number     // base for exponential backoff
  maxDelayMs:           number     // cap on retry delay
  jitterMs:             number     // randomization on retry delay
  queueShedThreshold:   number     // queue depth above which P2 shed
  p0JobTypes:           string[]   // always accept
  p1JobTypes:           string[]   // accept unless critical overload
}

export const DEFAULT_QUEUE_CONFIG: QueueServiceConfig = {
  batchSize:            5,
  baseDelayMs:          30_000,    // 30s base
  maxDelayMs:           3_600_000, // 1h max
  jitterMs:             5_000,
  queueShedThreshold:   200,       // > 200 pending → shed P2
  p0JobTypes:           [
    'finance.write',
    'audit.log',
    'security.event',
    'alert.create',
  ],
  p1JobTypes:           [
    'deal.update',
    'commission.record',
    'deal.close',
    'payment.register',
  ],
}

// =============================================================================
// QUEUE SERVICE FACTORY
// =============================================================================

export interface QueueServiceInstance {
  enqueue:           (input: EnqueueInput) => Promise<string>
  enqueueBatch:      (inputs: EnqueueInput[]) => Promise<string[]>
  processJobs:       (handlers: Map<string, JobHandler>) => Promise<ProcessResult>
  getQueueDepth:     () => Promise<Record<QueuePriority | 'total', number>>
  retryFailed:       () => Promise<number>
  getDLQJobs:        (limit?: number) => Promise<QueueJob[]>
  replayDLQJob:      (jobId: string) => Promise<void>
  checkRateLimit:    (userId: string, action: string, limit: number) => Promise<boolean>
}

export function createQueueService(
  db:     SupabaseClient,
  config: QueueServiceConfig = DEFAULT_QUEUE_CONFIG,
  logger: Logger = createConsoleLogger() as unknown as Logger,
): QueueServiceInstance {

  // ==========================================================================
  // BACKOFF CALCULATION
  // attempts 0 → 30s
  // attempts 1 → 60s + jitter
  // attempts 2 → 120s + jitter
  // attempts 3 → 240s + jitter
  // attempts 4 → 480s + jitter (capped at maxDelay)
  // ==========================================================================

  function computeNextRetryAt(attempts: number): Date {
    const jitter = Math.floor(Math.random() * config.jitterMs)
    const delay  = Math.min(
      config.maxDelayMs,
      config.baseDelayMs * Math.pow(2, attempts) + jitter,
    )
    return new Date(Date.now() + delay)
  }

  // ==========================================================================
  // ENQUEUE
  // ==========================================================================

  async function enqueue(input: EnqueueInput): Promise<string> {
    const priority = input.priority ?? PRIORITY_TIERS.P2

    // Determine actual priority from jobType if not specified
    const resolvedPriority: QueuePriority = input.priority
      ?? (config.p0JobTypes.includes(input.jobType) ? PRIORITY_TIERS.P0
        : config.p1JobTypes.includes(input.jobType) ? PRIORITY_TIERS.P1
        : PRIORITY_TIERS.P2)

    const { data, error } = await db
      .from('queue_jobs')
      .insert({
        job_type:        input.jobType,
        priority:        resolvedPriority,
        payload:         input.payload,
        status:          'pending',
        attempts:        0,
        max_attempts:    input.maxAttempts ?? 5,
        scheduled_for:   (input.scheduledFor ?? new Date()).toISOString(),
        next_retry_at:   (input.scheduledFor ?? new Date()).toISOString(),
        idempotency_key: input.idempotencyKey ?? null,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        // Idempotency key exists — return existing job ID
        const { data: existing } = await db
          .from('queue_jobs')
          .select('id')
          .eq('idempotency_key', input.idempotencyKey ?? '')
          .single()
        return existing?.id as string ?? ''
      }
      throw new Error(`Queue.enqueue failed: ${error.message}`)
    }

    const jobId = (data as { id: string }).id

    logger.info('queueService', 'job.enqueued', {
      jobType:  input.jobType,
      priority: resolvedPriority,
      jobId,
    })

    return jobId
  }

  // ==========================================================================
  // ENQUEUE BATCH
  // ==========================================================================

  async function enqueueBatch(inputs: EnqueueInput[]): Promise<string[]> {
    const rows = inputs.map((input) => ({
      job_type:        input.jobType,
      priority:        input.priority ?? PRIORITY_TIERS.P2,
      payload:         input.payload,
      status:          'pending',
      attempts:        0,
      max_attempts:    input.maxAttempts ?? 5,
      scheduled_for:   (input.scheduledFor ?? new Date()).toISOString(),
      next_retry_at:   (input.scheduledFor ?? new Date()).toISOString(),
      idempotency_key: input.idempotencyKey ?? null,
    }))

    const { data, error } = await db
      .from('queue_jobs')
      .insert(rows)
      .select('id')

    if (error) throw new Error(`Queue.enqueueBatch failed: ${error.message}`)

    return ((data ?? []) as Array<{ id: string }>).map((r) => r.id)
  }

  // ==========================================================================
  // PROCESS JOBS (atomic claim via FOR UPDATE SKIP LOCKED)
  // ==========================================================================

  async function processJobs(handlers: Map<string, JobHandler>): Promise<ProcessResult> {
    const result: ProcessResult = { claimed: 0, succeeded: 0, failed: 0, dlq: 0, skipped: 0 }

    // Load shedding check
    const depth = await getQueueDepth()
    const shouldShedP2 = depth.total > config.queueShedThreshold

    if (shouldShedP2) {
      logger.warn('queueService', 'load.shedding', { queueDepth: depth.total, threshold: config.queueShedThreshold })
    }

    // Claim jobs (priority order: P0 → P1 → P2)
    const { data: claimedData, error: claimErr } = await db.rpc('fn_claim_queue_jobs', {
      p_batch_size: config.batchSize,
      p_worker_id:  'vercel-worker',
    })

    if (claimErr) {
      logger.error('queueService', 'claim.failed', claimErr, {})
      return result
    }

    const jobs: QueueJob[] = ((claimedData ?? []) as Record<string, unknown>[]).map(mapRowToJob)
    result.claimed = jobs.length

    for (const job of jobs) {
      // Skip P2 jobs under load shedding
      if (shouldShedP2 && job.priority === PRIORITY_TIERS.P2) {
        // Re-queue the job as pending
        await db
          .from('queue_jobs')
          .update({ status: 'pending', next_retry_at: new Date(Date.now() + 60_000).toISOString() })
          .eq('id', job.id)
        result.skipped++
        continue
      }

      const handler = handlers.get(job.jobType)

      if (!handler) {
        logger.warn('queueService', 'job.no_handler', { jobType: job.jobType, jobId: job.id })
        await db
          .from('queue_jobs')
          .update({ status: 'pending' })
          .eq('id', job.id)
        continue
      }

      try {
        const jobResult = await handler(job)

        // Mark completed
        await db
          .from('queue_jobs')
          .update({
            status:       'completed',
            result:       jobResult,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id)

        result.succeeded++

        logger.info('queueService', 'job.completed', { jobType: job.jobType, jobId: job.id })

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        const attempts = job.attempts

        if (attempts >= job.maxAttempts) {
          // Move to DLQ
          await db.rpc('fn_move_to_dlq', { p_job_id: job.id, p_reason: errMsg })
          result.dlq++

          logger.error('queueService', 'job.dlq', err, {
            jobType:  job.jobType,
            jobId:    job.id,
            attempts,
          })
        } else {
          // Reschedule with exponential backoff
          const nextRetry = computeNextRetryAt(attempts)

          await db
            .from('queue_jobs')
            .update({
              status:         'pending',
              last_error:     errMsg,
              next_retry_at:  nextRetry.toISOString(),
            })
            .eq('id', job.id)

          result.failed++

          logger.warn('queueService', 'job.failed_retry', {
            jobType:   job.jobType,
            jobId:     job.id,
            attempts,
            nextRetry: nextRetry.toISOString(),
          })
        }
      }
    }

    return result
  }

  // ==========================================================================
  // GET QUEUE DEPTH
  // ==========================================================================

  async function getQueueDepth(): Promise<Record<QueuePriority | 'total', number>> {
    const { data } = await db
      .from('queue_jobs')
      .select('priority')
      .eq('status', 'pending')

    const rows = (data ?? []) as Array<{ priority: QueuePriority }>
    const counts = {
      p0_critical: 0,
      p1_high:     0,
      p2_normal:   0,
      total:       0,
    }

    for (const row of rows) {
      counts[row.priority] = (counts[row.priority] ?? 0) + 1
      counts.total++
    }

    return counts
  }

  // ==========================================================================
  // RETRY FAILED
  // ==========================================================================

  async function retryFailed(): Promise<number> {
    const { data, error } = await db
      .from('queue_jobs')
      .update({
        status:       'pending',
        next_retry_at: new Date().toISOString(),
      })
      .eq('status', 'failed')
      .lt('attempts', 5)
      .select('id')

    if (error) return 0
    return data?.length ?? 0
  }

  // ==========================================================================
  // GET DLQ JOBS
  // ==========================================================================

  async function getDLQJobs(limit = 50): Promise<QueueJob[]> {
    const { data } = await db
      .from('dead_letter_queue')
      .select('*, queue_jobs:original_job_id ( * )')
      .eq('is_reviewed', false)
      .order('failed_at', { ascending: true })
      .limit(limit)

    return ((data ?? []) as Record<string, unknown>[]).map((row) => {
      const job = row.queue_jobs as Record<string, unknown> | null
      if (!job) return null
      return mapRowToJob(job)
    }).filter((j): j is QueueJob => j !== null)
  }

  // ==========================================================================
  // REPLAY DLQ JOB
  // ==========================================================================

  async function replayDLQJob(jobId: string): Promise<void> {
    const { data: dlqEntry } = await db
      .from('dead_letter_queue')
      .select('original_job_id, job_type, payload')
      .eq('original_job_id', jobId)
      .single()

    if (!dlqEntry) throw new Error(`DLQ entry not found for job ${jobId}`)

    const entry = dlqEntry as { original_job_id: string; job_type: string; payload: Record<string, unknown> }

    // Reset original job to pending
    await db
      .from('queue_jobs')
      .update({
        status:         'pending',
        attempts:       0,
        last_error:     null,
        next_retry_at:  new Date().toISOString(),
      })
      .eq('id', entry.original_job_id)

    // Mark DLQ entry as reviewed
    await db
      .from('dead_letter_queue')
      .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('original_job_id', jobId)

    logger.info('queueService', 'dlq.replayed', { jobId, jobType: entry.job_type })
  }

  // ==========================================================================
  // RATE LIMITING (atomic check via RPC)
  // ==========================================================================

  async function checkRateLimit(
    userId: string,
    action: string,
    limit:  number,
  ): Promise<boolean> {
    const { data, error } = await db.rpc('fn_check_rate_limit', {
      p_user_id: userId,
      p_action:  action,
      p_limit:   limit,
    })

    if (error) {
      logger.warn('queueService', 'rate_limit.check_failed', { userId, action, error: error.message })
      return true  // fail open if rate limit check fails (don't block on infra failure)
    }

    const allowed = data as boolean
    if (!allowed) {
      logger.warn('queueService', 'rate_limit.exceeded', { userId, action, limit })
    }

    return allowed
  }

  // ==========================================================================
  // ROW MAPPER
  // ==========================================================================

  function mapRowToJob(row: Record<string, unknown>): QueueJob {
    return {
      id:             row.id as string,
      jobType:        row.job_type as string,
      priority:       row.priority as QueuePriority,
      payload:        (row.payload as Record<string, unknown>) ?? {},
      status:         row.status as JobStatus,
      attempts:       Number(row.attempts ?? 0),
      maxAttempts:    Number(row.max_attempts ?? 5),
      nextRetryAt:    row.next_retry_at as string,
      scheduledFor:   row.scheduled_for as string,
      lastError:      row.last_error as string | null,
      result:         row.result as Record<string, unknown> | null,
      idempotencyKey: row.idempotency_key as string | null,
      startedAt:      row.started_at as string | null,
      completedAt:    row.completed_at as string | null,
      createdAt:      row.created_at as string,
    }
  }

  return {
    enqueue,
    enqueueBatch,
    processJobs,
    getQueueDepth,
    retryFailed,
    getDLQJobs,
    replayDLQJob,
    checkRateLimit,
  }
}
