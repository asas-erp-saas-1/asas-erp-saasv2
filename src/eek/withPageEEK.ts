import { requireSession } from "./auth";
import { requirePermission, ResourceAction } from "./rbac";
import { createTenantScopedDB } from "./db-proxy";
import { AuditService } from "./audit";
import { LedgerService } from "./ledger";
import { EEKProtectedContext } from "./types";
import { v4 as uuidv4 } from "uuid";

interface EEKPageConfig {
  resource: string;
  action: ResourceAction;
  handler: (ctx: EEKProtectedContext, props: any) => Promise<any>;
}

export function withPageEEK({ resource, action, handler }: EEKPageConfig) {
  return async (props: any) => {
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
      return await handler(ctx, props);
    } catch (error: any) {
      // For pages, we could redirect or throw to boundary
      throw error;
    }
  };
}
