// src/app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'

export const runtime = 'edge'

// GET /api/alerts?severity=critical&severity=medium&limit=20&resolved=false
export async function GET(req: NextRequest) {
  try {
    const db     = await createServerSupabaseClient()
    const ctx    = await resolvePermissionContext(db)
    const perms  = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    const { searchParams } = new URL(req.url)
    const severities = searchParams.getAll('severity')
    const limit      = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
    const resolved   = searchParams.get('resolved') === 'true'
    const entityType = searchParams.get('entityType') ?? null
    const actionOnly = searchParams.get('actionRequired') === 'true'

    let query = db
      .from('alerts')
      .select('id, severity, entity_type, entity_id, message, action_required, is_resolved, resolved_by, resolved_at, resolution_note, dedup_key, event_time, created_at')
      .eq('is_resolved', resolved)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severities.length > 0) {
      query = query.in('severity', severities)
    }
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (actionOnly) {
      query = query.eq('action_required', true)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    // Map to camelCase for frontend
    const alerts = (data ?? []).map((a: Record<string, unknown>) => ({
      id:             a.id,
      severity:       a.severity,
      entityType:     a.entity_type,
      entityId:       a.entity_id,
      message:        a.message,
      actionRequired: a.action_required,
      isResolved:     a.is_resolved,
      resolvedBy:     a.resolved_by,
      resolvedAt:     a.resolved_at,
      resolutionNote: a.resolution_note,
      createdAt:      a.created_at,
    }))

    return NextResponse.json(alerts)
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}

// POST /api/alerts — create alert
export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read') // managers can create alerts

    const body = await req.json()
    const { severity, entityType, entityId, message, actionRequired, dedupKey } = body

    if (!severity || !entityType || !message) {
      return NextResponse.json({ error: 'severity, entityType, and message are required' }, { status: 422 })
    }
    if (!['low', 'medium', 'critical'].includes(severity)) {
      return NextResponse.json({ error: 'severity must be: low | medium | critical' }, { status: 422 })
    }

    const { data, error } = await db
      .from('alerts')
      .insert({
        severity,
        entity_type:     entityType,
        entity_id:       entityId ?? null,
        message,
        action_required: actionRequired ?? false,
        dedup_key:       dedupKey ?? null,
      })
      .select('id')
      .single()

    if (error) {
      // Idempotent: dedupKey already exists = OK
      if (error.code === '23505') {
        return NextResponse.json({ created: false, reason: 'duplicate_key' }, { status: 200 })
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ created: true, id: (data as { id: string }).id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}

// PATCH /api/alerts — resolve alert
// Body: { id, resolutionNote? }
export async function PATCH(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    const body = await req.json()
    const { id, resolutionNote } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 422 })
    }

    const { error } = await db
      .from('alerts')
      .update({
        is_resolved:     true,
        resolved_by:     ctx.actorId,
        resolved_at:     new Date().toISOString(),
        resolution_note: resolutionNote ?? null,
      })
      .eq('id', id)
      .eq('is_resolved', false)

    if (error) throw new Error(error.message)

    return NextResponse.json({ resolved: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
