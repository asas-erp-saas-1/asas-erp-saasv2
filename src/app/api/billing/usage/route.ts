// src/app/api/billing/usage/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { getPlanUsage } from '@/lib/planEnforcement'
import { ok, fail } from '@/lib/apiResponse'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const actor = await requireAuth(db)
    const usage = await getPlanUsage(db, actor.agencyId)
    return ok(usage)
  } catch (e) { return fail(e) }
}
