'use server'

import { withActionEEK } from '@/eek/withActionEEK'
import { kernel } from '@/lib/kernel/core'
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

      const task = await kernel.mutate<any>('tasks', 'INSERT', {
        agency_id: ctx.organizationId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        due_date: data.due_date || null,
        assigned_to: assignee,
        created_by: ctx.session.user.id,
        lead_id: data.lead_id || null,
        deal_id: data.deal_id || null,
        status: 'pending', // default status
        is_automated: false
      })
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'ACTION_CREATE_TASK',
         entityType: 'tasks',
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
