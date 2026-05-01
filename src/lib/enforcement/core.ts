import { IKernel, KernelIdentity } from '../kernel/core';
import { QueryInterceptor } from './query-interceptor';
import { RuntimeGuard } from './runtime-guard';

export function enforceExecution(kernelCore: IKernel): IKernel {
  return {
    identity: async (): Promise<KernelIdentity> => {
      // Must resolve identity using the core
      const id = await kernelCore.identity();
      if (!id || !id.tenantId) {
        RuntimeGuard.triggerViolation('Identity engine failed to provide secure tenant context.');
      }
      return id;
    },

    query: async <T>(tableName: string, options?: any): Promise<T[]> => {
      RuntimeGuard.assertKernelExecution();
      
      const identity = await kernelCore.identity();
      const safeOptions = QueryInterceptor.interceptRead(tableName, options, identity);
      
      return await kernelCore.query<T>(tableName, safeOptions);
    },

    mutate: async <T>(
      tableName: string, 
      action: 'INSERT' | 'UPDATE' | 'DELETE', 
      data: any, 
      match?: Record<string, any>
    ): Promise<T> => {
      RuntimeGuard.assertKernelExecution();
      
      const identity = await kernelCore.identity();
      const safeData = QueryInterceptor.interceptMutation(tableName, action, data, identity);
      
      // Enforce tenant scoping on the MATCH block for UPDATE/DELETE
      let safeMatch = match || {};
      if (action !== 'INSERT') {
        safeMatch = { ...safeMatch, tenant_id: identity.tenantId };
      }

      const result = await kernelCore.mutate<T>(tableName, action, safeData, safeMatch);
      
      // Asynchronous Audit Logging Hook
      logExecutionAudit({
        timestamp: new Date().toISOString(),
        userId: identity.userId,
        tenantId: identity.tenantId,
        action: action,
        route: tableName,
        kernelUsed: true,
        enforcementPassed: true
      });

      return result;
    },

    transaction: async <T>(
      callback: (txKernel: Omit<IKernel, 'transaction'>) => Promise<T>
    ): Promise<T> => {
      RuntimeGuard.assertKernelExecution();
      // Wraps the entire transaction inside the enforced execution context
      return await kernelCore.transaction(async (txCore) => {
        // Enforce the execution of inner transaction actions
        const enforcedTxBlock = enforceExecution(txCore as IKernel);
        return await callback(enforcedTxBlock);
      });
    }
  };
}

function logExecutionAudit(event: any) {
  // Simulates pushing to a secure internal audit queue or DB table
  console.log('[EEL: AUDIT]', JSON.stringify(event));
}
