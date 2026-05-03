import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const task = await kernel.mutate('tasks', 'UPDATE', body, { id: params.id });
    return NextResponse.json({ data: task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
