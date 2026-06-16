import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;
    const id = searchParams.get('id');

    if (id) {
       const project = await db.query.projects.findFirst({
         where: (projects, { eq }) => eq(projects.id, Number(id)),
         with: {
           properties: true
         }
       });
       if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
       }
       return NextResponse.json({ data: project });
    }

    const projectsResult = await db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
      limit,
      offset,
      with: {
        properties: true,
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
    const body = await request.json();
    const { name, location, budget, managerId, status } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject = await db.insert(projects).values({
      name,
      location,
      budget,
      managerId: managerId ? Number(managerId) : undefined,
      status: status || 'planning',
    }).returning();

    return NextResponse.json({ data: newProject[0] }, { status: 201 });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'POST /api/projects' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
