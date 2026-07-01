import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';
import { kernel } from '@/lib/kernel/core';

export async function GET(request: Request) {
  try {
    const identity = await kernel.identity();
    if (!identity || identity.tenantId === 'unknown') {
       return NextResponse.json({ error: 'Unauthorized or missing tenant context.' }, { status: 401 });
    }
    const orgId = identity.tenantId as number;

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const id = searchParams.get('id');

    if (id) {
      const clientResult = await db.select().from(clients)
        .where(and(eq(clients.id, Number(id)), eq(clients.organizationId, orgId)))
        .limit(1);
      
      const client = clientResult[0];
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json({ data: {
         ...client,
         full_name: `${client.firstName} ${client.lastName}`
      }});
    }

    const allClients = await db.select().from(clients)
      .where(eq(clients.organizationId, orgId))
      .orderBy(desc(clients.createdAt))
      .limit(limit);
      
    const mappedClients = allClients.map(c => ({
       ...c,
       full_name: `${c.firstName} ${c.lastName}`
    }));
    return NextResponse.json({ data: mappedClients, count: mappedClients.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/clients' });
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await kernel.identity();
    if (!identity || identity.tenantId === 'unknown') {
       return NextResponse.json({ error: 'Unauthorized or missing tenant context.' }, { status: 401 });
    }
    const orgId = identity.tenantId as number;

    const body = await request.json();
    const { firstName, lastName, email, phone, type, companyName } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    const newClient = await db.insert(clients).values({
      organizationId: orgId,
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
