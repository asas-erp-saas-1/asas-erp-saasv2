import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';
import { properties } from '@/db/schema';
import { eq, desc, ilike, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const GET = withEEK({
  resource: 'properties',
  action: 'read',
  handler: async (ctx, request) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = Number(searchParams.get('limit')) || 24;
      const status = searchParams.get('status');
      const type = searchParams.get('type');
      const q = searchParams.get('q');

      let conditions = [eq(properties.organizationId, ctx.organizationId)];
      if (status && status !== 'all') conditions.push(eq(properties.status, status));
      if (type) conditions.push(eq(properties.type, type));
      if (q) {
        conditions.push(or(
          ilike(properties.title, `%${q}%`),
          ilike(properties.location, `%${q}%`)
        ) as any);
      }

      const whereClause = and(...conditions);

      const propertyResults = await ctx.db.select().from(properties).where(whereClause).orderBy(desc(properties.createdAt)).limit(limit);
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'LIST_PROPERTIES',
         entityType: 'properties',
         entityId: 'ALL'
      });

      return NextResponse.json({ data: propertyResults, count: propertyResults.length });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const POST = withEEK({
  resource: 'properties',
  action: 'write',
  handler: async (ctx, request) => {
    try {
      const payload = await request.json();
      
      // Defaulting required fields if absent
      const data = {
        organizationId: ctx.organizationId,
        title: payload.title || 'Untitled Property',
        type: payload.type || 'other',
        price: payload.price || payload.list_price || 0,
        status: payload.status || 'available',
        area: payload.area || payload.area_sqm || null,
        description: payload.description || payload.notes || null,
        location: payload.location || null,
      };

      const property = await ctx.db.insert(properties).values(data).returning();
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'CREATE_PROPERTY',
         entityType: 'properties',
         entityId: String(property[0].id),
         newData: property[0]
      });
      
      return NextResponse.json({ data: property[0] }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});
