import { NextRequest, NextResponse } from "next/server";
import { kernel } from "@/lib/kernel/core";
import { db } from "@/db";
import { ledgerAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_ACCOUNTS = [
   { code: '411', name: 'Clients', type: 'asset' },
   { code: '512', name: 'Banque', type: 'asset' },
   { code: '701', name: 'Ventes', type: 'revenue' },
   { code: '622', name: 'Commissions', type: 'expense' },
   { code: '401', name: 'Fournisseurs', type: 'liability' },
   { code: '101', name: 'Capital Social', type: 'equity' },
];

export async function GET(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let accounts = await db.select()
      .from(ledgerAccounts)
      .where(
         and(
            eq(ledgerAccounts.organizationId, identity.tenantId),
            eq(ledgerAccounts.status, 'active')
         )
      );

    if (accounts.length === 0) {
       // Seed default accounts
       const inserts = DEFAULT_ACCOUNTS.map(a => ({
          organizationId: identity.tenantId,
          code: a.code,
          name: a.name,
          type: a.type,
          status: 'active'
       }));
       await db.insert(ledgerAccounts).values(inserts);

       accounts = await db.select()
         .from(ledgerAccounts)
         .where(
            and(
               eq(ledgerAccounts.organizationId, identity.tenantId),
               eq(ledgerAccounts.status, 'active')
            )
         );
    }

    return NextResponse.json({ success: true, data: accounts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
