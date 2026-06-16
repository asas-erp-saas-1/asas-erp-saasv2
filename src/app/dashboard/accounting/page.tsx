import React from 'react';
import { Metadata } from 'next';
import { AccountingLedger } from '@/modules/dashboard/components/AccountingLedger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accounting Ledger — ASAS OS',
  description: 'Oracle ERP Logic - Comptabilité Générale',
}

export default async function AccountingPage() {
  return (
    <div className="flex flex-col gap-8 pb-10 h-full">
      <AccountingLedger />
    </div>
  );
}
