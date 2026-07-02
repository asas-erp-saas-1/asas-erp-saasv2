import { EEKProtectedContext } from '@/eek/types';
import { deals, clients, users, properties, projects, payments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { DealStateMachine, DEAL_TRANSITION_META } from '@/core/stateMachine';

export class DealService {
  static async getDeals(ctx: EEKProtectedContext) {
    // This is typically done directly in the route, but here it is
    const result = await ctx.db.select().from(deals).where(eq(deals.organizationId, ctx.organizationId)).orderBy(desc(deals.createdAt));
    return result;
  }

  static async createDeal(ctx: EEKProtectedContext, data: { clientId: string; propertyId: string; agreedPrice: number; dealType: string; leadId?: string; agentId?: string }) {
    return await ctx.db.transaction(async (tx) => {
      const dealResult = await tx.insert(deals).values({
        organizationId: ctx.organizationId,
        reference: `DEAL-${Date.now()}`,
        clientId: Number(data.clientId),
        propertyId: Number(data.propertyId),
        agentId: data.agentId ? Number(data.agentId) : ctx.session.user.id,
        agreedPrice: String(data.agreedPrice),
        dealType: data.dealType,
        status: 'draft'
      }).returning();
      
      const deal = dealResult[0];

      // Note: updating lead status not implemented here if leads schema differs
      // Add logic if needed...
      
      return deal;
    });
  }

  static async changeDealStatus(
    ctx: EEKProtectedContext,
    dealId: string | number, 
    status: string, 
    currentVersion: number = 1, 
    metadata?: { lostReason?: string }
  ) {
    return await ctx.db.transaction(async (tx) => {
      const dealResult = await tx.select().from(deals).where(and(eq(deals.id, Number(dealId)), eq(deals.organizationId, ctx.organizationId))).limit(1);
      if (dealResult.length === 0) throw new Error(`Deal ${dealId} not found.`);
      const currentDeal = dealResult[0];

      const stateMachine = new DealStateMachine(currentDeal.status);
      const validation = stateMachine.validate(status as any);
      if (!validation.ok) throw new Error(validation.error || `Invalid transition`);

      const updatedDeal = await tx.update(deals).set({
        status: status,
        updatedAt: new Date()
      }).where(eq(deals.id, currentDeal.id)).returning();

      return updatedDeal[0];
    });
  }

  static async registerPayment(ctx: EEKProtectedContext, dealId: string | number, amount: number, dueDate: string) {
    // Requires a payments table schema, omitted for brevity.
    throw new Error('Not implemented. Use LedgerService for financial records.');
  }
}
