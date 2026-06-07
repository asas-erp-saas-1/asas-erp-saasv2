import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deals, properties, clients, projectRisks } from '@/db/schema';
import { sql, eq, sum } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const dealsStats = await db.select({
       totalSales: sum(deals.agreedPrice).mapWith(Number),
       dealCount: sql`count(${deals.id})`.mapWith(Number)
    }).from(deals).where(eq(deals.status, 'completed'));

    const propertiesStats = await db.select({
       totalProperties: sql`count(${properties.id})`.mapWith(Number),
       availableProperties: sql`count(*) filter (where ${properties.status} = 'available')`.mapWith(Number)
    }).from(properties);

    const clientsStats = await db.select({
       totalClients: sql`count(${clients.id})`.mapWith(Number)
    }).from(clients);

    const risksStats = await db.select({
       activeRisks: sql`count(*) filter (where ${projectRisks.status} = 'active')`.mapWith(Number),
       totalRisks: sql`count(${projectRisks.id})`.mapWith(Number)
    }).from(projectRisks);

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
