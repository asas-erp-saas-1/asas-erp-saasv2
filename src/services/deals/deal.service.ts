import { kernel } from '@/lib/kernel/core';
import { Database } from '@/types/supabase';
import type { Deal } from '@/types/app';

export class DealService {
  static async getDeals(): Promise<Deal[]> {
    const deals = await kernel.query<any>('deals', {
      select: '*, clients(full_name, phone), profiles(full_name), properties(*, projects(name))',
      filters: { deleted_at: null },
      orderBy: { column: 'created_at', ascending: false }
    });
    return deals as Deal[];
  }

  static async createDeal(data: { clientId: string; propertyId: string; agreedPrice: number; dealType: Database['public']['Enums']['deal_type']; leadId?: string; agentId?: string }): Promise<Deal> {
    const identity = await kernel.identity();
    const deal = await kernel.mutate<any>('deals', 'INSERT', {
      agency_id: identity.tenantId,
      client_id: data.clientId,
      property_id: data.propertyId,
      agent_id: data.agentId || identity.userId,
      agreed_price: data.agreedPrice,
      deal_type: data.dealType,
      lead_id: data.leadId || null,
      status: 'draft',
      risk_level: 'low',
      total_payments_scheduled: 0,
      total_payments_received: 0,
      is_current: true,
      commission_generated: false,
      version: 1
    });
    return deal as Deal;
  }

  static async changeDealStatus(dealId: string, status: Database['public']['Enums']['deal_status'], currentVersion: number = 1, metadata?: { lostReason?: string }): Promise<Deal> {
    const payload: any = {
      status,
      version: currentVersion + 1
    }
    if (metadata?.lostReason) {
      payload.lost_reason = metadata.lostReason
    }

    const deal = await kernel.mutate<any>('deals', 'UPDATE', payload, { id: dealId });
    return deal as Deal;
  }

  static async registerPayment(dealId: string, amount: number, dueDate: string) {
    return await kernel.transaction(async (tx) => {
      // 1. Log payment
      const payment = await tx.mutate<any>('deal_payments', 'INSERT', {
        deal_id: dealId,
        amount,
        due_date: dueDate,
        status: 'pending'
      });
      return payment;
    });
  }
}

