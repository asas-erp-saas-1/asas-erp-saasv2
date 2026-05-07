import { z } from 'zod';

export enum Action {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  EXECUTE = 'execute'
}

export enum Resource {
  DEAL = 'deal',
  LEAD = 'lead',
  USER = 'user',
  TENANT = 'tenant',
  BILLING = 'billing'
}

export interface Permission {
  action: Action;
  resource: Resource;
}

export class PermissionRegistry {
  private static roles: Record<string, Permission[]> = {
    'system_admin': [
       { action: Action.READ, resource: Resource.TENANT },
       { action: Action.WRITE, resource: Resource.TENANT },
       // ... Global permissions
    ],
    'agency_owner': [
       { action: Action.READ, resource: Resource.DEAL },
       { action: Action.WRITE, resource: Resource.DEAL },
       { action: Action.DELETE, resource: Resource.DEAL },
       { action: Action.READ, resource: Resource.USER },
       { action: Action.WRITE, resource: Resource.USER },
       { action: Action.READ, resource: Resource.BILLING },
    ],
    'agent': [
       { action: Action.READ, resource: Resource.DEAL },
       { action: Action.WRITE, resource: Resource.DEAL },
       { action: Action.READ, resource: Resource.LEAD },
       { action: Action.WRITE, resource: Resource.LEAD }
    ]
  };

  static getPermissions(role: string): Permission[] {
    return this.roles[role] || [];
  }

  static hasPermission(role: string, action: Action, resource: Resource): boolean {
    const perms = this.getPermissions(role);
    return perms.some(p => p.action === action && p.resource === resource);
  }
}
