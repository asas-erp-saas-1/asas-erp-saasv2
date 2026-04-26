import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { resolvePermissionContext, createPermissionService } from '@/lib/permissions';
import { getLeads, createLead } from '@/services/leadService';
import { handleApiRequest, successResponse } from '@/lib/api-utils';
import { LeadCreateSchema } from '@/lib/validators';
import { withRateLimit } from '@/lib/apiMiddleware';
import type { LeadFilters } from '@/types/app';

export const runtime = 'edge';

// GET /api/leads
export const GET = (req: NextRequest) => handleApiRequest(async () => {
    const db = await createClient();
    const ctx = await resolvePermissionContext(db);
    const perms = createPermissionService(db, ctx);
    
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

// POST /api/leads
export const POST = (req: NextRequest) => handleApiRequest(async () => {
    const db = await createClient();
    const ctx = await resolvePermissionContext(db);
    
    // Rate limit lead creation
    const { withRateLimit } = await import('@/lib/apiMiddleware');
    const handler = withRateLimit(db, { action: 'lead_create', limit: 50 }, async () => {
      const perms = createPermissionService(db, ctx);
      await perms.enforce('lead.create');

      const body = await req.json();
      const validatedData = LeadCreateSchema.parse(body);

      const lead = await createLead({
        ...validatedData,
        assigned_agent: ctx.role === 'agent' ? ctx.actorId : (body.assignedAgent ?? ctx.actorId),
      }, ctx.actorId);

      return successResponse(lead, 201);
    });

    return handler();
});
