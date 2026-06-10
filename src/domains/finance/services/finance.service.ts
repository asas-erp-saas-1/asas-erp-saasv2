import { db } from '@/db';
import { invoices, installments, contracts } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logAudit } from '@/lib/enterprise/audit';
import { LedgerEngine } from '@/lib/enterprise/ledger';

export class FinanceService {
  static async createInvoice(
    organizationId: string,
    data: { contactId: string; contractId?: string; installmentId?: string; referenceCode: string; amount: number | string; issueDate: string; dueDate: string },
    createdBy: string
  ) {
    return await db.transaction(async (tx) => {
      // 1. Create Invoice
      const [newInvoice] = await tx.insert(invoices).values({
        organizationId,
        ...data,
        amount: String(data.amount),
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        status: 'unpaid',
        createdBy
      }).returning();

      // 2. Ledger Post: Accrual entry (Debit Accounts Receivable (411), Credit Revenue (70))
      // Based on enterprise double-entry rules.
      await LedgerEngine.postEntry(
         organizationId,
         createdBy,
         data.referenceCode,
         `Facturation client - ${data.referenceCode}`,
         [
            { accountCode: '411', direction: 'debit', amount: Number(data.amount), description: 'Créance Client' },
            { accountCode: '708', direction: 'credit', amount: Number(data.amount), description: 'Produit des activités' },
         ]
      );

      // 3. Mark Installment as invoiced if applicable
      if (data.installmentId) {
        await tx.update(installments)
          .set({ status: 'invoiced', updatedAt: new Date(), updatedBy: createdBy })
          .where(eq(installments.id, data.installmentId));
      }

      await logAudit({
        organizationId,
        userId: createdBy,
        action: 'CREATE_INVOICE',
        entityType: 'invoices',
        entityId: newInvoice.id,
        newData: data
      });

      return newInvoice;
    });
  }

  static async listInvoices(organizationId: string) {
    return await db.select()
      .from(invoices)
      .where(and(eq(invoices.organizationId, organizationId), isNull(invoices.deletedAt)));
  }

  static async markInvoicePaid(organizationId: string, invoiceId: string, updatedBy: string) {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(invoices)
        .set({ status: 'paid', updatedAt: new Date(), updatedBy })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)))
        .returning();

      if (!updated) {
         throw new Error('Invoice not found');
      }

      if (updated.installmentId) {
        await tx.update(installments)
           .set({ status: 'paid', updatedAt: new Date(), updatedBy })
           .where(eq(installments.id, updated.installmentId));
      }

      await logAudit({
        organizationId,
        userId: updatedBy,
        action: 'MARK_INVOICE_PAID',
        entityType: 'invoices',
        entityId: invoiceId,
        newData: { status: 'paid' }
      });

      return updated;
    });
  }
}
