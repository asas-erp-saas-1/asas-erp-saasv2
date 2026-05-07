import { KernelContext } from '../../kernel/src/ContextHydrator';
import { Action, Resource } from './PermissionRegistry';
import { PolicyEngine } from './PolicyEngine';

export class ScopedCommandAuthorizer {
  /**
   * Hardened entrypoint for all Kernel execution commands.
   * Verifies that the specific Context identity has the literal mapping to run the command.
   */
  static authorizeCommand(ctx: KernelContext, cmdName: string, actionObj?: any): void {
      console.log(`[AUTH-ENGINE] Authorizing Command: ${cmdName} for User: ${ctx.identity.userId}`);

      // Hardcoded mapping of Kernel Commands -> Permission Matrix
      const commandActionMap: Record<string, { action: Action, resource: Resource }> = {
         'CreateDealCommand': { action: Action.WRITE, resource: Resource.DEAL },
         'UpdateDealCommand': { action: Action.WRITE, resource: Resource.DEAL },
         'DeleteDealCommand': { action: Action.DELETE, resource: Resource.DEAL },
         'AssignLeadCommand': { action: Action.WRITE, resource: Resource.LEAD },
      };

      const requiredPerm = commandActionMap[cmdName];
      if (!requiredPerm) {
          throw new Error(`[COMMAND AUTHORIZER] Unmapped command: ${cmdName}. Defaulting to DENY.`);
      }

      // Delegate to the Policy Engine for granular checking
      PolicyEngine.authorize(ctx, requiredPerm.action, requiredPerm.resource, actionObj);
  }
}
