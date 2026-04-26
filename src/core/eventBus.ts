// src/core/eventBus.ts
// Event Bus — publish/subscribe, batch processing, FOR UPDATE SKIP LOCKED
import type { SupabaseClient } from '@supabase/supabase-js'

export const EVENT_TYPES = {
  DEAL_CREATED:'deal.created',DEAL_ACTIVATED:'deal.activated',DEAL_NEGOTIATION_STARTED:'deal.negotiation_started',
  DEAL_CLOSED:'deal.closed',DEAL_CANCELLED:'deal.cancelled',DEAL_AT_RISK:'deal.at_risk',DEAL_ESCALATED:'deal.escalated',
  LEAD_CREATED:'lead.created',LEAD_CONTACTED:'lead.contacted',LEAD_CONVERTED:'lead.converted',LEAD_LOST:'lead.lost',
  PAYMENT_ADDED:'payment.added',PAYMENT_PAID:'payment.paid',PAYMENT_OVERDUE:'payment.overdue',PAYMENT_REFUNDED:'payment.refunded',
  COMMISSION_AGREED:'commission.agreed',COMMISSION_PAID:'commission.paid',AGENT_ASSIGNED:'agent.assigned',AGENT_REASSIGNED:'agent.reassigned',
  AUTOMATION_TRIGGERED:'automation.triggered',SYSTEM_ERROR:'system.error',
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
export type EventHandler = (event: EventRow) => Promise<void>

export interface EventRow {
  id:string; event_type:EventType; status:string; entity_type:string; entity_id:string;
  triggered_by:string|null; assigned_agent:string|null; payload:Record<string,unknown>;
  metadata:Record<string,unknown>; attempts:number; max_attempts:number; last_error:string|null;
  processed_at:string|null; scheduled_for:string; expires_at:string|null; created_at:string;
}

export interface EventPublishInput {
  eventType:EventType; entityType:string; entityId:string; payload:Record<string,unknown>;
  triggeredBy?:string; assignedAgent?:string; idempotencyKey?:string; correlationId?:string;
  scheduledFor?:Date; expiresAt?:Date; ttlSeconds?:number;
}

export interface BatchResult {
  processed:number; succeeded:number; failed:number; movedToDLQ:number; backpressure:boolean; durationMs:number;
}

export interface QueueDepth { pending:number; processing:number; failed:number; dead_letter:number; total:number; }

export interface EventBusConfig {
  batchSize:number; maxAttempts:number; backpressureThreshold:number;
  retryBaseDelayMs:number; retryMaxDelayMs:number; ttlDefaultSeconds:number; processingTimeoutMs:number; workerId:string;
}

export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
  batchSize:10, maxAttempts:3, backpressureThreshold:500,
  retryBaseDelayMs:30_000, retryMaxDelayMs:3_600_000, ttlDefaultSeconds:86_400, processingTimeoutMs:30_000, workerId:'default-worker',
}

export interface EventBusInstance {
  publish:(input:EventPublishInput)=>Promise<string>;
  subscribe:(eventType:EventType, handler:EventHandler)=>void;
  unsubscribe:(eventType:EventType, handler:EventHandler)=>void;
  processEventsBatch:()=>Promise<BatchResult>;
  claimEvents:()=>Promise<EventRow[]>;
  retryFailed:()=>Promise<number>;
  moveToDLQ:(eventId:string, reason:string)=>Promise<void>;
  getQueueDepth:()=>Promise<QueueDepth>;
  checkBackpressure:()=>Promise<boolean>;
}

export function createConsoleLogger() {
  return {
    info:  (ctx:Record<string,unknown>) => console.log(JSON.stringify({level:'INFO', ...ctx, ts:new Date().toISOString()})),
    warn:  (ctx:Record<string,unknown>) => console.warn(JSON.stringify({level:'WARN', ...ctx, ts:new Date().toISOString()})),
    error: (ctx:Record<string,unknown>) => console.error(JSON.stringify({level:'ERROR',...ctx, ts:new Date().toISOString()})),
    debug: (ctx:Record<string,unknown>) => { if(process.env.NODE_ENV!=='production') console.debug(JSON.stringify({level:'DEBUG',...ctx})) },
  }
}

export class EventBusError extends Error {
  constructor(message:string, public readonly errorClass:'TRANSIENT'|'PERMANENT'|'BUSINESS', public readonly code:string, public readonly cause?:unknown) {
    super(message); this.name='EventBusError';
  }
}

export function classifyError(error:unknown): 'TRANSIENT'|'PERMANENT'|'BUSINESS' {
  if (error instanceof EventBusError) return error.errorClass
  if (!(error instanceof Error)) return 'TRANSIENT'
  const msg = error.message.toLowerCase()
  if (msg.includes('network')||msg.includes('timeout')||msg.includes('503')||msg.includes('connection')) return 'TRANSIENT'
  if (msg.includes('validation')||msg.includes('invalid payload')||msg.includes('schema')) return 'PERMANENT'
  if (msg.includes('state_locked')||msg.includes('invalid_transition')||msg.includes('businessrule')) return 'BUSINESS'
  return 'TRANSIENT'
}

let _instance: EventBusInstance | null = null

