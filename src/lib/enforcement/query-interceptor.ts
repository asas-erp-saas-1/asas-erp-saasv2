import { KernelIdentity } from '../kernel/core';
import { RuntimeGuard } from './runtime-guard';
import { QueryOptimizer } from '../scaling/query-optimizer';
import { ErrorTracker } from '../observability/errors';

export class QueryInterceptor {
  private static sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;

    // Reject NoSQL injections or unknown generic objects with keys starting with $ or _
    for (const key of Object.keys(payload)) {
      if (key.startsWith('$') && key !== '$ref') {
        ErrorTracker.captureRejection(`Malicious payload key detected: ${key}`);
        throw new Error('INVALID_PAYLOAD_DETECTED');
      }
    }
    return payload;
  }

  private static checkRBAC(tableName: string, action: string, role: string) {
    const adminOnlyTables = ['subscriptions', 'tenants', 'billing'];
    if (adminOnlyTables.includes(tableName) && role !== 'owner' && role !== 'manager') {
      ErrorTracker.captureRejection(`RBAC Violation: Role ${role} attempted ${action} on ${tableName}`);
      throw new Error('INSUFFICIENT_PRIVILEGES');
    }
  }

  static interceptRead(tableName: string, options: any, identity: KernelIdentity) {
    if (!identity || !identity.tenantId) {
      RuntimeGuard.triggerViolation('Missing tenant identity in read context.');
    }
    
    this.checkRBAC(tableName, 'READ', identity.role);

    // Hard-inject tenant_id to prevent cross-tenant data leakage
    const scopedFilters = {
      ...(options?.filters ? this.sanitizePayload(options.filters) : {}),
      tenant_id: identity.tenantId
    };

    // Role-based implicit constraints:
    // If agent is reading leads, they can ONLY read their own unless given special privilege
    if (tableName === 'leads' && identity.role === 'agent') {
      scopedFilters['assigned_to'] = identity.userId;
    }

    const safeOptions = {
      ...options,
      filters: scopedFilters
    };

    return QueryOptimizer.optimize(safeOptions);
  }

  static interceptMutation(tableName: string, action: string, data: any, identity: KernelIdentity) {
    if (!identity || !identity.tenantId) {
      RuntimeGuard.triggerViolation('Missing tenant identity in mutation context.');
    }

    this.checkRBAC(tableName, action, identity.role);

    let scopedData = { ...this.sanitizePayload(data) };

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

