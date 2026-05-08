import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lead_id = searchParams.get('lead_id');
    const deal_id = searchParams.get('deal_id');

    let filters: Record<string, string> = {};
    if (lead_id) filters['lead_id'] = lead_id;
    if (deal_id) filters['deal_id'] = deal_id;

    const options: any = {
      select: '*, profiles(full_name)',
      orderBy: { column: 'created_at', ascending: false },
      limit: 100
    };
    if (Object.keys(filters).length > 0) {
      options.filters = filters;
    }

    const activities = await kernel.query('activities', options);

    return NextResponse.json({ data: activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
