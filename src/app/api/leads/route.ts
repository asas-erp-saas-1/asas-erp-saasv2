import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const leadsResult = await db.select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: leadsResult, count: leadsResult.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/leads' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientId = body.clientId || body.client_id;
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const newLead = await db.insert(leads).values({
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
