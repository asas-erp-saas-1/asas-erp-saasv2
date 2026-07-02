import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { projectTasks } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const GET = withEEK({
  resource: 'tasks',
  action: 'read',
  handler: async (ctx, request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
      const projectId = searchParams.get('projectId');
      const phaseId = searchParams.get('phaseId');
      const assigneeId = searchParams.get('assigneeId');

      let conditions = [eq(projectTasks.organizationId, ctx.organizationId)];
      if (projectId) conditions.push(eq(projectTasks.projectId, Number(projectId)));
      if (phaseId) conditions.push(eq(projectTasks.phaseId, Number(phaseId)));
      if (assigneeId) conditions.push(eq(projectTasks.assigneeId, Number(assigneeId)));

      const tasks = await ctx.db.select()
        .from(projectTasks)
        .where(and(...conditions))
        .orderBy(desc(projectTasks.createdAt))
        .limit(limit);

      ctx.audit.logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        action: 'LIST_TASKS',
        entityType: 'projectTasks',
        entityId: 'ALL'
      });

      return NextResponse.json({ data: tasks, count: tasks.length });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const POST = withEEK({
  resource: 'tasks',
  action: 'write',
  handler: async (ctx, request: Request) => {
    try {
      const data = await request.json();

      const taskResult = await ctx.db.insert(projectTasks).values({
        organizationId: ctx.organizationId,
        projectId: Number(data.projectId),
        phaseId: data.phaseId ? Number(data.phaseId) : null,
        name: data.name || data.title,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        assigneeId: data.assigneeId ? Number(data.assigneeId) : null,
        vendorId: data.vendorId ? Number(data.vendorId) : null,
        cost: data.cost ? String(data.cost) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }).returning();
      
      const task = taskResult[0];

      ctx.audit.logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        action: 'CREATE_TASK',
        entityType: 'projectTasks',
        entityId: String(task.id),
        newData: task
      });

      return NextResponse.json({ data: task }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const PUT = withEEK({
  resource: 'tasks',
  action: 'write',
  handler: async (ctx, request: Request) => {
    try {
      const { id, ...data } = await request.json();
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.priority) updateData.priority = data.priority;
      if (data.name || data.title) updateData.name = data.name || data.title;
      if (data.assigneeId) updateData.assigneeId = Number(data.assigneeId);
      
      updateData.updatedAt = new Date();

      const taskResult = await ctx.db.update(projectTasks)
        .set(updateData)
        .where(and(eq(projectTasks.id, Number(id)), eq(projectTasks.organizationId, ctx.organizationId)))
        .returning();
        
      const task = taskResult[0];
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

      ctx.audit.logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.session.user.id,
        action: 'UPDATE_TASK',
        entityType: 'projectTasks',
        entityId: String(task.id),
        newData: updateData
      });

      return NextResponse.json({ data: task });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});
