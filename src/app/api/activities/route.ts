import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lead_id = searchParams.get('lead_id');
    const deal_id = searchParams.get('deal_id');

    let filters: any[] = [];
    if (lead_id) filters.push({ column: 'lead_id', operator: 'eq', value: lead_id });
    if (deal_id) filters.push({ column: 'deal_id', operator: 'eq', value: deal_id });

    const activities = await kernel.query('activities', {
      select: '*, profiles(full_name)',
      filters: filters.length > 0 ? filters : undefined,
      orderBy: { column: 'created_at', ascending: false },
      limit: 100
    });

    return NextResponse.json({ data: activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
