import { db } from '@/db';
import { opportunities, contacts, users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logAudit } from '@/lib/enterprise/audit';

export class OpportunityService {
  static async createOpportunity(
    organizationId: string,
    data: { contactId: string; leadId?: string; assignedTo?: string; stage?: string; estimatedValue?: number | string; probability?: number; expectedCloseDate?: string },
    createdBy: string
  ) {
    return await db.transaction(async (tx) => {
      const [newOpp] = await tx.insert(opportunities).values({
        organizationId,
        ...data,
        estimatedValue: data.estimatedValue !== undefined ? String(data.estimatedValue) : null,
        createdBy
      }).returning();

      await logAudit({
        organizationId,
        userId: createdBy,
        action: 'CREATE_OPPORTUNITY',
        entityType: 'opportunities',
        entityId: newOpp.id,
        newData: data
      });

      return newOpp;
    });
  }

  static async listOpportunities(organizationId: string) {
    return await db.select({
      id: opportunities.id,
      stage: opportunities.stage,
      estimatedValue: opportunities.estimatedValue,
      probability: opportunities.probability,
      expectedCloseDate: opportunities.expectedCloseDate,
      contact: {
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        companyName: contacts.companyName
      },
      assignedTo: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(opportunities)
    .leftJoin(contacts, eq(opportunities.contactId, contacts.id))
    .leftJoin(users, eq(opportunities.assignedTo, users.id))
    .where(and(eq(opportunities.organizationId, organizationId), isNull(opportunities.deletedAt)));
  }

  static async updateOpportunityStage(organizationId: string, opportunityId: string, stage: string, updatedBy: string) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(opportunities)
        .set({ stage, updatedAt: new Date(), updatedBy })
        .where(and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)))
        .returning();

      await logAudit({
        organizationId,
        userId: updatedBy,
        action: 'UPDATE_OPPORTUNITY_STAGE',
        entityType: 'opportunities',
        entityId: opportunityId,
        newData: { stage }
      });

      return updated;
    });
  }
}
