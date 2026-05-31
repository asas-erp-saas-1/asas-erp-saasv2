// src/lib/kernel/inbox.ts

import { SystemEvent } from './core';

export interface InboxTask {
  id?: string;
  taskType: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ESCALATED';
  assigneeId?: string;
  roleTarget?: string;
  domain: string;
  referenceAggregateType: string;
  referenceAggregateId: string;
  dueDate?: Date;
  slaBreachAt?: Date;
  payload?: any;
}

/**
 * Inbox Generator Engine
 * Pushes tasks to operational actors based on events.
 */
export class InboxEngine {
  
  /**
   * Generates an inbox task and stores it.
   */
  async generateTask(task: InboxTask): Promise<void> {
    // Note: implementation connects to Supabase `execution_inbox` table.
    console.log(`[INBOX ROUTER]: Routing Task '${task.title}' to role: ${task.roleTarget || 'UNASSIGNED'} (User: ${task.assigneeId || 'UNASSIGNED'})`);
    // Example: await supabase.from('execution_inbox').insert(task)
  }

  /**
   * Evaluates SLAs and triggers escalations.
   * Typical chron-job run function.
   */
  async evaluateSLAs(): Promise<void> {
     console.log('[INBOX SLA ENGINE]: Checking breached tasks implementation...');
     // Find tasks where sla_breach_at < NOW() and status = 'PENDING'
     // Emit event: TaskSLABreached
  }
}

export const inboxEngine = new InboxEngine();

/**
 * Common Task Generators
 */
export const TaskGenerators = {
    requireFinancialApproval: async (aggregateId: string, amount: number, requestedBy: string) => {
        await inboxEngine.generateTask({
            taskType: 'FINANCIAL_APPROVAL',
            title: `Approve Financial Value: ${amount} DZD`,
            priority: 'HIGH',
            status: 'PENDING',
            roleTarget: 'FINANCE_MANAGER',
            domain: 'Finance',
            referenceAggregateType: 'Deal',
            referenceAggregateId: aggregateId,
            payload: { amount, requestedBy }
        });
    },

    requireLegalContractReview: async (dealId: string) => {
        await inboxEngine.generateTask({
            taskType: 'CONTRACT_REVIEW',
            title: `Review Notary Contract for Deal ${dealId}`,
            priority: 'MEDIUM',
            status: 'PENDING',
            roleTarget: 'LEGAL_OFFICER',
            domain: 'Legal',
            referenceAggregateType: 'Deal',
            referenceAggregateId: dealId,
        });
    }
};
