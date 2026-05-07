import { KernelContext } from '../../kernel/src/ContextHydrator';

export class OwnershipValidationLayer {
  /**
   * Enforces strict ownership checks for Row-Level logic where a user only
   * owns specific rows (e.g., an agent can only see leads assigned to them).
   */
  static assertOwnership(ctx: KernelContext, resource: any, ownerField: string = 'owner_id'): void {
    if (ctx.identity.role === 'agency_owner' || ctx.identity.role === 'system_admin') {
      return; // Administrators bypass strict individual ownership checks (they hit tenant boundaries instead)
    }

    if (resource[ownerField] !== ctx.identity.userId) {
       console.warn(`Attempted Access Violation: User ${ctx.identity.userId} tried to access resource owned by ${resource[ownerField]}`);
       throw new Error(`[SECURITY DENIED] User does not own the requested resource.`);
    }
  }
}
