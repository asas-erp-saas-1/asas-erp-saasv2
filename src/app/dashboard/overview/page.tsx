import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CommandCenterGlobal } from '@/modules/dashboard/components/CommandCenterGlobal';
import { withPageEEK } from '@/eek/withPageEEK';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Global Command Center V2 — ASAS OS',
  description: 'Enterprise Real Estate Operating System',
}

export default withPageEEK({
  resource: 'dashboard',
  action: 'read',
  handler: async (ctx) => {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <CommandCenterGlobal />
      </div>
    );
  }
});
