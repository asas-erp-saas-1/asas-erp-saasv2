'use server'

import { withActionEEK } from '@/eek/withActionEEK';
import { deals, clients } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { initializeEventKernel } from '@/lib/db/eventKernel'
import { revalidatePath } from 'next/cache'

// Define our types
export type DealStage = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CONTRACT_PENDING' | 'CLOSED_WON' | 'CANCELLED';

export interface DealWithClient {
  id: string;
  stage: DealStage;
  agreed_price: number;
  client: {
    first_name: string;
    last_name: string;
  };
}

export const fetchActiveDeals = withActionEEK({
  resource: 'deals',
  action: 'read',
  handler: async (ctx, context?: string): Promise<DealWithClient[]> => {
    const dealsResult = await ctx.db.select({
      id: deals.id,
      stage: deals.status,
      agreed_price: deals.agreedPrice,
      agency_id: deals.organizationId,
      client: {
        first_name: clients.firstName,
        last_name: clients.lastName
      }
    })
    .from(deals)
    .leftJoin(clients, eq(deals.clientId, clients.id))
    .where(eq(deals.organizationId, ctx.organizationId))
    .orderBy(desc(deals.createdAt));
    
    const dealsData = dealsResult;
    
    ctx.audit.logAudit({
       organizationId: ctx.organizationId,
       userId: ctx.session.user.id,
       action: 'ACTION_FETCH_ACTIVE_DEALS',
       entityType: 'deals',
       entityId: 'ALL'
    });

    // Transform the response to match the DealWithClient interface
    return dealsData.map((d: any) => ({
      id: d.id,
      stage: d.stage,
      agreed_price: d.agreed_price,
      agency_id: d.agency_id,
      client: {
        first_name: d.client?.first_name || 'Unknown',
        last_name: d.client?.last_name || 'Client',
      }
    }));
  }
});

export const updateDealStage = withActionEEK({
  resource: 'deals',
  action: 'write',
  handler: async (ctx, input: { dealId: string, newStage: DealStage, agencyId: string }) => {
    const oldDealResult = await ctx.db.select({ stage: deals.status }).from(deals).where(and(eq(deals.id, Number(input.dealId)), eq(deals.organizationId, ctx.organizationId))).limit(1);
    const oldDeal = oldDealResult[0];

    const updateResult = await ctx.db.update(deals).set({ status: input.newStage }).where(and(eq(deals.id, Number(input.dealId)), eq(deals.organizationId, ctx.organizationId))).returning();
    if (updateResult.length === 0) {
      throw new Error('Could not update deal stage');
    }
    const user = { id: ctx.session.user.id };
    
    ctx.audit.logAudit({
       organizationId: ctx.organizationId,
       userId: ctx.session.user.id,
       action: 'ACTION_UPDATE_DEAL_STAGE',
       entityType: 'deals',
       entityId: String(input.dealId),
       newData: { stage: input.newStage }
    });

    // 4. Synchronously trigger the Event Kernel to maintain full traceability
    try {
      const kernel = initializeEventKernel(supabase);
      await kernel.publish({
        eventType: 'Sales.DealStageAdvanced',
        aggregateType: 'Deal',
        aggregateId: input.dealId,
        agencyId: input.agencyId, // Context/Agency ID
        performedByUserId: user?.id || "",
        payload: {
          aggregateId: input.dealId,
          agencyId: input.agencyId,
          oldState: { stage: oldDeal?.stage },
          newState: { stage: input.newStage },
          metadata: {
            action: 'drag_and_drop_pipeline',
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (eventError) {
      console.error('Event Kernel synchronization failed:', eventError);
      // Depending on strictness, we might throw here to rollback, 
      // but we'll log it as per standard async side-effecting.
    }

    // 5. Revalidate the CRM pipeline page path to clear cache
    revalidatePath('/crm/pipeline');

    return { success: true, newStage: input.newStage };
  }
});
