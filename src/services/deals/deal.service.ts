import { kernel } from '@/lib/kernel/core';
import { Database } from '@/types/supabase';

export interface DealDTO {
  id: string;
  clientId: string;
  propertyId: string;
  agentId: string;
  agreedPrice: number;
  status: Database['public']['Enums']['deal_status'];
  riskLevel: Database['public']['Enums']['risk_level'];
  leadId: string | null;
}

export class DealService {
  private static toDTO(deal: any): DealDTO {
    return {
      id: deal.id,
      clientId: deal.client_id,
      propertyId: deal.property_id,
      agentId: deal.agent_id,
      agreedPrice: deal.agreed_price,
      status: deal.status,
      riskLevel: deal.risk_level,
      leadId: deal.lead_id,
    };
  }

  static async getDeals() {
    const deals = await kernel.query<any>('deals', {
      select: 'id, client_id, property_id, agent_id, agreed_price, status, risk_level, lead_id',
      filters: { deleted_at: null },
      orderBy: { column: 'created_at', ascending: false }
    });
    return deals.map(this.toDTO);
  }

  static async createDeal(data: { clientId: string; propertyId: string; agreedPrice: number; dealType: Database['public']['Enums']['deal_type']; leadId?: string; agentId?: string }) {
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
    });
    return this.toDTO(deal);
  }

  static async changeDealStatus(dealId: string, status: Database['public']['Enums']['deal_status'], currentVersion: number = 1) {
    const deal = await kernel.mutate<any>('deals', 'UPDATE', {
      status,
      version: currentVersion + 1
    }, { id: dealId });
    return this.toDTO(deal);
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

      // 2. Update the deal scheduled payments
      // Note: In real life this requires fetching the deal first and adding, 
      // but for atomic changes this is basic scaffolding.
      // E.g. we might have triggers handling this or we recalculate.
      
      return payment;
    });
  }
}

