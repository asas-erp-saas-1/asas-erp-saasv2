import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions'
import { updateLead, transitionLeadStatus } from '@/services/leadService'

export const runtime = 'edge'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db    = await createServerSupabaseClient()
    const ctx   = await resolvePermissionContext(db)
    const perms = createPermissionService(db, ctx)
    await perms.enforce('lead.update')

    const body = await req.json()
    const { id } = await params
    
    // If updating status
    if (body.status) {
      const result = await transitionLeadStatus(id, body.status, ctx.actorId, { lost_reason: body.lost_reason })
      return NextResponse.json(result)
    }

    // Default update
    const result = await updateLead(id, body, ctx.actorId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 })
  }
}
