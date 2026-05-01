import { kernel } from '@/lib/kernel/core';

export interface LeadDTO {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  budget: number | null;
  assignedTo: string | null;
}

export class LeadService {
  private static toDTO(lead: any): LeadDTO {
    return {
      id: lead.id,
      fullName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
      phone: lead.phone,
      status: lead.status,
      budget: lead.budget || null,
      assignedTo: lead.assigned_to || null,
    };
  }

  static async getLeads(): Promise<LeadDTO[]> {
    const leads = await kernel.query<any>('leads', {
      select: '*',
      filters: { is_deleted: false },
      orderBy: { column: 'created_at', ascending: false }
    });
    return leads.map(this.toDTO);
  }

  static async createLead(data: { firstName: string; lastName: string; phone: string; budget?: number }): Promise<LeadDTO> {
    const lead = await kernel.mutate<any>('leads', 'INSERT', {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      budget: data.budget,
      status: 'new',
      is_deleted: false
    });
    return this.toDTO(lead);
  }

  static async assignLead(leadId: string, agentId: string): Promise<LeadDTO> {
    const lead = await kernel.mutate<any>('leads', 'UPDATE', {
      assigned_to: agentId
    }, { id: leadId, is_deleted: false });
    return this.toDTO(lead);
  }

  static async deleteLead(leadId: string): Promise<void> {
    // Implementing Soft Delete instead of hard delete to preserve history
    await kernel.mutate('leads', 'UPDATE', {
      is_deleted: true,
      status: 'deleted'
    }, { id: leadId });
  }
}

