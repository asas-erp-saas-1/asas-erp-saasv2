import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';

export const GET = withEEK({
  resource: 'metrics',
  action: 'read',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated legacy execution path." }, { status: 410 });
  }
});
