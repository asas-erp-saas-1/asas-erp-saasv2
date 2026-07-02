import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { leads, clients } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async (ctx, request: Request) => {
  try {
    
    const orgId = ctx.organizationId;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const leadsResult = await ctx.db.select({
      id: leads.id,
      clientId: leads.clientId,
      source: leads.source,
      status: leads.status,
      budgetMin: leads.budgetMin,
      budgetMax: leads.budgetMax,
      assignedAgent: leads.assignedAgent,
      createdAt: leads.createdAt,
      clients: {
        id: clients.id,
        phone: clients.phone,
        full_name: clients.lastName, // fallback
        firstName: clients.firstName,
        lastName: clients.lastName,
      }
    })
      .from(leads)
      .leftJoin(clients, eq(leads.clientId, clients.id))
      .where(eq(leads.organizationId, orgId))
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    const formatted = leadsResult.map(l => ({
      ...l,
      clients: l.clients ? {
         ...l.clients,
         full_name: `${l.clients.firstName} ${l.clients.lastName}`
      } : null
    }));

    return NextResponse.json({ data: formatted, count: formatted.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/leads' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});

export const POST = withEEK({
  resource: 'system',
  action: 'write',
  handler: async (ctx, request: Request) => {
  try {
    
    const orgId = ctx.organizationId;

    const body = await request.json();
    const clientId = body.clientId || body.client_id;
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const newLead = await ctx.db.insert(leads).values({
      organizationId: orgId,
      clientId: Number(clientId),
      source: body.source,
      budgetMin: body.budgetMin || body.budget_min,
      budgetMax: body.budgetMax || body.budget_max,
      assignedAgent: body.assignedAgent || body.assigned_agent ? Number(body.assignedAgent || body.assigned_agent) : undefined,
    }).returning();

    return NextResponse.json({ data: newLead[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/leads' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
