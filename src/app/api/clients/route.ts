// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'))
    const limit  = Math.min(Number(searchParams.get('limit') ?? '20'), 100)
    const search = searchParams.get('q') ?? ''
    const type   = searchParams.get('type') ?? ''

    let query = db
      .from('clients')
      .select('id, full_name, phone, phone_alt, email, nationality, type, source, notes, created_at', { count: 'exact' })
      .eq('agency_id', actor.agencyId)
      .is('deleted_at', null)
      .order('full_name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    if (type)   query = query.eq('type', type)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)

    return ok({ data: data ?? [], count: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / limit) })
  } catch (e) { return fail(e) }
}

export async function POST(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const body  = await req.json()

    const { fullName, phone, phoneAlt, email, nationality, type, source, notes } = body
    if (!fullName?.trim()) return fail(new Error('VALIDATION: fullName is required'))
    if (!phone?.trim() && !email?.trim()) return fail(new Error('VALIDATION: phone or email required'))

    // Duplicate check within agency
    if (phone) {
      const { data: dup } = await db.from('clients').select('id').eq('agency_id', actor.agencyId).eq('phone', phone).is('deleted_at', null).maybeSingle()
      if (dup) return NextResponse.json({ success: false, code: 'DUPLICATE_CLIENT', error: 'Client with this phone already exists' }, { status: 409 })
    }

    const { data, error } = await db.from('clients').insert({
      agency_id:   actor.agencyId,
      full_name:   fullName.trim(),
      phone:       phone?.trim() ?? null,
      phone_alt:   phoneAlt?.trim() ?? null,
      email:       email?.trim() ?? null,
      nationality: nationality ?? null,
      type:        type ?? 'buyer',
      source:      source ?? null,
      notes:       notes ?? null,
    }).select().single()

    if (error) throw new Error(error.message)
    return ok(data, undefined)
  } catch (e) { return fail(e) }
}
