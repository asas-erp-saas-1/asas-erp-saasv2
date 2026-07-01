import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';
import { deals, properties, clients } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export const GET = withEEK({
  resource: 'deals',
  action: 'read',
  handler: async (ctx, request) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = Number(searchParams.get('limit')) || 25;
      const id = searchParams.get('id');
      
      const conditions = [eq(deals.organizationId, ctx.organizationId)];
      if (id) {
         conditions.push(eq(deals.id, Number(id)));
      }

      const query = ctx.db.select({
        id: deals.id,
        reference: deals.reference,
        status: deals.status,
        agreedPrice: deals.agreedPrice,
        dealType: deals.dealType,
        createdAt: deals.createdAt,
        clients: {
           id: clients.id,
           full_name: clients.lastName,
           firstName: clients.firstName,
           lastName: clients.lastName,
           phone: clients.phone,
        },
        properties: {
           id: properties.id,
           title: properties.title,
        }
      })
      .from(deals)
      .leftJoin(clients, eq(deals.clientId, clients.id))
      .leftJoin(properties, eq(deals.propertyId, properties.id))
      .where(and(...conditions)); 
      
      if (id) {
         const dealResult = await query.limit(1);
         const deal = dealResult[0];
         if (!deal) {
           return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
         }
         
         ctx.audit.logAudit({
            organizationId: ctx.organizationId,
            userId: ctx.session.user.id,
            action: 'VIEW_DEAL',
            entityType: 'deals',
            entityId: String(deal.id)
         });

         return NextResponse.json({ data: deal, count: 1 });
      }
      
      const allDeals = await query.orderBy(desc(deals.createdAt)).limit(limit);
      
      ctx.audit.logAudit({
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
          action: 'LIST_DEALS',
          entityType: 'deals',
          entityId: 'ALL'
      });

      return NextResponse.json({ data: allDeals, count: allDeals.length });
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'GET /api/deals' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const POST = withEEK({
  resource: 'deals',
  action: 'write',
  handler: async (ctx, request) => {
    try {
      const body = await request.json();
      
      const clientId = body.clientId || body.client_id;
      const propertyId = body.propertyId || body.property_id;
      const agreedPrice = body.agreedPrice || body.agreed_price;
      const dealType = body.dealType || body.deal_type || 'sale';

      if (!clientId || !propertyId || !agreedPrice) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const reference = `DL-${Date.now().toString().slice(-6)}`;

      const newDeal = await ctx.db.insert(deals).values({
        organizationId: ctx.organizationId,
        reference,
        clientId: Number(clientId),
        propertyId: Number(propertyId),
        agreedPrice: agreedPrice,
        dealType: dealType,
        status: 'negotiation'
      }).returning();

      const deal = newDeal[0];
      if (!deal) {
        return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
      }

      ctx.audit.logAudit({
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
          action: 'CREATE_DEAL',
          entityType: 'deals',
          entityId: String(deal.id),
          newData: deal
      });

      return NextResponse.json({ data: deal }, { status: 201 });
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'POST /api/deals' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const PUT = withEEK({
  resource: 'deals',
  action: 'write',
  handler: async (ctx, request) => {
    try {
      const body = await request.json();
      
      const id = body.id;
      const status = body.status;

      if (!id || !status) {
        return NextResponse.json({ error: 'Missing required fields id, status' }, { status: 400 });
      }

      const updatedDeal = await ctx.db.update(deals).set({
        status: status
      }).where(and(eq(deals.id, Number(id)), eq(deals.organizationId, ctx.organizationId))).returning();

      const deal = updatedDeal[0];
      if (!deal) {
        return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
      }

      ctx.audit.logAudit({
          organizationId: ctx.organizationId,
          userId: ctx.session.user.id,
          action: 'WORKFLOW_TRANSITION',
          entityType: 'deals',
          entityId: String(deal.id),
          newData: { status: status }
      });

      return NextResponse.json({ data: deal }, { status: 200 });
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'PUT /api/deals' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

