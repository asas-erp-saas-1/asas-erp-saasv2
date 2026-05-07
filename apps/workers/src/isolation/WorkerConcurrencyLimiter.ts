export class WorkerConcurrencyLimiter {
  private static tenantLocks: Map<string, boolean> = new Map();

  /**
   * Obtains a software lock for the tenant. In physical infra, this uses Redis distributed locks.
   * Prevents dual queue execution from mangling aggregate streams.
   */
  static async acquireTenantLock(tenantId: string, ttlMs: number = 30000): Promise<boolean> {
     if (this.tenantLocks.get(tenantId)) {
        return false; // Locked!
     }
     
     // Mock Redis SET NX
     this.tenantLocks.set(tenantId, true);
     
     // Auto-expire
     setTimeout(() => {
        this.releaseTenantLock(tenantId);
     }, ttlMs);

     return true;
  }

  static releaseTenantLock(tenantId: string) {
     this.tenantLocks.delete(tenantId);
  }
}
