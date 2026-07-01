'use server';

import { withActionEEK } from '@/eek/withActionEEK';
import { DealService } from '@/services/deals/deal.service';
import { ErrorTracker } from '@/lib/observability/errors';
import { revalidatePath } from 'next/cache';

export const createDealAction = withActionEEK({
  resource: 'deals',
  action: 'write',
  handler: async (ctx, data: any) => {
    try {
      // Pass the ctx context if DealService is refactored, otherwise this acts as a boundary wrapper
      const deal = await DealService.createDeal(data);
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'ACTION_CREATE_DEAL',
         entityType: 'deals',
         entityId: String(deal.id),
         newData: deal
      });
      
      revalidatePath('/dashboard/deals');
      return { success: true, data: deal };
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'createDealAction' });
      return { success: false, error: error.message };
    }
  }
});

export const updateDealStageAction = withActionEEK({
  resource: 'deals',
  action: 'write',
  handler: async (ctx, input: { id: string, stage: string, currentVersion?: number, metadata?: { lostReason?: string } }) => {
    try {
      const deal = await DealService.changeDealStatus(
        input.id, 
        input.stage, 
        input.currentVersion || 1, 
        input.metadata
      );
      
      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'ACTION_UPDATE_DEAL_STAGE',
         entityType: 'deals',
         entityId: String(deal.id),
         newData: deal
      });
      
      revalidatePath('/dashboard/deals');
      return { success: true, data: deal };
    } catch (error: any) {
      ErrorTracker.captureError(error, { context: 'updateDealStageAction' });
      return { success: false, error: error.message };
    }
  }
});

