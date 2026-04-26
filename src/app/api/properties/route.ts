// src/app/api/properties/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { enforcePlanLimit } from '@/lib/planEnforcement'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const { searchParams } = new URL(req.url)
    const page      = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit     = Math.min(Number(searchParams.get('limit') ?? '20'), 100)
    const status    = searchParams.get('status') ?? ''
    const type      = searchParams.get('type') ?? ''
    const projectId = searchParams.get('projectId') ?? ''
    const search    = searchParams.get('q') ?? ''
    const priceMin  = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : null
    const priceMax  = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : null

    let query = db
      .from('properties')
      .select(`
        id, reference_code, type, floor, rooms, area_sqm, list_price, status,
        features, images, notes, created_at,
        projects ( id, name, city, location, developers ( id, name ) )
      `, { count: 'exact' })
      .eq('agency_id', actor.agencyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status)    query = query.eq('status', status)
    if (type)      query = query.eq('type', type)
    if (projectId) query = query.eq('project_id', projectId)
    if (priceMin)  query = query.gte('list_price', priceMin)
    if (priceMax)  query = query.lte('list_price', priceMax)
    if (search)    query = query.ilike('reference_code', `%${search}%`)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return ok({ data: data ?? [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / limit) })
  } catch (e) { return fail(e) }
}

export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)

    await enforcePlanLimit(db, actor.agencyId, 'properties')

    const body = await req.json()
    const { projectId, referenceCode, type, floor, rooms, areaSqm, listPrice, notes, images } = body

    if (!projectId || !type || !listPrice) {
      return fail(new Error('VALIDATION: projectId, type, and listPrice are required'))
    }
    if (Number(listPrice) <= 0) {
      return fail(new Error('VALIDATION: listPrice must be > 0'))
    }

    // Verify project belongs to agency
    const { data: project } = await db.from('projects').select('id').eq('id', projectId).eq('agency_id', actor.agencyId).maybeSingle()
    if (!project) return fail(new Error('INVALID_PROJECT: Project not found'))

    const { data, error } = await db.from('properties').insert({
      agency_id:      actor.agencyId,
      project_id:     projectId,
      reference_code: referenceCode?.trim() ?? null,
      type,
      floor:          floor ?? null,
      rooms:          rooms ?? null,
      area_sqm:       areaSqm ?? null,
      list_price:     Number(listPrice),
      status:         'available',
      images:         images ?? [],
      notes:          notes ?? null,
    }).select().single()

    if (error) {
      if (error.code === '23505') return fail(new Error('DUPLICATE: Reference code already exists'))
      throw new Error(error.message)
    }

    return ok(data)
  } catch (e) { return fail(e) }
}
