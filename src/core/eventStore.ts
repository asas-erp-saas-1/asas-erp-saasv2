// src/core/eventStore.ts
// Event Sourcing engine — immutable event stream, aggregate snapshots, versioned replay
// CRITICAL: All domain state changes go through here — never direct DB updates

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Logger } from '@/lib/observability'
import { createConsoleLogger } from '@/core/eventBus'

// =============================================================================
// TYPES
// =============================================================================

export type AggregateType = 'deal' | 'lead' | 'payment' | 'commission' | 'agent'

export interface StoredEvent {
  id:              string
  aggregateId:     string
  aggregateType:   AggregateType
  eventType:       string
  eventVersion:    number      // schema version — for upcasting
  sequenceNumber:  bigint
  payload:         Record<string, unknown>
  metadata:        Record<string, unknown>
  correlationId:   string | null
  causationId:     string | null
  actorId:         string | null
  eventTime:       string
  processedAt:     string
}

export interface AggregateSnapshot {
  aggregateId:        string
  aggregateType:      AggregateType
  snapshotData:       Record<string, unknown>
  lastEventSequence:  bigint
  schemaVersion:      number
  createdAt:          string
}

export interface AppendEventInput {
  aggregateId:    string
  aggregateType:  AggregateType
  eventType:      string
  eventVersion?:  number
  payload:        Record<string, unknown>
  metadata?:      Record<string, unknown>
  correlationId?: string
  causationId?:   string
  actorId?:       string
  idempotencyKey?: string
}

// =============================================================================
// UPCASTER REGISTRY — schema evolution without breaking replay
// =============================================================================

export type UpcastFunction = (payload: Record<string, unknown>) => Record<string, unknown>

// Map<eventType, Map<fromVersion, upcaster>>
export type UpcasterRegistry = Map<string, Map<number, UpcastFunction>>

// =============================================================================
// EVENT STORE CONFIG
// =============================================================================

export interface EventStoreConfig {
  snapshotInterval:  number    // take snapshot every N events
  replayBatchSize:   number    // events per replay batch
  maxReplayEvents:   number    // safety limit for single replay run
}

export const DEFAULT_EVENT_STORE_CONFIG: EventStoreConfig = {
  snapshotInterval: 50,
  replayBatchSize:  100,
  maxReplayEvents:  10_000,
}

// =============================================================================
// EVENT STORE FACTORY
// =============================================================================

export interface EventStoreInstance {
  append:            (input: AppendEventInput) => Promise<StoredEvent>
  appendBatch:       (inputs: AppendEventInput[]) => Promise<StoredEvent[]>
  getEvents:         (aggregateId: string, aggregateType: AggregateType, afterSequence?: bigint) => Promise<StoredEvent[]>
  getLatestSnapshot: (aggregateId: string, aggregateType: AggregateType) => Promise<AggregateSnapshot | null>
  saveSnapshot:      (snap: Omit<AggregateSnapshot, 'createdAt'>) => Promise<void>
  replayAggregate:   <T extends Record<string, unknown>>(
    aggregateId: string,
    aggregateType: AggregateType,
    reducer: (state: T | null, event: StoredEvent) => T,
    initialState?: T,
  ) => Promise<T | null>
  getEventsByType:   (eventType: string, limit?: number, afterTime?: string) => Promise<StoredEvent[]>
}

