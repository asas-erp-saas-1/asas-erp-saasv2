import { NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance, users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const userId = searchParams.get('userId');

    let query = db.select({
      id: attendance.id,
      userId: attendance.userId,
      date: attendance.date,
      timeIn: attendance.timeIn,
      timeOut: attendance.timeOut,
      status: attendance.status,
      location: attendance.location,
      user: {
         id: users.id,
         name: users.name,
         role: users.role,
         department: users.department,
      }
    }).from(attendance).leftJoin(users, eq(attendance.userId, users.id)).orderBy(desc(attendance.date));
    
    if (userId) {
       query = query.where(eq(attendance.userId, Number(userId))) as any;
    }

    const results = await query.limit(limit);

    // Calculate stats
    const statsQuery = await db.select({
       totalEmployees: sql`count(distinct ${attendance.userId})`.mapWith(Number),
       present: sql`count(*) filter (where ${attendance.status} = 'present' or ${attendance.status} = 'remote')`.mapWith(Number),
       onSite: sql`count(*) filter (where ${attendance.status} = 'present' and ${attendance.location} is not null)`.mapWith(Number),
       late: sql`count(*) filter (where ${attendance.status} = 'late')`.mapWith(Number),
       absent: sql`count(*) filter (where ${attendance.status} = 'absent')`.mapWith(Number),
    }).from(attendance);

    const stats = statsQuery[0] || { totalEmployees: 0, present: 0, onSite: 0, late: 0, absent: 0 };
    const rate = stats.totalEmployees > 0 ? ((stats.present + stats.late) / stats.totalEmployees) * 100 : 0;

    return NextResponse.json({ 
       data: results, 
       stats: {
           ...stats,
           attendanceRate: rate.toFixed(1)
       },
       count: results.length 
    });
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
