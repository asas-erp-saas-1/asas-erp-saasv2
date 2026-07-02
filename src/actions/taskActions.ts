'use server'

import { withActionEEK } from '@/eek/withActionEEK';
import { projectTasks } from '@/db/schema';
import { revalidatePath } from 'next/cache'

interface CreateTaskInput {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  lead_id?: string | null
  deal_id?: string | null
  assigned_to?: string | null
}

export const createTaskAction = withActionEEK({
  resource: 'tasks',
  action: 'write',
  handler: async (ctx, data: CreateTaskInput) => {
    try {
      // Assign to the user creating the task if not explicitly assigned
      const assignee = data.assigned_to || String(ctx.session.user.id)

      const taskResult = await ctx.db.insert(projectTasks).values({
        organizationId: ctx.organizationId,
        name: data.title,
        priority: data.priority,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        assigneeId: assignee ? Number(assignee) : null,
        status: 'todo',
        projectId: Number(data.deal_id || data.lead_id || 1) // Fallback for schema mismatch
      }).returning();
      const task = taskResult[0];
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'ACTION_CREATE_TASK',
         entityType: 'projectTasks',
         entityId: String(task.id),
         newData: task
      });

      revalidatePath('/dashboard/tasks')
      if (data.lead_id) revalidatePath(`/dashboard/leads`)
      if (data.deal_id) revalidatePath(`/dashboard/deals`)

      return { data: task, error: null }
    } catch (error: any) {
      console.error('Create task error:', error)
      return { data: null, error: error.message }
    }
  }
})
