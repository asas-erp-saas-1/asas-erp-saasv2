import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "./auth";
import { requirePermission, ResourceAction } from "./rbac";
import { createTenantScopedDB } from "./db-proxy";
import { AuditService } from "./audit";
import { LedgerService } from "./ledger";
import { EEKProtectedContext } from "./types";
import { v4 as uuidv4 } from "uuid";

interface EEKRouteConfig {
  resource: string;
  action: ResourceAction;
  handler: (ctx: EEKProtectedContext, req: NextRequest | any, params?: any) => Promise<NextResponse | Response>;
}

export function withEEK({ resource, action, handler }: EEKRouteConfig) {
  return async (req: NextRequest, context?: any): Promise<NextResponse | Response> => {
    const requestId = uuidv4();
    try {
      // 1. Authenticate
      const session = await requireSession();

      // 2. Authorize (RBAC)
      await requirePermission(session, resource, action);

      // 3. Inject Context
      const ctx: EEKProtectedContext = {
        session,
        organizationId: session.organizationId,
        db: createTenantScopedDB(session.organizationId),
        ledger: new LedgerService(session),
        audit: new AuditService(requestId),
        requestId,
      };

      // 4. Execute safe handler
      return await handler(ctx, req, context);
    } catch (error: any) {
      if (error.message.startsWith("UNAUTHORIZED")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("FORBIDDEN")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      console.error(`[EEK Route Error] RequestId: ${requestId}`, error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
