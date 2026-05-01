import { KernelIdentity } from '../kernel/core';
import { RuntimeGuard } from './runtime-guard';

export class QueryInterceptor {
  static interceptRead(tableName: string, options: any, identity: KernelIdentity) {
    if (!identity || !identity.tenantId) {
      RuntimeGuard.triggerViolation('Missing tenant identity in read context.');
    }
    
    // Hard-inject tenant_id to prevent cross-tenant data leakage
    const scopedFilters = {
      ...options?.filters,
      tenant_id: identity.tenantId
    };

    // Role-based implicit constraints:
    // If agent is reading leads, they can ONLY read their own unless given special privilege
    if (tableName === 'leads' && identity.role === 'agent') {
      scopedFilters['assigned_to'] = identity.userId;
    }

    return {
      ...options,
      filters: scopedFilters
    };
  }

  static interceptMutation(tableName: string, action: string, data: any, identity: KernelIdentity) {
    if (!identity || !identity.tenantId) {
      RuntimeGuard.triggerViolation('Missing tenant identity in mutation context.');
    }

    let scopedData = { ...data };

    if (action === 'INSERT') {
      // Force tenant_id ownership on creation
      scopedData.tenant_id = identity.tenantId;
    } else if (action === 'UPDATE' && scopedData.tenant_id && scopedData.tenant_id !== identity.tenantId) {
      // Prevent attempts to move data to another tenant
      RuntimeGuard.triggerViolation('Attempt to mutate cross-tenant boundary detected.');
    }

    return scopedData;
  }
}
