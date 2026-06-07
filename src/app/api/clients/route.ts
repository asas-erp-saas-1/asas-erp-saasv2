import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const id = searchParams.get('id');

    if (id) {
      const clientResult = await db.select().from(clients).where(eq(clients.id, Number(id))).limit(1);
      if (clientResult.length === 0) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json({ data: clientResult[0] });
    }

    const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(limit);
    return NextResponse.json({ data: allClients, count: allClients.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/clients' });
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, type, companyName } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    const newClient = await db.insert(clients).values({
      firstName,
      lastName,
      email,
      phone,
      type: type || 'individual',
      companyName,
    }).returning();

    return NextResponse.json({ data: newClient[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/clients' });
    return NextResponse.json({ error: 'Failed to create client', message: error.message }, { status: 500 });
  }
}
