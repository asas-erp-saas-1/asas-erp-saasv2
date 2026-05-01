import { kernel } from '@/lib/kernel/core';

export class LeadService {
  static async getLeads() {
    return await kernel.query('leads', {
      select: 'id, first_name, last_name, phone, status, assigned_to',
      orderBy: { column: 'created_at', ascending: false }
    });
  }

  static async createLead(data: { firstName: string; lastName: string; phone: string; budget?: number }) {
    return await kernel.mutate('leads', 'INSERT', {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      budget: data.budget,
      status: 'new'
    });
  }

  static async assignLead(leadId: string, agentId: string) {
    return await kernel.mutate('leads', 'UPDATE', {
      assigned_to: agentId
    }, { id: leadId });
  }

  static async deleteLead(leadId: string) {
    return await kernel.mutate('leads', 'DELETE', {}, { id: leadId });
  }
}
