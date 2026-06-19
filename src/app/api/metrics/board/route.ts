import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deals, properties, clients, projectRisks } from '@/db/schema';
import { sql, eq, sum, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';
import { kernel } from '@/lib/kernel/core';

export async function GET(request: Request) {
  try {
    const identity = await kernel.identity();
    if (!identity || !identity.tenantId) {
       return NextResponse.json({ error: 'Unauthorized or missing tenant context.' }, { status: 401 });
    }
    
    // Multi-tenant safe casting since string might be UUID mapped or ID mapped in reality. 
    // Usually tenant id in schema is Int, let's parse safely if the schema assumes int.
    // Ensure we parse correctly to match organizationId format.
    const orgId = parseInt(identity.tenantId as string, 10);
    
    if (isNaN(orgId)) {
        return NextResponse.json({ error: 'Invalid organization identifier.' }, { status: 400 });
    }

    const dealsStats = await db.select({
       totalSales: sum(deals.agreedPrice).mapWith(Number),
       dealCount: sql`count(${deals.id})`.mapWith(Number)
    }).from(deals).where(
        and(
            eq(deals.status, 'completed'),
            eq(deals.organizationId, orgId)
        )
    );

    const propertiesStats = await db.select({
       totalProperties: sql`count(${properties.id})`.mapWith(Number),
       availableProperties: sql`count(*) filter (where ${properties.status} = 'available')`.mapWith(Number)
    }).from(properties).where(eq(properties.organizationId, orgId));

    const clientsStats = await db.select({
       totalClients: sql`count(${clients.id})`.mapWith(Number)
    }).from(clients).where(eq(clients.organizationId, orgId));

    const risksStats = await db.select({
       activeRisks: sql`count(*) filter (where ${projectRisks.status} = 'active')`.mapWith(Number),
       totalRisks: sql`count(${projectRisks.id})`.mapWith(Number)
    }).from(projectRisks).where(eq(projectRisks.organizationId, orgId));

    return NextResponse.json({
       data: {
          revenue: dealsStats[0]?.totalSales || 0,
          completedDeals: dealsStats[0]?.dealCount || 0,
          totalProperties: propertiesStats[0]?.totalProperties || 0,
          availableProperties: propertiesStats[0]?.availableProperties || 0,
          totalClients: clientsStats[0]?.totalClients || 0,
          activeRisks: risksStats[0]?.activeRisks || 0
       }
    });

  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/metrics/board' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
