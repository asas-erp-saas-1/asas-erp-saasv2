import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tasks = await kernel.query('tasks');
    return NextResponse.json({ data: tasks, count: tasks.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
