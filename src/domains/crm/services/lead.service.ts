import { db } from '@/db';
import { leads, opportunities, contacts } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logAudit } from '@/lib/enterprise/audit';

export class LeadService {
  static async createLead(
    organizationId: string,
    data: { contactId?: string; assignedTo?: string; status?: string; source?: string; interestLevel?: string; notes?: string },
    createdBy: string
  ) {
    return await db.transaction(async (tx) => {
      const [newLead] = await tx.insert(leads).values({
        organizationId,
        ...data,
        createdBy
      }).returning();

      await logAudit({
        organizationId,
        userId: createdBy,
        action: 'CREATE_LEAD',
        entityType: 'leads',
        entityId: newLead.id,
        newData: data
      });

      return newLead;
    });
  }

  static async listLeads(organizationId: string) {
    return await db.select({
      id: leads.id,
      contactId: leads.contactId,
      assignedTo: leads.assignedTo,
      status: leads.status,
      source: leads.source,
      interestLevel: leads.interestLevel,
      notes: leads.notes,
      createdAt: leads.createdAt,
      contact: {
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone
      }
    })
    .from(leads)
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .where(and(eq(leads.organizationId, organizationId), isNull(leads.deletedAt)));
  }

  static async convertLead(organizationId: string, leadId: string, convertedBy: string) {
    return await db.transaction(async (tx) => {
      const lead = await tx.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.organizationId, organizationId))).limit(1);
      
      if (!lead.length) {
        throw new Error('Lead not found');
      }

      if (!lead[0].contactId) {
        throw new Error('Lead must have an associated contact to convert');
      }

      // Update lead status
      const [updatedLead] = await tx.update(leads)
        .set({ status: 'converted', updatedAt: new Date(), updatedBy: convertedBy })
        .where(eq(leads.id, leadId))
        .returning();

      // Create opportunity
      const [newOpportunity] = await tx.insert(opportunities).values({
        organizationId,
        contactId: lead[0].contactId,
        leadId: lead[0].id,
        assignedTo: lead[0].assignedTo,
        stage: 'prospecting',
        createdBy: convertedBy
      }).returning();

      await logAudit({
        organizationId,
        userId: convertedBy,
        action: 'CONVERT_LEAD',
        entityType: 'leads',
        entityId: leadId,
        newData: { status: 'converted', createdOpportunityId: newOpportunity.id }
      });

      return { lead: updatedLead, opportunity: newOpportunity };
    });
  }
}
