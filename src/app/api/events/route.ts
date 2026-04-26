// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { createEventBus, type EventPublishInput } from '@/core/eventBus'
import { EVENT_TYPES } from '@/types/events'

export const runtime = 'edge'

// GET /api/events?action=depth  — queue depth
// GET /api/events?action=dead_letter&limit=20  — DLQ entries
export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('system.config')

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') ?? 'depth'

    const bus = createEventBus(db)

    if (action === 'depth') {
      const depth = await bus.getQueueDepth()
      return NextResponse.json(depth)
    }

    if (action === 'dead_letter') {
      const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
      const { data } = await db
        .from('event_bus')
        .select('id, event_type, entity_type, entity_id, attempts, last_error, created_at, metadata')
        .eq('status', 'dead_letter')
        .order('created_at', { ascending: false })
        .limit(limit)
      return NextResponse.json(data ?? [])
    }

    if (action === 'failed') {
      const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
      const { data } = await db
        .from('event_bus')
        .select('id, event_type, entity_type, entity_id, attempts, last_error, scheduled_for, created_at')
        .eq('status', 'failed')
        .order('scheduled_for', { ascending: true })
        .limit(limit)
      return NextResponse.json(data ?? [])
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 422 })
  } catch (e) {
    return errRes(e)
  }
}

// POST /api/events
// Body: { action: 'publish', eventType, entityType, entityId, payload, idempotencyKey? }
// Body: { action: 'process_batch' }
// Body: { action: 'retry_failed' }
// Body: { action: 'move_to_dlq', eventId, reason }
export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('event.publish')

    const body   = await req.json()
    const action = body.action ?? 'publish'
    const bus    = createEventBus(db)

    // ── Publish single event ──────────────────────────────────────────────
    if (action === 'publish') {
      const { eventType, entityType, entityId, payload, idempotencyKey, correlationId, scheduledFor } = body

      if (!eventType || !entityType || !entityId) {
        return NextResponse.json({ error: 'eventType, entityType, entityId required' }, { status: 422 })
      }

      // Validate event type
      const validTypes = Object.values(EVENT_TYPES) as string[]
      if (!validTypes.includes(eventType)) {
        return NextResponse.json({ error: `Unknown eventType: ${eventType}` }, { status: 422 })
      }

      const input: EventPublishInput = {
        eventType,
        entityType,
        entityId,
        payload:        payload ?? {},
        triggeredBy:    ctx.actorId,
        idempotencyKey: idempotencyKey ?? undefined,
        correlationId:  correlationId ?? undefined,
        scheduledFor:   scheduledFor ? new Date(scheduledFor) : undefined,
      }

      const eventId = await bus.publish(input)
      return NextResponse.json({ published: true, eventId }, { status: 201 })
    }

    // ── Process batch (admin only) ────────────────────────────────────────
    if (action === 'process_batch') {
      await perms.enforce('system.config')
      const result = await bus.processEventsBatch()
      return NextResponse.json(result)
    }

    // ── Retry failed events ───────────────────────────────────────────────
    if (action === 'retry_failed') {
      await perms.enforce('system.config')
      const retried = await bus.retryFailed()
      return NextResponse.json({ retried })
    }

    // ── Move event to DLQ ─────────────────────────────────────────────────
    if (action === 'move_to_dlq') {
      await perms.enforce('system.config')
      const { eventId, reason } = body
      if (!eventId || !reason) {
        return NextResponse.json({ error: 'eventId and reason required' }, { status: 422 })
      }
      await bus.moveToDLQ(eventId, reason)
      return NextResponse.json({ moved: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 422 })
  } catch (e) {
    return errRes(e)
  }
}

function errRes(e: unknown): NextResponse {
  const msg    = e instanceof Error ? e.message : String(e)
  const status = msg.includes('PERMISSION_DENIED') ? 403
    : msg.includes('Unauthorized') ? 401
    : 500
  return NextResponse.json({ error: msg }, { status })
}
