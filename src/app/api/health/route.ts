// src/app/api/health/route.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest) {
  const checks: Record<string, 'up' | 'down'> = {}

  try {
    const db = await createServerSupabaseClient()
    const { error } = await db.from('agencies').select('id').limit(1)
    checks.database = error ? 'down' : 'up'
  } catch {
    checks.database = 'down'
  }

  const overall  = Object.values(checks).every(v => v === 'up') ? 'up' : 'degraded'
  const status   = overall === 'up' ? 200 : 503

  return Response.json({
    success: overall === 'up',
    data: {
      overall,
      checks,
      timestamp: new Date().toISOString(),
      version:   process.env.npm_package_version ?? '1.0.0',
    },
  }, { status })
}
