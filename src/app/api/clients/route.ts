import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const clients = await kernel.query('clients');
    return NextResponse.json({ data: clients, count: clients.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
