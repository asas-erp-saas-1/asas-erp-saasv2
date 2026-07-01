'use server';

import { withActionEEK } from '@/eek/withActionEEK';
import { LeadService } from '@/services/leads/lead.service';
import { ErrorTracker } from '@/lib/observability/errors';
import { revalidatePath } from 'next/cache';

export const updateLeadStatusAction = withActionEEK({
  resource: 'leads',
  action: 'write',
  handler: async (ctx, input: { id: string, newStatus: string, metadata?: { lostReason?: string } }) => {
    try {
      const lead = await LeadService.updateStatus(input.id, input.newStatus, input.metadata);
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'ACTION_UPDATE_LEAD_STATUS',
         entityType: 'leads',
         entityId: String(lead.id),
         newData: lead
      });

      revalidatePath('/dashboard/leads');
      return { success: true, data: lead };
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'updateLeadStatusAction' });
      return { success: false, error: error.message };
    }
  }
});

