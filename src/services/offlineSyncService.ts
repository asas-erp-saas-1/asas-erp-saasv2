// src/services/offlineSyncService.ts
// Offline-first field mode: agents capture data offline, auto-reconcile when online.
// CONFLICT RESOLUTION: last-write-wins (configurable) with manual escalation for critical.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Logger } from '@/lib/observability'
import { createLogger } from '@/lib/observability'

// =============================================================================
// TYPES
// =============================================================================

export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncStatus    = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed'
export type ConflictResolution = 'client_wins' | 'server_wins' | 'merge' | 'pending_manual'

export interface OfflineOperation {
  id:             string
  deviceId:       string
  agentId:        string
  entityType:     string
  entityId:       string | null    // null for new creates
  clientTempId:   string | null    // local temp ID before server UUID
  operation:      SyncOperation
  payload:        Record<string, unknown>
  status:         SyncStatus
  clientVersion:  number
  serverVersion:  number | null
  conflictData:   Record<string, unknown> | null
  capturedAt:     string           // when agent captured offline
  syncedAt:       string | null
  createdAt:      string
}

export interface SyncBatchInput {
  deviceId:  string
  agentId:   string
  operations: Array<{
    tempId:      string         // device-local temp ID
    entityType:  string
    entityId?:   string         // undefined for new creates
    operation:   SyncOperation
    payload:     Record<string, unknown>
    capturedAt:  string
    version:     number
  }>
}

export interface SyncBatchResult {
  synced:     number
  conflicts:  number
  failed:     number
  results:    Array<{
    tempId:       string
    status:       SyncStatus
    serverId?:    string           // assigned server UUID for creates
    conflict?:    Record<string, unknown>
    error?:       string
  }>
}

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

function detectConflict(
  clientPayload:  Record<string, unknown>,
  serverPayload:  Record<string, unknown>,
  clientVersion:  number,
  serverVersion:  number,
): boolean {
  // Version vector conflict: client is behind server
  return serverVersion > clientVersion
}

function mergePayloads(
  client: Record<string, unknown>,
  server: Record<string, unknown>,
): Record<string, unknown> {
  // Field-level last-write-wins merge
  // Server wins on financial fields; client wins on activity/notes fields
  const FINANCIAL_FIELDS = new Set(['agreed_price', 'status', 'agent_id', 'property_id'])
  const merged: Record<string, unknown> = { ...server }

  for (const [key, clientVal] of Object.entries(client)) {
    if (!FINANCIAL_FIELDS.has(key)) {
      // Client wins on non-financial fields (they may have newer activity data)
      merged[key] = clientVal
    }
    // Server wins on financial fields (authoritative)
  }

  return merged
}

// =============================================================================
// SYNC SERVICE FACTORY
// =============================================================================

export interface OfflineSyncServiceInstance {
  enqueueBatch:        (input: SyncBatchInput) => Promise<void>
  processPendingBatch: (deviceId: string, batchSize?: number) => Promise<SyncBatchResult>
  resolveConflict:     (operationId: string, resolution: ConflictResolution, resolvedBy: string) => Promise<void>
  getPendingOperations: (agentId: string) => Promise<OfflineOperation[]>
  getConflicts:        (agentId: string) => Promise<OfflineOperation[]>
  getSyncStatus:       (deviceId: string) => Promise<{ pending: number; conflicts: number; synced: number }>
}

