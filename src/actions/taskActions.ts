'use server'

import { db } from '@/db'
import { tasks } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/enterprise/auth'

interface CreateTaskInput {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string | null
  lead_id?: string | null
  deal_id?: string | null
  assigned_to?: string | null
}

export async function createTaskAction(data: CreateTaskInput) {
  try {
    const session = await getSession()

    if (!session || !session.userId) {
      throw new Error('Non authentifié')
    }

    // Assign to the user creating the task if not explicitly assigned
    const assignee = data.assigned_to || session.userId

    let entityType = null;
    let entityId = null;
    
    if (data.deal_id) {
       entityType = 'deal';
       entityId = data.deal_id;
    } else if (data.lead_id) {
       entityType = 'lead';
       entityId = data.lead_id;
    }

    const [task] = await db.insert(tasks).values({
      organizationId: session.organizationId,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      assignedTo: assignee,
      createdBy: session.userId,
      entityType: entityType,
      entityId: entityId,
      status: 'open',
    }).returning()

    revalidatePath('/dashboard/tasks')
    if (data.lead_id) revalidatePath(`/dashboard/leads`)
    if (data.deal_id) revalidatePath(`/dashboard/deals`)

    return { data: { ...task, assigned_to: task.assignedTo }, error: null }
  } catch (error: any) {
    console.error('Create task error:', error)
    return { data: null, error: error.message }
  }
}
