import { NextRequest, NextResponse } from "next/server";
import { kernel } from "@/lib/kernel/core";
import { db } from "@/db";
import { approvalRequests, systemEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    if (identity.tenantId === 'unknown') {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action, notes } = await req.json(); // action is 'approve' or 'reject'

    const reqIdNum = parseInt(requestId, 10);
    if (!reqIdNum || !['approve', 'reject'].includes(action)) {
       return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    await db.update(approvalRequests)
      .set({ 
         status: action === 'approve' ? 'approved' : 'rejected',
         decisionNotes: notes || '',
         approverId: Number(identity.userId),
      })
      .where(and(
         eq(approvalRequests.id, reqIdNum),
         eq(approvalRequests.organizationId, Number(identity.tenantId))
      ));

    // Log the event
    await db.insert(systemEvents).values({
       organizationId: Number(identity.tenantId),
       aggregateId: requestId.toString(),
       aggregateType: 'approval_request',
       eventType: `approval_${action}d`,
       payload: { action, notes },
       version: 1,
       actorId: Number(identity.userId),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
