import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deals, properties, clients } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';
import { requireSession } from '@/lib/enterprise/auth';
import { requirePermission } from '@/lib/enterprise/rbac';
import { logAudit } from '@/lib/enterprise/audit';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, 'deals', 'read');

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 25;
    const id = searchParams.get('id');
    
    let query = db.select({
      id: deals.id,
      reference: deals.reference,
      status: deals.status,
      agreedPrice: deals.agreedPrice,
      dealType: deals.dealType,
      createdAt: deals.createdAt,
      clients: {
         id: clients.id,
         full_name: clients.lastName, // fallback for full_name
         firstName: clients.firstName,
         lastName: clients.lastName,
         phone: clients.phone,
      },
      properties: {
         id: properties.id,
         title: properties.title,
         projects: {
             name: properties.title // fallback projection
         }
      }
    })
    .from(deals)
    .leftJoin(clients, eq(deals.clientId, clients.id))
    .leftJoin(properties, eq(deals.propertyId, properties.id))
    .where(eq(deals.organizationId, session.organizationId)); // TANANT ISOLATION
    
    if (id) {
       const dealResult = await query.where(and(eq(deals.id, Number(id)), eq(deals.organizationId, session.organizationId))).limit(1);
       if (dealResult.length === 0) {
         return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
       }
       
       await logAudit({
          organizationId: session.organizationId,
          userId: session.userId,
          action: 'VIEW_DEAL',
          entityType: 'deals',
          entityId: String(dealResult[0].id)
       });

       return NextResponse.json({ data: dealResult[0], count: 1 });
    }
    
    const allDeals = await query.orderBy(desc(deals.createdAt)).limit(limit);
    
    await logAudit({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'LIST_DEALS',
        entityType: 'deals',
        entityId: 'ALL'
    });

    return NextResponse.json({ data: allDeals, count: allDeals.length });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
       return NextResponse.json({ error: error.message }, { status: 403 });
    }
    ErrorTracker.captureError(error, { context: 'GET /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, 'deals', 'write');

    const body = await request.json();
    
    // Process input
    const clientId = body.clientId || body.client_id;
    const propertyId = body.propertyId || body.property_id;
    const agreedPrice = body.agreedPrice || body.agreed_price;
    const dealType = body.dealType || body.deal_type || 'sale';

    if (!clientId || !propertyId || !agreedPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reference = `DL-${Date.now().toString().slice(-6)}`;

    const newDeal = await db.insert(deals).values({
      organizationId: session.organizationId, // TENANT ISOLATION
      reference,
      clientId: Number(clientId),
      propertyId: Number(propertyId),
      agreedPrice: agreedPrice,
      dealType: dealType,
      status: 'negotiation'
    }).returning();

    await logAudit({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATE_DEAL',
        entityType: 'deals',
        entityId: String(newDeal[0].id),
        newData: newDeal[0]
    });

    return NextResponse.json({ data: newDeal[0] }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
       return NextResponse.json({ error: error.message }, { status: 403 });
    }
    ErrorTracker.captureError(error, { context: 'POST /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, 'deals', 'write');

    const body = await request.json();
    
    const id = body.id;
    const status = body.status;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields id, status' }, { status: 400 });
    }

    const updatedDeal = await db.update(deals).set({
      status: status
    }).where(and(eq(deals.id, Number(id)), eq(deals.organizationId, session.organizationId))).returning();

    if (updatedDeal.length === 0) {
      return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 });
    }

    await logAudit({
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'WORKFLOW_TRANSITION',
        entityType: 'deals',
        entityId: String(updatedDeal[0].id),
        newData: { status: status }
    });

    return NextResponse.json({ data: updatedDeal[0] }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
       return NextResponse.json({ error: error.message }, { status: 403 });
    }
    ErrorTracker.captureError(error, { context: 'PUT /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

