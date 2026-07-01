import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
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
    const id = searchParams.get('id');

    if (id) {
       const project = await db.query.projects.findFirst({
         where: (projects, { and, eq }) => and(
            eq(projects.id, Number(id)),
            eq(projects.organizationId, identity.tenantId as number)
         ),
         with: {
           properties: true,
           phases: true,
           tasks: {
             with: {
               vendor: true
             }
           }
         }
       });
       if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
       }
       return NextResponse.json({ data: project });
    }

    const projectsResult = await db.query.projects.findMany({
      where: (projects, { eq }) => eq(projects.organizationId, identity.tenantId as number),
      orderBy: [desc(projects.createdAt)],
      limit,
      offset,
      with: {
        properties: true,
        phases: true,
      }
    });

    return NextResponse.json({ data: projectsResult, count: projectsResult.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/projects' });
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
    const { name, location, budget, managerId, status } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const orgId = Number(identity.tenantId);
    const newProject = await db.insert(projects).values({
      name,
      location,
      budget,
      managerId: managerId ? Number(managerId) : undefined,
      status: status || 'planning',
      organizationId: orgId
    }).returning();
    
    const project = newProject[0];
    if (!project) throw new Error('Failed to create project');

    const projectId = project.id;
    const { projectPhases } = await import('@/db/schema');

    await db.insert(projectPhases).values([
      { organizationId: orgId, projectId, name: 'Réservation (Dépôt)', billingPercentage: '20', constructionPercentage: '0', status: 'completed' },
      { organizationId: orgId, projectId, name: 'Fondation & Sous-sol', billingPercentage: '15', constructionPercentage: '10', status: 'pending' },
      { organizationId: orgId, projectId, name: 'Plancher Haut (RDC)', billingPercentage: '15', constructionPercentage: '25', status: 'pending' },
      { organizationId: orgId, projectId, name: 'Gros Œuvres (Toiture)', billingPercentage: '20', constructionPercentage: '50', status: 'pending' },
      { organizationId: orgId, projectId, name: 'Second Œuvre (Achèvement)', billingPercentage: '20', constructionPercentage: '85', status: 'pending' },
      { organizationId: orgId, projectId, name: 'Remise des clés', billingPercentage: '10', constructionPercentage: '100', status: 'pending' }
    ]);

    return NextResponse.json({ data: newProject[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/projects' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
