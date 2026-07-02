import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';

export const POST = withEEK({
  resource: 'system',
  action: 'read',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated" }, { status: 410 });
  }
});
export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async () => {
    return NextResponse.json({ error: "Deprecated" }, { status: 410 });
  }
});
