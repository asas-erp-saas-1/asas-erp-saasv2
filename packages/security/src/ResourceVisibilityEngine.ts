import { KernelContext } from '../../kernel/src/ContextHydrator';
import { RoleHierarchyResolver } from './RoleHierarchyResolver';

export class ResourceVisibilityEngine {
  /**
   * Filters a list of resources down to ONLY what the context is authorized to see.
   * Useful for list endpoints where RLS isn't physically granular enough for complex ABAC.
   */
  static filterVisible<T extends Record<string, any>>(ctx: KernelContext, resources: T[]): T[] {
      // System Admins see all structurally provided resources
      if (ctx.identity.role === 'system_admin') return resources;

      return resources.filter(res => {
         // 1. Must pass tenant bounds
         const tenantId = res.tenant_id || res.agency_id;
         if (tenantId && tenantId !== ctx.identity.tenantId) return false;

         // 2. Agents only see their specific rows
         if (ctx.identity.role === 'agent') {
            const ownerId = res.owner_id || res.agent_id;
            if (ownerId && ownerId !== ctx.identity.userId) return false;
         }

         return true; // Agency Owner sees all tenant rows
      });
  }
}
