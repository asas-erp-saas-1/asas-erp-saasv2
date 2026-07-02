import { requireSession } from "./auth";
import { requirePermission, ResourceAction } from "./rbac";
import { createTenantScopedDB } from "./db-proxy";
import { AuditService } from "./audit";
import { LedgerService } from "./ledger";
import { EEKProtectedContext } from "./types";
import { v4 as uuidv4 } from "uuid";

interface EEKActionConfig<Input = void, Output = any> {
  resource: string;
  action: ResourceAction;
  handler: (ctx: EEKProtectedContext, input: Input) => Promise<Output>;
}

export function withActionEEK<Input = void, Output = any>({ resource, action, handler }: EEKActionConfig<Input, Output>) {
  return async (input?: Input): Promise<Output> => {
    const requestId = uuidv4();
    
    // 1. Authenticate
    const session = await requireSession();

    // 2. Authorize
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
    return await handler(ctx, input as Input);
  };
}
