import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';
import { db } from '@/db';
import { properties } from '@/db/schema';
import { eq, desc, ilike, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 24;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const q = searchParams.get('q');

    let conditions = [eq(properties.organizationId, identity.tenantId)];
    if (status && status !== 'all') conditions.push(eq(properties.status, status));
    if (type) conditions.push(eq(properties.type, type));
    if (q) {
      conditions.push(or(
        ilike(properties.title, `%${q}%`),
        ilike(properties.location, `%${q}%`)
      ) as any);
    }

    const whereClause = and(...conditions);

    const propertyResults = await db.select().from(properties).where(whereClause).orderBy(desc(properties.createdAt)).limit(limit);

    return NextResponse.json({ data: propertyResults, count: propertyResults.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    
    // Defaulting required fields if absent
    const data = {
      organizationId: identity.tenantId,
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
