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
    
    if (id) {
       const dealResult = await db.select().from(deals).where(eq(deals.id, Number(id))).limit(1);
       if (dealResult.length === 0) {
         return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
       }
       return NextResponse.json({ data: dealResult[0], count: 1 });
    }
    
    const allDeals = await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(limit);
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
