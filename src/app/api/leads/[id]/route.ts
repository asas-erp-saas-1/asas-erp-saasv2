import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async (ctx, request: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    
    // We get the lead with clients and profiles
    const leads = await /* @todo fix */ ctx.db.select().from('leads', {
      select: '*, clients(*), projects(*), profiles(*)',
      filters: [{ column: 'id', operator: 'eq', value: id }],
      limit: 1
    });

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(leads[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