export function createEventBus(db:SupabaseClient, config:EventBusConfig=DEFAULT_EVENT_BUS_CONFIG): EventBusInstance {
  const handlers = new Map<EventType, Set<EventHandler>>()
  const logger   = createConsoleLogger()

  function generateKey(input:EventPublishInput): string {
    const base = `${input.eventType}:${input.entityType}:${input.entityId}`
    if (input.idempotencyKey) return `${base}:${input.idempotencyKey}`
    return `${base}:${Math.floor(Date.now()/1000)}`
  }

  async function publish(input:EventPublishInput): Promise<string> {
    const key = generateKey(input)
    const { data: existing } = await db.from('event_bus').select('id,status').filter('metadata->>idempotencyKey','eq',key).not('status','in','("failed","dead_letter")').maybeSingle()
    if (existing) return existing.id as string

    const expiresAt = input.expiresAt ?? new Date(Date.now()+(input.ttlSeconds??config.ttlDefaultSeconds)*1000)
    const { data, error } = await db.from('event_bus').insert({
      event_type:input.eventType, status:'pending', entity_type:input.entityType, entity_id:input.entityId,
      triggered_by:input.triggeredBy??null, assigned_agent:input.assignedAgent??null,
      payload:input.payload, metadata:{version:'v1',idempotencyKey:key,correlationId:input.correlationId??null,sourceService:'asas-core'},
      attempts:0, max_attempts:config.maxAttempts, scheduled_for:(input.scheduledFor??new Date()).toISOString(), expires_at:expiresAt.toISOString(),
    }).select('id').single()

    if (error) {
      if (error.code==='23505') {
        const { data:r } = await db.from('event_bus').select('id').filter('metadata->>idempotencyKey','eq',key).single()
        return r?.id as string ?? ''
      }
      throw new EventBusError(`Failed to publish: ${error.message}`,'TRANSIENT','PUBLISH_FAILED',error)
    }
    logger.info({phase:'publish',eventType:input.eventType,entityId:input.entityId,eventId:(data as {id:string}).id})
    return (data as {id:string}).id
  }

  function subscribe(eventType:EventType, handler:EventHandler) {
    if (!handlers.has(eventType)) handlers.set(eventType, new Set())
    handlers.get(eventType)!.add(handler)
  }

  function unsubscribe(eventType:EventType, handler:EventHandler) {
    handlers.get(eventType)?.delete(handler)
  }

  async function claimEvents(): Promise<EventRow[]> {
    const { data, error } = await db.rpc('fn_claim_events',{p_batch_size:config.batchSize,p_worker_id:config.workerId})
    if (error) throw new EventBusError(`Failed to claim: ${error.message}`,'TRANSIENT','CLAIM_FAILED',error)
    return (data as EventRow[]) ?? []
  }

  async function processEventsBatch(): Promise<BatchResult> {
    const start = Date.now()
    const overloaded = await checkBackpressure()
    if (overloaded) return {processed:0,succeeded:0,failed:0,movedToDLQ:0,backpressure:true,durationMs:Date.now()-start}

    let claimed:EventRow[]
    try { claimed = await claimEvents() } catch { return {processed:0,succeeded:0,failed:0,movedToDLQ:0,backpressure:false,durationMs:Date.now()-start} }
    if (!claimed.length) return {processed:0,succeeded:0,failed:0,movedToDLQ:0,backpressure:false,durationMs:Date.now()-start}

    let succeeded=0, failed=0, dlq=0
    await Promise.allSettled(claimed.map(async event => {
      const hs = handlers.get(event.event_type)
      if (!hs?.size) { await db.rpc('fn_complete_event',{p_event_id:event.id,p_result:{message:'no_handlers'}}); return }
      try {
        for (const h of hs) await h(event)
        await db.rpc('fn_complete_event',{p_event_id:event.id,p_result:{handlers:hs.size}})
        succeeded++
      } catch(err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        const cls = classifyError(err)
        const toDLQ = cls!=='TRANSIENT' || event.attempts >= event.max_attempts
        await db.rpc('fn_fail_event',{p_event_id:event.id,p_error:errMsg,p_to_dlq:toDLQ})
        if(toDLQ) dlq++; else failed++
      }
    }))
    return {processed:claimed.length,succeeded,failed,movedToDLQ:dlq,backpressure:false,durationMs:Date.now()-start}
  }

  async function retryFailed(): Promise<number> {
    const { data } = await db.from('event_bus').update({status:'pending',scheduled_for:new Date().toISOString()}).eq('status','failed').lt('attempts',config.maxAttempts).select('id')
    return data?.length ?? 0
  }

  async function moveToDLQ(eventId:string, reason:string): Promise<void> {
    await db.rpc('fn_fail_event',{p_event_id:eventId,p_error:reason,p_to_dlq:true})
  }

  async function getQueueDepth(): Promise<QueueDepth> {
    const { data } = await db.rpc('fn_queue_depth')
    const rows = (data as Array<{status:string;cnt:number}>) ?? []
    const map = Object.fromEntries(rows.map(r=>[r.status,Number(r.cnt)]))
    return { pending:map['pending']??0, processing:map['processing']??0, failed:map['failed']??0, dead_letter:map['dead_letter']??0, total:Object.values(map).reduce((s,v)=>s+v,0) }
  }

  async function checkBackpressure(): Promise<boolean> {
    const d = await getQueueDepth()
    return d.pending > config.backpressureThreshold
  }

  return {publish,subscribe,unsubscribe,processEventsBatch,claimEvents,retryFailed,moveToDLQ,getQueueDepth,checkBackpressure}
}

export function getEventBus(db:SupabaseClient, config?:Partial<EventBusConfig>): EventBusInstance {
  if (!_instance) _instance = createEventBus(db, {...DEFAULT_EVENT_BUS_CONFIG,...config})
  return _instance
}

export function resetEventBus() { _instance = null }
