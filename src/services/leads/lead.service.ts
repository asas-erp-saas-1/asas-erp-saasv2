import { kernel } from '@/lib/kernel/core';
import { Database } from '@/types/supabase';
import type { Lead } from '@/types/app';

export class LeadService {
  static async getLeads(limit = 50, offset = 0): Promise<Lead[]> {
    const leads = await kernel.query<any>('leads', {
      select: '*, clients(full_name, phone), profiles(full_name), projects(name)',
      filters: { deleted_at: null },
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    });
    return leads as Lead[];
  }

  static async createLead(data: { clientId: string; source?: string; budgetMin?: number; budgetMax?: number; assignedAgent?: string }): Promise<Lead> {
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
    return lead as Lead;
  }

  static async assignLead(leadId: string, agentId: string): Promise<Lead> {
    const lead = await kernel.mutate<any>('leads', 'UPDATE', {
      assigned_agent: agentId
    }, { id: leadId, deleted_at: null });
    return lead as Lead;
  }
  
  static async updateStatus(leadId: string, status: Database['public']['Enums']['lead_status']): Promise<Lead> {
    const lead = await kernel.mutate<any>('leads', 'UPDATE', {
      status,
      last_activity: new Date().toISOString()
    }, { id: leadId, deleted_at: null });
    return lead as Lead;
  }

  static async deleteLead(leadId: string): Promise<void> {
    await kernel.mutate('leads', 'UPDATE', {
      deleted_at: new Date().toISOString(),
      status: 'lost'
    }, { id: leadId });
  }
}

