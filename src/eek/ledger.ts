import { db } from "@/db";
import { journalEntries, ledgerAccounts } from "@/db/schema";
import { Session } from "./types";
import { v4 as uuidv4 } from "uuid";

export interface DoubleEntry {
  debitAccountId: number;
  creditAccountId: number;
  amount: string; // use string/decimal
  dealId?: number;
  description: string;
}

export class LedgerService {
  constructor(private session: Session) {}

  async recordTransaction(entry: DoubleEntry) {
    // 1. Immutable append only
    // 2. Double entry strictly enforced

    const transactionId = uuidv4();

    await db.transaction(async (tx) => {
      // Debit entry
      await tx.insert(journalEntries).values({
        organizationId: this.session.organizationId,
        ledgerAccountId: entry.debitAccountId,
        transactionId,
        dealId: entry.dealId,
        amount: entry.amount,
        entryType: "debit",
        description: entry.description,
        actorId: this.session.user.id,
      });

      // Credit entry
      await tx.insert(journalEntries).values({
        organizationId: this.session.organizationId,
        ledgerAccountId: entry.creditAccountId,
        transactionId,
        dealId: entry.dealId,
        amount: entry.amount,
        entryType: "credit",
        description: entry.description,
        actorId: this.session.user.id,
      });
    });

    return transactionId;
  }
}
