// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions';
import { getLeads, createLead } from '@/services/leadService';
import { handleApiRequest, successResponse, errorResponse } from '@/lib/api-utils';
import { leadSchema } from '@/lib/validators';
import type { LeadFilters } from '@/types/app';

export const runtime = 'edge';

// GET /api/leads
export async function GET(req: NextRequest) {
  return handleApiRequest(async () => {
    const db = await createClient();
    const ctx = await resolvePermissionContext(db);
    const perms = createPermissionService(db, ctx);
    
    // Check RBAC - using the new has method or enforcement
    await perms.enforce('lead.read.own');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(Number(searchParams.get('limit') ?? '30'), 100);
    const statuses = searchParams.getAll('status');

    const filters: LeadFilters = {
      status: statuses.length === 1 ? statuses[0] as LeadFilters['status'] : undefined,
      assignedAgent: ctx.role === 'agent' ? ctx.actorId : (searchParams.get('agentId') ?? undefined),
      source: searchParams.get('source') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    };

    const result = await getLeads(filters, page, limit);
    return successResponse(result);
  });
}

// POST /api/leads
export async function POST(req: NextRequest) {
  return handleApiRequest(async () => {
    const db = await createClient();
    const ctx = await resolvePermissionContext(db);
    const perms = createPermissionService(db, ctx);
    
    await perms.enforce('lead.create');

    const body = await req.json();
    
    // Safe validation with Zod
    const validatedData = leadSchema.parse(body);

    const lead = await createLead({
      client_id: validatedData.client_id,
      assigned_agent: ctx.role === 'agent' ? ctx.actorId : (body.assignedAgent ?? ctx.actorId),
      project_id: validatedData.project_id ?? undefined,
      source: validatedData.source,
      budget_min: validatedData.budget_min,
      budget_max: validatedData.budget_max,
      notes: validatedData.notes,
    }, ctx.actorId);

    return successResponse(lead, 201);
  });
}
