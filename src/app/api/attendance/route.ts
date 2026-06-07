import { NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const userId = searchParams.get('userId');

    let query = db.select().from(attendance).orderBy(desc(attendance.date));
    
    if (userId) {
       query = query.where(eq(attendance.userId, Number(userId))) as any;
    }

    const results = await query.limit(limit);

    return NextResponse.json({ data: results, count: results.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/attendance' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, status, location } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const record = await db.insert(attendance).values({
      userId: Number(userId),
      date: new Date(),
      timeIn: new Date(),
      status: status || 'present',
      location: location,
    }).returning();

    return NextResponse.json({ data: record[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/attendance' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
