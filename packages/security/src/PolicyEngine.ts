import { KernelContext } from '../../kernel/src/ContextHydrator';
import { PermissionRegistry, Action, Resource } from './PermissionRegistry';

/**
 * Enterprise Authorization Engine combining RBAC (Role) and ABAC (Attributes).
 */
export class PolicyEngine {
  
  /**
   * Evaluates if a subject has the strict right to perform an action on a resource.
   */
  static authorize(ctx: KernelContext, action: Action, resource: Resource, targetResourceData?: any): void {
    // 1. RBAC Evaluation
    const hasRolePermission = PermissionRegistry.hasPermission(ctx.identity.role, action, resource);
    if (!hasRolePermission) {
      throw new Error(`[AUTHORIZATION DENIED] Role ${ctx.identity.role} lacks ${action} on ${resource}`);
    }

    // 2. ABAC & Tenant Evaluation (If target data is provided)
    if (targetResourceData) {
      this.evaluateAbac(ctx, action, resource, targetResourceData);
    }
  }

  private static evaluateAbac(ctx: KernelContext, action: Action, resource: Resource, data: any) {
    // 1. Strict Tenant Boundary Isolation
    const resourceTenantId = data.tenant_id || data.agency_id;
    if (resourceTenantId && resourceTenantId !== ctx.identity.tenantId) {
       console.error(`[CRITICAL SECURITY EVENT] Cross-Tenant access attempted! User ${ctx.identity.userId} (Tenant ${ctx.identity.tenantId}) targeted resource from Tenant ${resourceTenantId}`);
       throw new Error("[AUTHORIZATION DENIED] Tenant boundary violation.");
    }

    // 2. Ownership / Attribute Validation
    // E.g., an 'agent' can only UPDATE their OWN deals, whereas an 'agency_owner' can update ALL deals in their tenant.
    if (ctx.identity.role === 'agent' && action === Action.WRITE) {
       const ownerId = data.owner_id || data.agent_id;
       if (ownerId && ownerId !== ctx.identity.userId) {
          throw new Error(`[AUTHORIZATION DENIED] Agent ${ctx.identity.userId} cannot modify resource owned by ${ownerId}`);
       }
    }
  }
}
