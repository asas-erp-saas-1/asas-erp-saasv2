import React from 'react';
import { SecurityRBACModule } from '@/modules/dashboard/components/SecurityRBACModule';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  return (
    <div className="flex flex-col gap-8 pb-10 h-full">
      <SecurityRBACModule />
    </div>
  );
}
