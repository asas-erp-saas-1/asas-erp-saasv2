import { NextResponse } from 'next/server';
import { withEEK } from '@/eek/withEEK';

export const GET = withEEK({
  resource: 'activities',
  action: 'read',
  handler: async (ctx, request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const lead_id = searchParams.get('lead_id');
      const deal_id = searchParams.get('deal_id');

      let filters: Record<string, string> = {
        organization_id: String(ctx.organizationId)
      };
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

      const activities = await /* @todo fix */ ctx.db.select().from('activities', options);

      return NextResponse.json({ data: activities });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const POST = withEEK({
  resource: 'activities',
  action: 'write',
  handler: async (ctx, request: Request) => {
    try {
      const { lead_id, deal_id, type, description } = await request.json();
      
      if (!description || !type) {
        return NextResponse.json({ error: 'Description and type are required' }, { status: 400 });
      }

      const payload: any = {
        agency_id: ctx.organizationId,
        user_id: ctx.session.user.id,
        type,
        description
      };
      
      if (lead_id) payload.lead_id = lead_id;
      if (deal_id) payload.deal_id = deal_id;

      const activity = await /* @todo fix */ ctx.db.insert('activities', 'INSERT', payload);
      return NextResponse.json({ data: activity });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

export const DELETE = withEEK({
  resource: 'activities',
  action: 'delete',
  handler: async (ctx, request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
      }

      const res = await /* @todo fix */ ctx.db.insert('activities', 'DELETE', { id });
      return NextResponse.json({ success: true, data: res });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
});

