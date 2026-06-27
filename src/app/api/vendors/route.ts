import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';
import { db } from '@/db';
import { vendors } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const vendorsResult = await db.select()
      .from(vendors)
      .where(eq(vendors.organizationId, identity.tenantId))
      .orderBy(desc(vendors.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: vendorsResult, count: vendorsResult.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/vendors' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, specialty, contactEmail, contactPhone, status } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    const newVendor = await db.insert(vendors).values({
      organizationId: identity.tenantId,
      name,
      type: type || 'contractor',
      specialty,
      contactEmail,
      contactPhone,
      status: status || 'active'
    }).returning();

    return NextResponse.json({ data: newVendor[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/vendors' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
