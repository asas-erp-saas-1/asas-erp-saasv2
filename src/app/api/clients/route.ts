import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';
import { clients } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export const GET = withEEK({
  resource: 'clients',
  action: 'read',
  handler: async (ctx, request) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = Number(searchParams.get('limit')) || 50;
      const id = searchParams.get('id');

      if (id) {
        const clientResult = await ctx.db.select().from(clients)
          .where(and(eq(clients.id, Number(id)), eq(clients.organizationId, ctx.organizationId)))
          .limit(1);
        
        const client = clientResult[0];
        if (!client) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }
        
        ctx.audit.logAudit({
           organizationId: ctx.organizationId,
           userId: ctx.session.user.id,
           action: 'VIEW_CLIENT',
           entityType: 'clients',
           entityId: String(client.id)
        });

        return NextResponse.json({ data: {
           ...client,
           full_name: `${client.firstName} ${client.lastName}`
        }});
      }

      const allClients = await ctx.db.select().from(clients)
        .where(eq(clients.organizationId, ctx.organizationId))
        .orderBy(desc(clients.createdAt))
        .limit(limit);
        
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'LIST_CLIENTS',
         entityType: 'clients',
         entityId: 'ALL'
      });

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
});

export const POST = withEEK({
  resource: 'clients',
  action: 'write',
  handler: async (ctx, request) => {
    try {
      const body = await request.json();
      const { firstName, lastName, email, phone, type, companyName } = body;

      if (!firstName || !lastName) {
        return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
      }

      const newClient = await ctx.db.insert(clients).values({
        organizationId: ctx.organizationId,
        firstName,
        lastName,
        email,
        phone,
        type: type || 'individual',
        companyName,
      }).returning();
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'CREATE_CLIENT',
         entityType: 'clients',
         entityId: String(newClient[0].id),
         newData: newClient[0]
      });

      return NextResponse.json({ data: newClient[0] }, { status: 201 });
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'POST /api/clients' });
      return NextResponse.json({ error: 'Failed to create client', message: error.message }, { status: 500 });
    }
  }
});
