import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 24;
    const page = Number(searchParams.get('page')) || 1;
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    let query: any = {
      select: '*, developers:developer_id(name), properties(id, status)',
      limit,
    };

    let filters: Record<string, any> = {};
    if (status) filters['status'] = status;
    if (Object.keys(filters).length > 0) query.filters = filters;

    const projects = await kernel.query('projects', query);

    let finalData = projects;
    if (q) {
      finalData = (projects as any[]).filter(p => p.name?.toLowerCase().includes(q.toLowerCase()) || p.city?.toLowerCase().includes(q.toLowerCase()));
    }

    return NextResponse.json({ data: finalData, count: finalData.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
