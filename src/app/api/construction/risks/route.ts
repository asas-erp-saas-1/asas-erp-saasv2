import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projectRisks, projects } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const projectId = searchParams.get('projectId');

    let query = db.select({
      id: projectRisks.id,
      projectId: projectRisks.projectId,
      type: projectRisks.type,
      description: projectRisks.description,
      severity: projectRisks.severity,
      status: projectRisks.status,
      delayImpact: projectRisks.delayImpact,
      createdAt: projectRisks.createdAt,
      projects: {
         id: projects.id,
         name: projects.name,
      }
    })
    .from(projectRisks)
    .leftJoin(projects, eq(projectRisks.projectId, projects.id));

    if (projectId) {
       query = query.where(eq(projectRisks.projectId, Number(projectId))) as any;
    }

    const results = await query.orderBy(desc(projectRisks.createdAt)).limit(limit);
    
    // Map data for front-end
    const formatted = results.map(risk => ({
       id: `RSK-${risk.id.toString().padStart(2, '0')}`,
       projectId: risk.projectId,
       project: risk.projects ? risk.projects.name : 'Unknown Project',
       type: risk.type || 'General',
       description: risk.description,
       severity: risk.severity,
       status: risk.status,
       delayImpact: risk.delayImpact || 'Inconnu',
       createdAt: risk.createdAt
    }))

    return NextResponse.json({ data: formatted, count: formatted.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/construction/risks' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, type, description, severity, status, delayImpact } = body;
    
    if (!projectId || !description) {
      return NextResponse.json({ error: 'projectId and description are required' }, { status: 400 });
    }

    const newRisk = await db.insert(projectRisks).values({
      projectId: Number(projectId),
      type,
      description,
      severity: severity || 'medium',
      status: status || 'monitoring',
      delayImpact
    }).returning();

    return NextResponse.json({ data: newRisk[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/construction/risks' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
