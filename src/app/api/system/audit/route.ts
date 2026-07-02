import { withEEK } from '@/eek/withEEK';
import { NextResponse } from 'next/server';
import { auditLogs, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ErrorTracker } from '@/lib/observability/errors';
import { requireSession } from '@/lib/enterprise/auth';

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async (ctx, request: Request) => {
  try {
    const session = await requireSession();
    
    // Check if admin
    if (session.role !== 'admin' && session.role !== 'super_admin') {
       return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const entityType = searchParams.get('entityType');
    
    let query = ctx.db.select({
       id: auditLogs.id,
       action: auditLogs.action,
       entityType: auditLogs.entityType,
       entityId: auditLogs.entityId,
       createdAt: auditLogs.createdAt,
       user: {
          id: users.id,
          name: users.name,
          email: users.email
       }
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id));
    
    if (entityType) {
       query = query.where(and(eq(auditLogs.organizationId, session.organizationId), eq(auditLogs.entityType, entityType))) as any;
    } else {
       query = query.where(eq(auditLogs.organizationId, session.organizationId)) as any;
    }
    
    const logs = await query.orderBy(desc(auditLogs.createdAt)).limit(limit);

    return NextResponse.json({ data: logs, count: logs.length });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: 'GET /api/system/audit' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
