import { KernelContext } from '../../kernel/src/ContextHydrator';

export class TenantBoundaryEnforcer {
  /**
   * Mathematically guarantees that a repository query NEVER crosses a tenant boundary.
   * This acts as the software-level RLS, complementing DB-level RLS.
   */
  static injectTenantFilter(ctx: KernelContext, query: any): any {
    if (!ctx.identity || !ctx.identity.tenantId) {
      throw new Error("MALFORMED CONTEXT: Missing tenant identification.");
    }
    
    // Inject the mandatory eq clause for the tenant
    return query.eq('agency_id', ctx.identity.tenantId);
  }

  /**
   * Asserts the payload specifically belongs to the correct tenant before a mutation.
   */
  static assertTenantPayload(ctx: KernelContext, payload: any): void {
     const payloadTenant = payload.agency_id || payload.tenant_id;
     
     // If the payload provides a tenant, it MUST match the context
     if (payloadTenant && payloadTenant !== ctx.identity.tenantId) {
        throw new Error("SECURITY VIOLATION: Payload tenant mismatch.");
     }

     // Auto-stigmatize payload if possible, though standard projection engines handle this.
     payload.agency_id = ctx.identity.tenantId;
  }
}
