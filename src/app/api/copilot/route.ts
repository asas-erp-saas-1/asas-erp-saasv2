import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated legacy execution path." }, { status: 410 });
  }
});
export const POST = withEEK({
  resource: 'system',
  action: 'write',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated legacy execution path." }, { status: 410 });
  }
});
