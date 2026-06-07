import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deals, properties, clients, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';
import { parseAndValidate, dealSchema, ValidationError } from '@/lib/validators';

export async function GET(request: Request) {
  try {
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
    .leftJoin(properties, eq(deals.propertyId, properties.id));
    
    if (id) {
       const dealResult = await query.where(eq(deals.id, Number(id))).limit(1);
       if (dealResult.length === 0) {
         return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
       }
       return NextResponse.json({ data: dealResult[0], count: 1 });
    }
    
    const allDeals = await query.orderBy(desc(deals.createdAt)).limit(limit);
    return NextResponse.json({ data: allDeals, count: allDeals.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Fallbacks if validator is old or dealSchema is limited
    const clientId = body.clientId || body.client_id;
    const propertyId = body.propertyId || body.property_id;
    const agreedPrice = body.agreedPrice || body.agreed_price;
    const dealType = body.dealType || body.deal_type || 'sale';

    if (!clientId || !propertyId || !agreedPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reference = `DL-${Date.now().toString().slice(-6)}`;

    const newDeal = await db.insert(deals).values({
      reference,
      clientId: Number(clientId),
      propertyId: Number(propertyId),
      agreedPrice: agreedPrice,
      dealType: dealType,
      status: 'negotiation'
    }).returning();

    return NextResponse.json({ data: newDeal[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/deals' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
