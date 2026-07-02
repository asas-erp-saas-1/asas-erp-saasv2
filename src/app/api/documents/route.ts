import { withEEK } from '@/eek/withEEK';
import { NextRequest, NextResponse } from "next/server";
import { documents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ErrorTracker } from "@/lib/observability/errors";

export const GET = withEEK({
  resource: 'system',
  action: 'read',
  handler: async (ctx, req: NextRequest) => {
  try {
    const identity = await { tenantId: ctx.organizationId, userId: ctx.session.user.id });
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "Missing entityType or entityId" }, { status: 400 });
    }

    const docs = await db.select()
      .from(documents)
      .where(
        and(
          eq(documents.organizationId, identity.tenantId),
          eq(documents.entityType, entityType),
          eq(documents.entityId, parseInt(entityId))
        )
      )
      .orderBy(desc(documents.createdAt));

    return NextResponse.json({ data: docs });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: "GET /api/documents" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});

export const DELETE = withEEK({
  resource: 'system',
  action: 'delete',
  handler: async (ctx, req: NextRequest) => {
  try {
    const identity = await { tenantId: ctx.organizationId, userId: ctx.session.user.id });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
       return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    await db.delete(documents)
      .where(
        and(
           eq(documents.id, parseInt(id)),
           eq(documents.organizationId, identity.tenantId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    ErrorTracker.captureError(error, { context: "DELETE /api/documents" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
});
