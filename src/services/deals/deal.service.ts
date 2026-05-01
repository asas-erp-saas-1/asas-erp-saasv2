import { kernel } from '@/lib/kernel/core';

export class DealService {
  static async getDeals() {
    return await kernel.query('deals', {
      select: 'id, amount, stage, probability, agent_id, lead_id',
    });
  }

  static async createDeal(data: { title: string; dealValue: number; leadId?: string }) {
    return await kernel.mutate('deals', 'INSERT', {
      title: data.title,
      amount: data.dealValue,
      lead_id: data.leadId || null,
      stage: 'prospect',
      probability: 10,
    });
  }

  static async moveDealStage(dealId: string, newStage: string) {
    return await kernel.mutate('deals', 'UPDATE', {
      stage: newStage
    }, { id: dealId });
  }

  static async registerTransaction(dealId: string, amount: number, type: string) {
    return await kernel.transaction(async (tx) => {
      // 1. Log transaction
      const trx = await tx.mutate('transactions', 'INSERT', {
        deal_id: dealId,
        amount,
        type
      });

      // 2. We could update the deal summary here
      // Let's assume we update some total on the deal
      await tx.mutate('deals', 'UPDATE', {
        last_transaction_at: new Date().toISOString()
      }, { id: dealId });

      return trx;
    });
  }
}
