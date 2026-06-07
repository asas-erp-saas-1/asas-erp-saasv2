import { NextResponse } from 'next/server';
import { db } from '@/db';
import { properties } from '@/db/schema';
import { eq, desc, ilike, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 24;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const q = searchParams.get('q');

    let conditions = [];
    if (status) conditions.push(eq(properties.status, status));
    if (type) conditions.push(eq(properties.type, type));
    if (q) {
      conditions.push(or(
        ilike(properties.title, `%${q}%`),
        ilike(properties.location, `%${q}%`)
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const propertyResults = await db.select().from(properties).where(whereClause).orderBy(desc(properties.createdAt)).limit(limit);

    return NextResponse.json({ data: propertyResults, count: propertyResults.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Defaulting required fields if absent
    const data = {
      title: payload.title || 'Untitled Property',
      type: payload.type || 'other',
      price: payload.price || payload.list_price || 0,
      status: payload.status || 'available',
      area: payload.area || payload.area_sqm || null,
      description: payload.description || payload.notes || null,
      location: payload.location || null,
    };

    const property = await db.insert(properties).values(data).returning();
    return NextResponse.json({ data: property[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
