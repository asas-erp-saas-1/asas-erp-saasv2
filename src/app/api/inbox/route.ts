import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { executionInbox } from "@/db/schema";
import { kernel } from "@/lib/kernel/core";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const identity = await kernel.identity();
    const orgId = identity.tenantId !== 'unknown' ? parseInt(identity.tenantId) : 1; 
    const userId = identity.userId !== 'unknown' ? parseInt(identity.userId) : 1;

    // Fetch the pending inbox tasks for the user
    const tasks = await db.select()
      .from(executionInbox)
      .where(
        and(
          eq(executionInbox.organizationId, orgId),
          eq(executionInbox.userId, userId),
          eq(executionInbox.status, 'pending')
        )
      )
      .orderBy(desc(executionInbox.createdAt))
      .limit(10);

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("Inbox GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
