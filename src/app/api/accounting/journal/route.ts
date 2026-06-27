import { NextRequest, NextResponse } from "next/server";
import { kernel } from "@/lib/kernel/core";
import { db } from "@/db";
import { journalEntries, ledgerAccounts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch journal entries with their corresponding account details
    const entries = await db.select({
       id: journalEntries.id,
       transactionId: journalEntries.transactionId,
       amount: journalEntries.amount,
       entryType: journalEntries.entryType,
       description: journalEntries.description,
       createdAt: journalEntries.createdAt,
       accountCode: ledgerAccounts.code,
       accountName: ledgerAccounts.name,
    })
    .from(journalEntries)
    .innerJoin(ledgerAccounts, eq(journalEntries.ledgerAccountId, ledgerAccounts.id))
    .where(eq(journalEntries.organizationId, identity.tenantId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(100);

    // Group by transactionId to form double-entry views
    const grouped: Record<string, any> = {};
    for (const e of entries) {
       if (!grouped[e.transactionId]) {
          grouped[e.transactionId] = {
             transactionId: e.transactionId,
             description: e.description,
             createdAt: e.createdAt,
             lines: []
          };
       }
       grouped[e.transactionId].lines.push({
          id: e.id,
          accountCode: e.accountCode,
          accountName: e.accountName,
          amount: Number(e.amount),
          entryType: e.entryType
       });
    }

    return NextResponse.json({ success: true, data: Object.values(grouped) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { description, lines } = await req.json();

    if (!lines || lines.length < 2) {
       return NextResponse.json({ success: false, error: 'Double-entry strictly requires at least two lines' }, { status: 400 });
    }

    // Validate balance
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const l of lines) {
       if (l.entryType === 'debit') totalDebit += Number(l.amount);
       if (l.entryType === 'credit') totalCredit += Number(l.amount);
    }

    if (totalDebit !== totalCredit) {
       return NextResponse.json({ success: false, error: `Imbalanced entry! Debits: ${totalDebit}, Credits: ${totalCredit}` }, { status: 400 });
    }

    const transactionId = `TX-${Date.now().toString().slice(-8)}`;

    const inserts = lines.map((l: any) => ({
       organizationId: identity.tenantId,
       ledgerAccountId: Number(l.accountId),
       transactionId,
       amount: l.amount.toString(),
       entryType: l.entryType,
       description: description || 'Manual Journal Entry',
       actorId: identity.userId,
    }));

    await db.insert(journalEntries).values(inserts);

    return NextResponse.json({ success: true, transactionId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
