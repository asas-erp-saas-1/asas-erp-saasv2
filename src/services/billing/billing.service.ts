import { kernel } from '@/lib/kernel/core';

export type PlanType = 'basic' | 'pro' | 'elite';

export class BillingService {
  static async getSubscription(tenantId: string) {
    const subs = await kernel.query<any>('subscriptions', {
      filters: { tenant_id: tenantId }
    });
    return subs.length > 0 ? subs[0] : null;
  }

  static async createInvoice(tenantId: string, amount: number, description: string) {
    await kernel.mutate('invoices', 'INSERT', {
      tenant_id: tenantId,
      amount,
      description,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  static async chargeMonthly(tenantId: string) {
    await kernel.transaction(async (tx) => {
      const sub = await this.getSubscription(tenantId);
      if (!sub) return;

      let amount = 0;
      switch (sub.plan) {
        case 'basic': amount = 49; break;
        case 'pro': amount = 99; break;
        case 'elite': amount = 299; break;
      }

      await tx.mutate('invoices', 'INSERT', {
        tenant_id: tenantId,
        amount,
        description: `${String(sub.plan).toUpperCase()} Plan - Monthly`,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    });
  }
}