export function createEventStore(
  db: SupabaseClient,
  config: EventStoreConfig = DEFAULT_EVENT_STORE_CONFIG,
  upcasters: UpcasterRegistry = new Map(),
  logger: Logger = createConsoleLogger() as unknown as Logger,
): EventStoreInstance {

  // ==========================================================================
  // UPCAST — transform old event schema to current
  // ==========================================================================

  function upcast(event: StoredEvent): StoredEvent {
    const eventUpcasters = upcasters.get(event.eventType)
    if (!eventUpcasters) return event

    let payload = event.payload
    let version = event.eventVersion

    // Apply upcasters in sequence
    while (eventUpcasters.has(version)) {
      const fn = eventUpcasters.get(version)!
      payload = fn(payload)
      version++
    }

    return { ...event, payload, eventVersion: version, metadata: { ...event.metadata, is_upcasted: version !== event.eventVersion } }
  }

  // ==========================================================================
  // MAP DB ROW → DOMAIN EVENT
  // ==========================================================================

  function mapRowToEvent(row: Record<string, unknown>): StoredEvent {
    return {
      id:             row.id as string,
      aggregateId:    row.aggregate_id as string,
      aggregateType:  row.aggregate_type as AggregateType,
      eventType:      row.event_type as string,
      eventVersion:   Number(row.event_version ?? 1),
      sequenceNumber: BigInt(row.sequence_number as string | number),
      payload:        (row.payload as Record<string, unknown>) ?? {},
      metadata:       (row.metadata as Record<string, unknown>) ?? {},
      correlationId:  row.correlation_id as string | null,
      causationId:    row.causation_id   as string | null,
      actorId:        row.actor_id       as string | null,
      eventTime:      row.event_time     as string,
      processedAt:    row.processed_at   as string,
    }
  }

  // ==========================================================================
  // APPEND SINGLE EVENT
  // ==========================================================================

  async function append(input: AppendEventInput): Promise<StoredEvent> {
    const { data, error } = await db
      .from('event_store')
      .insert({
        aggregate_id:    input.aggregateId,
        aggregate_type:  input.aggregateType,
        event_type:      input.eventType,
        event_version:   input.eventVersion ?? 1,
        payload:         input.payload,
        metadata:        input.metadata ?? {},
        correlation_id:  input.correlationId ?? null,
        causation_id:    input.causationId   ?? null,
        actor_id:        input.actorId        ?? null,
        idempotency_key: input.idempotencyKey ?? null,
        event_time:      new Date().toISOString(),
        processed_at:    new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Idempotency key already exists — return existing event
        const { data: existing } = await db
          .from('event_store')
          .select()
          .eq('idempotency_key', input.idempotencyKey ?? '')
          .single()
        if (existing) return mapRowToEvent(existing as Record<string, unknown>)
      }
      throw new Error(`EventStore.append failed: ${error.message}`)
    }

    const event = mapRowToEvent(data as Record<string, unknown>)

    // Check if snapshot needed (every N events)
    await checkSnapshotThreshold(input.aggregateId, input.aggregateType, event.sequenceNumber)

    return event
  }

  // ==========================================================================
  // APPEND BATCH
  // ==========================================================================

  async function appendBatch(inputs: AppendEventInput[]): Promise<StoredEvent[]> {
    if (inputs.length === 0) return []

    const rows = inputs.map((input) => ({
      aggregate_id:    input.aggregateId,
      aggregate_type:  input.aggregateType,
      event_type:      input.eventType,
      event_version:   input.eventVersion ?? 1,
      payload:         input.payload,
      metadata:        input.metadata ?? {},
      correlation_id:  input.correlationId ?? null,
      causation_id:    input.causationId   ?? null,
      actor_id:        input.actorId        ?? null,
      idempotency_key: input.idempotencyKey ?? null,
      event_time:      new Date().toISOString(),
      processed_at:    new Date().toISOString(),
    }))

    const { data, error } = await db
      .from('event_store')
      .insert(rows)
      .select()

    if (error) throw new Error(`EventStore.appendBatch failed: ${error.message}`)

    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToEvent)
  }

  // ==========================================================================
  // GET EVENTS FOR AGGREGATE (cursor-based — never load full stream into memory)
  // ==========================================================================

  async function getEvents(
    aggregateId:    string,
    aggregateType:  AggregateType,
    afterSequence?: bigint,
  ): Promise<StoredEvent[]> {
    let query = db
      .from('event_store')
      .select()
      .eq('aggregate_id',   aggregateId)
      .eq('aggregate_type', aggregateType)
      .order('sequence_number', { ascending: true })
      .limit(config.maxReplayEvents)

    if (afterSequence !== undefined) {
      query = query.gt('sequence_number', afterSequence.toString())
    }

    const { data, error } = await query
    if (error) throw new Error(`EventStore.getEvents failed: ${error.message}`)

    return ((data ?? []) as Record<string, unknown>[])
      .map(mapRowToEvent)
      .map(upcast)
  }

  // ==========================================================================
  // GET LATEST SNAPSHOT
  // ==========================================================================

  async function getLatestSnapshot(
    aggregateId:   string,
    aggregateType: AggregateType,
  ): Promise<AggregateSnapshot | null> {
    const { data, error } = await db
      .from('event_snapshots')
      .select()
      .eq('aggregate_id',   aggregateId)
      .eq('aggregate_type', aggregateType)
      .order('last_event_sequence', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null

    const row = data as Record<string, unknown>
    return {
      aggregateId:       row.aggregate_id as string,
      aggregateType:     row.aggregate_type as AggregateType,
      snapshotData:      row.snapshot_data as Record<string, unknown>,
      lastEventSequence: BigInt(row.last_event_sequence as string | number),
      schemaVersion:     Number(row.schema_version ?? 1),
      createdAt:         row.created_at as string,
    }
  }

  // ==========================================================================
  // SAVE SNAPSHOT
  // ==========================================================================

  async function saveSnapshot(
    snap: Omit<AggregateSnapshot, 'createdAt'>,
  ): Promise<void> {
    const { error } = await db
      .from('event_snapshots')
      .upsert({
        aggregate_id:       snap.aggregateId,
        aggregate_type:     snap.aggregateType,
        snapshot_data:      snap.snapshotData,
        last_event_sequence: snap.lastEventSequence.toString(),
        schema_version:     snap.schemaVersion ?? 1,
      }, { onConflict: 'aggregate_id,aggregate_type' })

    if (error) throw new Error(`EventStore.saveSnapshot failed: ${error.message}`)
  }

  // ==========================================================================
  // CHECK IF SNAPSHOT NEEDED
  // ==========================================================================

  async function checkSnapshotThreshold(
    aggregateId:    string,
    aggregateType:  AggregateType,
    latestSequence: bigint,
  ): Promise<void> {
    const snap = await getLatestSnapshot(aggregateId, aggregateType)
    const lastSnapshotSeq = snap?.lastEventSequence ?? BigInt(0)
    const eventsSinceSnap = Number(latestSequence - lastSnapshotSeq)

    if (eventsSinceSnap >= config.snapshotInterval) {
      // Emit a signal — actual snapshot creation is done by the aggregate
      // reducer in replayAggregate() or by the calling service
      logger.info(
        'eventStore',
        'snapshot.threshold_reached',
        { aggregateId, aggregateType, eventsSinceSnap, snapshotInterval: config.snapshotInterval },
      )
    }
  }

  // ==========================================================================
  // REPLAY AGGREGATE — apply events to build current state
  // ==========================================================================

  async function replayAggregate<T extends Record<string, unknown>>(
    aggregateId:   string,
    aggregateType: AggregateType,
    reducer:       (state: T | null, event: StoredEvent) => T,
    initialState?: T,
  ): Promise<T | null> {
    // Load latest snapshot (skip full replay from event 1)
    const snapshot = await getLatestSnapshot(aggregateId, aggregateType)

    let state: T | null = snapshot
      ? (snapshot.snapshotData as T)
      : (initialState ?? null)

    const afterSequence = snapshot?.lastEventSequence

    // Batch-load events after snapshot
    let batchCursor = afterSequence
    let totalReplayed = 0

    while (true) {
      let query = db
        .from('event_store')
        .select()
        .eq('aggregate_id',   aggregateId)
        .eq('aggregate_type', aggregateType)
        .order('sequence_number', { ascending: true })
        .limit(config.replayBatchSize)

      if (batchCursor !== undefined) {
        query = query.gt('sequence_number', batchCursor.toString())
      }

      const { data, error } = await query
      if (error) throw new Error(`EventStore.replay query failed: ${error.message}`)

      const events = ((data ?? []) as Record<string, unknown>[])
        .map(mapRowToEvent)
        .map(upcast)

      if (events.length === 0) break

      // Apply events via reducer
      for (const event of events) {
        state = reducer(state, event)
        totalReplayed++
      }

      batchCursor = events[events.length - 1]!.sequenceNumber

      if (events.length < config.replayBatchSize) break
      if (totalReplayed >= config.maxReplayEvents) {
        logger.warn('eventStore', 'replay.limit_reached', { aggregateId, totalReplayed })
        break
      }
    }

    logger.info('eventStore', 'replay.complete', {
      aggregateId,
      aggregateType,
      totalReplayed,
      hadSnapshot: !!snapshot,
    })

    return state
  }

  // ==========================================================================
  // GET EVENTS BY TYPE (for projection handlers, learning engine)
  // ==========================================================================

  async function getEventsByType(
    eventType: string,
    limit     = 100,
    afterTime?: string,
  ): Promise<StoredEvent[]> {
    let query = db
      .from('event_store')
      .select()
      .eq('event_type', eventType)
      .order('event_time', { ascending: false })
      .limit(limit)

    if (afterTime) {
      query = query.gt('event_time', afterTime)
    }

    const { data, error } = await query
    if (error) throw new Error(`EventStore.getEventsByType failed: ${error.message}`)

    return ((data ?? []) as Record<string, unknown>[])
      .map(mapRowToEvent)
      .map(upcast)
  }

  return {
    append,
    appendBatch,
    getEvents,
    getLatestSnapshot,
    saveSnapshot,
    replayAggregate,
    getEventsByType,
  }
}
