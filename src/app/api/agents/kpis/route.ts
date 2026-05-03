import { NextResponse } from 'next/server';
import { kernel } from '@/lib/kernel/core';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;

    // Fetch agents from tenant_members or users
    const agents = await kernel.query<any>('tenant_members', {
      select: 'user_id, role',
      filters: { role: 'agent' },
      limit
    });

    // We can mock the rankings for now, but ideally we'd join with metrics
    // As in standard ERP
    const rankings = agents.map((agent, index) => ({
      agentId: agent.user_id,
      agentName: `Agent ${agent.user_id.substring(0, 4)}`, // Mock name
      tier: index === 0 ? 'Elite' : index === 1 ? 'Gold' : index === 2 ? 'Silver' : index === 3 ? 'Bronze' : 'Starter',
      rank: index + 1,
      rankDelta: 0,
      performanceScore: 100 - (index * 5),
      closedDeals: 10 - index,
      activeDeals: 5 + index,
      totalRevenue: 5000000 - (index * 100000),
      commissionEarned: 150000 - (index * 5000),
      closingRatePct: 25 - index,
      avgDealSize: 500000
    }));

    return NextResponse.json({ rankings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
