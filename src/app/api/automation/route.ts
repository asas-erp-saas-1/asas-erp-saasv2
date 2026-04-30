// src/app/api/automation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { runAllAutomations } from '@/services/automationService'
import { automationEngine } from '@/core/automationEngine'
import { createEventBus } from '@/core/eventBus'

import { env } from '@/lib/env'

export const runtime = 'edge'

// POST /api/automation — trigger automation sweep (cron or manual)
// Body: { action: 'run_sweep' | 'run_overdue_check' | 'run_pressure_update' }
// Protected by CRON_SECRET header for cron calls
export async function POST(req: NextRequest) {
  try {
    // Allow both cron secret and authenticated admin calls
    const cronSecret = req.headers.get('x-cron-secret')
    const isFromCron = !!env.CRON_SECRET && cronSecret === env.CRON_SECRET

    if (!isFromCron) {
      const db    = await createServerSupabaseClient()
      const ctx   = await resolvePermissionContext(db)
      const perms = createPermissionService(db, ctx)
      await perms.enforce('system.config')
    }

    const db     = await createServerSupabaseClient()
    const body   = await req.json()
    const action = body.action ?? 'run_sweep'
    const bus    = createEventBus(db)

    if (action === 'run_sweep') {
      const result = await runAllAutomations()
      return NextResponse.json({ ran: true, result })
    }

    if (action === 'run_overdue_check') {
      // Mark overdue payments
      const { data } = await db
        .from('deal_payments')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .select('id, deal_id, amount')
      return NextResponse.json({ updated: data?.length ?? 0 })
    }

    if (action === 'run_pressure_update') {
      // TOOD: pass limit if needed
      const pq = await automationEngine.getPriorityQueue()
      return NextResponse.json({ priorityQueue: pq })
    }

    if (action === 'process_events') {
      const result = await bus.processEventsBatch()
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 422 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}

// GET /api/automation?view=priority_queue&limit=20
export async function GET(req: NextRequest) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('metrics.read')

    const { searchParams } = new URL(req.url)
    const view  = searchParams.get('view') ?? 'priority_queue'
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100)
    const bus   = createEventBus(db)

    if (view === 'priority_queue') {
      const pq = await automationEngine.getPriorityQueue(undefined, limit)
      return NextResponse.json(pq)
    }

    if (view === 'queue_depth') {
      const depth = await bus.getQueueDepth()
      return NextResponse.json(depth)
    }

    return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 422 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
