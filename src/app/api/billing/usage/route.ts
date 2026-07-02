import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { BillingService } from '@/services/billing/billing.service';

export const dynamic = 'force-dynamic';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async (ctx, request: Request) => {
  try {
    const identity = { tenantId: ctx.organizationId, userId: ctx.session.user.id };
    const subscription = await BillingService.getSubscription(identity.tenantId);
    
    return NextResponse.json({
      monthly_limit: subscription?.plan === 'elite' ? 10000 : 1000,
      current_usage: 245, // In a real scenario, this would be computed by UsageService
      active_users: 5
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
