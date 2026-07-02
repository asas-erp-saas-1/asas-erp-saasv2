import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { invoices, deals, clients } from '@/db/schema';
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
    const dealId = searchParams.get('dealId');

    const conditions = [eq(invoices.organizationId, orgId)];
    if (dealId) {
       conditions.push(eq(invoices.dealId, Number(dealId)));
    }

    const query = ctx.db.select({
      id: invoices.id,
      dealId: invoices.dealId,
      reference: invoices.reference,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      deals: {
         id: deals.id,
         reference: deals.reference,
      },
      clients: {
         firstName: clients.firstName,
         lastName: clients.lastName,
      }
    })
    .from(invoices)
    .leftJoin(deals, eq(invoices.dealId, deals.id))
    .leftJoin(clients, eq(deals.clientId, clients.id))
    .where(and(...conditions));

    const results = await query.orderBy(desc(invoices.createdAt)).limit(limit);
    
    // Map data for front-end
    const formatted = results.map(inv => ({
       ...inv,
       customer_name: inv.clients ? `${inv.clients.firstName} ${inv.clients.lastName}` : 'Unknown Customer'
    }))

    return NextResponse.json({ data: formatted, count: formatted.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/invoices' });
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
    const { dealId, amount, dueDate, status } = body;
    
    if (!dealId || !amount || !dueDate) {
      return NextResponse.json({ error: 'dealId, amount, and dueDate are required' }, { status: 400 });
    }

    const reference = `INV-${Date.now().toString().slice(-6)}`;

    const newInvoice = await ctx.db.insert(invoices).values({
      organizationId: orgId,
      dealId: Number(dealId),
      reference,
      amount,
      dueDate: new Date(dueDate),
      status: status || 'pending'
    }).returning();

    return NextResponse.json({ data: newInvoice[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/invoices' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