export function createOfflineSyncService(
  db:     SupabaseClient,
  logger: Logger = createLogger(db)
): OfflineSyncServiceInstance {

  // ==========================================================================
  // ENQUEUE BATCH (called when device comes online)
  // ==========================================================================

  async function enqueueBatch(input: SyncBatchInput): Promise<void> {
    if (input.operations.length === 0) return

    const rows = input.operations.map((op) => ({
      device_id:      input.deviceId,
      agent_id:       input.agentId,
      entity_type:    op.entityType,
      entity_id:      op.entityId ?? null,
      client_temp_id: op.tempId,
      operation:      op.operation,
      payload:        op.payload,
      status:         'pending',
      client_version: op.version,
      captured_at:    op.capturedAt,
    }))

    const { error } = await db.from('offline_sync_queue').insert(rows)
    if (error) throw new Error(`Failed to enqueue sync batch: ${error.message}`)

    logger.info('offlineSyncService', 'batch.enqueued', {
      deviceId: input.deviceId,
      agentId:  input.agentId,
      count:    rows.length,
    })
  }

  // ==========================================================================
  // PROCESS PENDING BATCH
  // ==========================================================================

  async function processPendingBatch(
    deviceId:  string,
    batchSize = 20,
  ): Promise<SyncBatchResult> {
    const { data: ops } = await db
      .from('offline_sync_queue')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .order('captured_at', { ascending: true })
      .limit(batchSize)

    const operations = ops ?? []
    const result: SyncBatchResult = {
      synced: 0, conflicts: 0, failed: 0,
      results: [],
    }

    for (const opRow of operations as Record<string, unknown>[]) {
      const op = mapRowToOp(opRow)
      await db.from('offline_sync_queue').update({ status: 'syncing' }).eq('id', op.id)

      try {
        const opResult = await processOperation(op)
        result.results.push({ tempId: op.clientTempId ?? op.id, ...opResult })

        if (opResult.status === 'synced') {
          result.synced++
          await db.from('offline_sync_queue').update({ status: 'synced', synced_at: new Date().toISOString() }).eq('id', op.id)
        } else if (opResult.status === 'conflict') {
          result.conflicts++
          await db.from('offline_sync_queue').update({
            status:        'conflict',
            conflict_data: opResult.conflict ?? null,
          }).eq('id', op.id)
        }
      } catch (err) {
        result.failed++
        const errMsg = err instanceof Error ? err.message : String(err)
        await db.from('offline_sync_queue').update({ status: 'failed' }).eq('id', op.id)
        result.results.push({
          tempId: op.clientTempId ?? op.id,
          status: 'failed',
          error:  errMsg,
        })
        logger.error('offlineSyncService', 'operation.failed', err, { opId: op.id, entityType: op.entityType })
      }
    }

    return result
  }

  async function processOperation(op: OfflineOperation): Promise<{
    status:    SyncStatus
    serverId?: string
    conflict?: Record<string, unknown>
  }> {
    switch (op.operation) {
      case 'create': return await processCreate(op)
      case 'update': return await processUpdate(op)
      case 'delete': return await processDelete(op)
    }
  }

  async function processCreate(op: OfflineOperation): Promise<{ status: SyncStatus; serverId?: string }> {
    const tableName = entityTypeToTable(op.entityType)
    if (!tableName) throw new Error(`Unknown entity type: ${op.entityType}`)

    const { data, error } = await db
      .from(tableName)
      .insert(op.payload)
      .select('id')
      .single()

    if (error) throw new Error(`Create failed: ${error.message}`)

    return { status: 'synced', serverId: (data as { id: string }).id }
  }

  async function processUpdate(op: OfflineOperation): Promise<{ status: SyncStatus; conflict?: Record<string, unknown> }> {
    if (!op.entityId) throw new Error('Update operation missing entityId')

    const tableName = entityTypeToTable(op.entityType)
    if (!tableName) throw new Error(`Unknown entity type: ${op.entityType}`)

    // Fetch current server state for conflict detection
    const { data: server } = await db
      .from(tableName)
      .select('*, updated_at')
      .eq('id', op.entityId)
      .maybeSingle()

    if (!server) throw new Error(`Entity ${op.entityType}:${op.entityId} not found on server`)

    const serverRow     = server as Record<string, unknown>
    const serverVersion = Number(serverRow.version ?? 0)

    // Check for conflict
    if (detectConflict(op.payload, serverRow, op.clientVersion, serverVersion)) {
      const merged  = mergePayloads(op.payload, serverRow)
      const isMinor = isMergeableConflict(op.payload, serverRow)

      if (isMinor) {
        // Auto-merge: apply merged payload
        await db.from(tableName).update(merged).eq('id', op.entityId)

        // Log conflict
        await db.from('sync_conflicts').insert({
          entity_type:    op.entityType,
          entity_id:      op.entityId,
          device_id:      op.deviceId,
          agent_id:       op.agentId,
          client_payload: op.payload,
          server_payload: serverRow,
          resolution:     'merge',
          merged_payload: merged,
          resolved_at:    new Date().toISOString(),
        })

        return { status: 'synced' }
      }

      // Non-trivial conflict — escalate to manual review
      await db.from('sync_conflicts').insert({
        entity_type:    op.entityType,
        entity_id:      op.entityId,
        device_id:      op.deviceId,
        agent_id:       op.agentId,
        client_payload: op.payload,
        server_payload: serverRow,
        resolution:     'pending_manual',
      })

      return {
        status:   'conflict',
        conflict: {
          clientPayload: op.payload,
          serverPayload: serverRow,
          conflictFields: findConflictingFields(op.payload, serverRow),
        },
      }
    }

    // No conflict — apply update
    await db.from(tableName).update({ ...op.payload, updated_at: new Date().toISOString() }).eq('id', op.entityId)
    return { status: 'synced' }
  }

  async function processDelete(op: OfflineOperation): Promise<{ status: SyncStatus }> {
    if (!op.entityId) throw new Error('Delete operation missing entityId')
    const tableName = entityTypeToTable(op.entityType)
    if (!tableName) throw new Error(`Unknown entity type: ${op.entityType}`)

    // Soft delete only
    await db.from(tableName).update({ deleted_at: new Date().toISOString() }).eq('id', op.entityId)
    return { status: 'synced' }
  }

  // ==========================================================================
  // CONFLICT RESOLUTION
  // ==========================================================================

  async function resolveConflict(
    operationId:  string,
    resolution:   ConflictResolution,
    resolvedBy:   string,
  ): Promise<void> {
    const { data: opRow } = await db
      .from('offline_sync_queue')
      .select('*')
      .eq('id', operationId)
      .eq('status', 'conflict')
      .single()

    if (!opRow) throw new Error('Conflict operation not found')

    const op        = mapRowToOp(opRow as Record<string, unknown>)
    const tableName = entityTypeToTable(op.entityType)
    if (!tableName) throw new Error(`Unknown entity type: ${op.entityType}`)

    if (resolution === 'client_wins' && op.entityId) {
      await db.from(tableName).update({ ...op.payload, updated_at: new Date().toISOString() }).eq('id', op.entityId)
    }
    // 'server_wins' — no write needed, server state is already current

    await db.from('offline_sync_queue').update({
      status:                  'synced',
      conflict_resolved_by:    resolution,
      synced_at:               new Date().toISOString(),
    }).eq('id', operationId)

    // Update sync_conflicts record
    await db.from('sync_conflicts').update({
      resolution:  resolution,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    }).eq('entity_id', op.entityId ?? '')
  }

  async function getPendingOperations(agentId: string): Promise<OfflineOperation[]> {
    const { data } = await db
      .from('offline_sync_queue')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .order('captured_at', { ascending: true })
    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToOp)
  }

  async function getConflicts(agentId: string): Promise<OfflineOperation[]> {
    const { data } = await db
      .from('offline_sync_queue')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'conflict')
      .order('captured_at', { ascending: false })
    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToOp)
  }

  async function getSyncStatus(deviceId: string): Promise<{ pending: number; conflicts: number; synced: number }> {
    const { data } = await db
      .from('offline_sync_queue')
      .select('status')
      .eq('device_id', deviceId)

    const rows = (data ?? []) as Array<{ status: string }>
    return {
      pending:   rows.filter((r) => r.status === 'pending').length,
      conflicts: rows.filter((r) => r.status === 'conflict').length,
      synced:    rows.filter((r) => r.status === 'synced').length,
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  function entityTypeToTable(entityType: string): string | null {
    const map: Record<string, string> = {
      lead:     'leads',
      deal:     'deals',
      activity: 'activities',
      client:   'clients',
    }
    return map[entityType] ?? null
  }

  function isMergeableConflict(
    client: Record<string, unknown>,
    server: Record<string, unknown>,
  ): boolean {
    const CRITICAL_FIELDS = new Set(['status', 'agreed_price', 'agent_id', 'property_id', 'client_id'])
    const conflicting = findConflictingFields(client, server)
    return !conflicting.some((f) => CRITICAL_FIELDS.has(f))
  }

  function findConflictingFields(
    client: Record<string, unknown>,
    server: Record<string, unknown>,
  ): string[] {
    const conflicts: string[] = []
    for (const key of Object.keys(client)) {
      if (server[key] !== undefined && server[key] !== client[key] &&
          key !== 'updated_at' && key !== 'version') {
        conflicts.push(key)
      }
    }
    return conflicts
  }

  function mapRowToOp(row: Record<string, unknown>): OfflineOperation {
    return {
      id:            row.id as string,
      deviceId:      row.device_id as string,
      agentId:       row.agent_id as string,
      entityType:    row.entity_type as string,
      entityId:      row.entity_id as string | null,
      clientTempId:  row.client_temp_id as string | null,
      operation:     row.operation as SyncOperation,
      payload:       row.payload as Record<string, unknown>,
      status:        row.status as SyncStatus,
      clientVersion: Number(row.client_version ?? 1),
      serverVersion: row.server_version != null ? Number(row.server_version) : null,
      conflictData:  row.conflict_data as Record<string, unknown> | null,
      capturedAt:    row.captured_at as string,
      syncedAt:      row.synced_at as string | null,
      createdAt:     row.created_at as string,
    }
  }

  return {
    enqueueBatch,
    processPendingBatch,
    resolveConflict,
    getPendingOperations,
    getConflicts,
    getSyncStatus,
  }
}
