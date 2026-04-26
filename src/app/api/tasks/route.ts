// src/app/api/tasks/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const { searchParams } = new URL(req.url)
    const statuses  = searchParams.getAll('status')
    const priority  = searchParams.get('priority') ?? ''
    const agentId   = searchParams.get('agentId') ?? (actor.role === 'agent' ? actor.id : null)
    const automated = searchParams.get('automated')
    const limit     = Math.min(Number(searchParams.get('limit') ?? '50'), 200)

    let query = db
      .from('tasks')
      .select('id, title, description, priority, status, due_date, done_at, is_automated, lead_id, deal_id, created_at, assigned_to, profiles!assigned_to(full_name)', { count: 'exact' })
      .eq('agency_id', actor.agencyId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit)

    if (actor.role === 'agent') query = query.eq('assigned_to', actor.id)
    else if (agentId)           query = query.eq('assigned_to', agentId)
    if (statuses.length > 0)   query = query.in('status', statuses)
    if (priority)               query = query.eq('priority', priority)
    if (automated === 'true')   query = query.eq('is_automated', true)
    if (automated === 'false')  query = query.eq('is_automated', false)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return ok({ data: data ?? [], count: count ?? 0 })
  } catch (e) { return fail(e) }
}

export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const body  = await req.json()

    const { title, description, priority, dueDate, assignedTo, leadId, dealId } = body
    if (!title?.trim()) return fail(new Error('VALIDATION: title required'))

    const { data, error } = await db.from('tasks').insert({
      agency_id:   actor.agencyId,
      assigned_to: assignedTo ?? actor.id,
      created_by:  actor.id,
      lead_id:     leadId  ?? null,
      deal_id:     dealId  ?? null,
      title:       title.trim(),
      description: description ?? null,
      priority:    priority ?? 'medium',
      status:      'pending',
      due_date:    dueDate ?? null,
      is_automated: false,
    }).select().single()

    if (error) throw new Error(error.message)
    return ok(data)
  } catch (e) { return fail(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const body  = await req.json()
    const { id, status, doneAt } = body

    if (!id || !status) return fail(new Error('VALIDATION: id and status required'))

    const { data, error } = await db.from('tasks')
      .update({
        status,
        done_at:    status === 'done' ? (doneAt ?? new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('agency_id', actor.agencyId)
      .or(`assigned_to.eq.${actor.id}${actor.role !== 'agent' ? `,agency_id.eq.${actor.agencyId}` : ''}`)
      .select().single()

    if (error) throw new Error(error.message)
    return ok(data)
  } catch (e) { return fail(e) }
}
