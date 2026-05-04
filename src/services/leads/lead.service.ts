import { kernel } from '@/lib/kernel/core';
import { Database } from '@/types/supabase';

export interface LeadDTO {
  id: string;
  clientId: string;
  assignedAgent: string | null;
  status: Database['public']['Enums']['lead_status'];
  budgetMin: number | null;
  budgetMax: number | null;
  source: Database['public']['Enums']['lead_source'] | null;
  createdAt: string;
}

export class LeadService {
  private static toDTO(lead: any): LeadDTO {
    return {
      id: lead.id,
      clientId: lead.client_id,
      assignedAgent: lead.assigned_agent,
      status: lead.status,
      budgetMin: lead.budget_min,
      budgetMax: lead.budget_max,
      source: lead.source,
      createdAt: lead.created_at,
    };
  }

  static async getLeads(limit = 50, offset = 0): Promise<LeadDTO[]> {
    const leads = await kernel.query<any>('leads', {
      select: '*',
      filters: { deleted_at: null },
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    });
    return leads.map(this.toDTO);
  }

  static async createLead(data: { clientId: string; source?: string; budgetMin?: number; budgetMax?: number; assignedAgent?: string }): Promise<LeadDTO> {
    const identity = await kernel.identity();
    const lead = await kernel.mutate<any>('leads', 'INSERT', {
      agency_id: identity.tenantId,
      client_id: data.clientId,
      source: data.source || null,
      budget_min: data.budgetMin || null,
      budget_max: data.budgetMax || null,
      assigned_agent: data.assignedAgent || null,
      status: 'new',
      last_activity: new Date().toISOString(),
      cached_score: 0,
      score_tier: 'starter',
    });
    return this.toDTO(lead);
  }

  static async assignLead(leadId: string, agentId: string): Promise<LeadDTO> {
    const lead = await kernel.mutate<any>('leads', 'UPDATE', {
      assigned_agent: agentId
    }, { id: leadId, deleted_at: null });
    return this.toDTO(lead);
  }
  
  static async updateStatus(leadId: string, status: Database['public']['Enums']['lead_status']): Promise<LeadDTO> {
    const lead = await kernel.mutate<any>('leads', 'UPDATE', {
      status
    }, { id: leadId, deleted_at: null });
    return this.toDTO(lead);
  }

  static async deleteLead(leadId: string): Promise<void> {
    await kernel.mutate('leads', 'UPDATE', {
      deleted_at: new Date().toISOString(),
      status: 'lost'
    }, { id: leadId });
  }
}

