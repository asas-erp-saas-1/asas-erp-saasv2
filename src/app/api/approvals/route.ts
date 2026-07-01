import { NextResponse } from "next/server";
import { withEEK } from "@/eek/withEEK";
import { approvalRequests, systemEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const POST = withEEK({
  resource: 'approvals',
  action: 'write',
  handler: async (ctx, req) => {
    try {
      const { requestId, action, notes } = await req.json(); // action is 'approve' or 'reject'

      const reqIdNum = parseInt(requestId, 10);
      if (!reqIdNum || !['approve', 'reject'].includes(action)) {
         return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
      }

      await ctx.db.update(approvalRequests)
        .set({ 
           status: action === 'approve' ? 'approved' : 'rejected',
           decisionNotes: notes || '',
           approverId: Number(ctx.session.user.id),
        })
        .where(and(
           eq(approvalRequests.id, reqIdNum),
           eq(approvalRequests.organizationId, Number(ctx.organizationId))
        ));

      // Log the event
      await ctx.db.insert(systemEvents).values({
         organizationId: Number(ctx.organizationId),
         aggregateId: requestId.toString(),
         aggregateType: 'approval_request',
         eventType: `approval_${action}d`,
         payload: { action, notes },
         version: 1,
         actorId: Number(ctx.session.user.id),
      });

      ctx.audit.logAudit({
         organizationId: ctx.organizationId,
         userId: ctx.session.user.id,
         action: 'PROCESS_APPROVAL',
         entityType: 'approvalRequests',
         entityId: String(reqIdNum),
         newData: { action, notes }
      });

      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
});
