export class DegradedModeRouter {
  private static degrades: Map<string, boolean> = new Map();

  static markServiceDegraded(serviceKey: string, degraded: boolean) {
    this.degrades.set(serviceKey, degraded);
    if (degraded) {
      console.warn(`[RUNTIME RECOVERY] ⚠️ Service ${serviceKey} entered DEGRADED mode.`);
    } else {
      console.log(`[RUNTIME RECOVERY] ✅ Service ${serviceKey} restored.`);
    }
  }

  static isDegraded(serviceKey: string): boolean {
    return this.degrades.get(serviceKey) === true;
  }

  /**
   * Wraps an execution with degraded fallback logic.
   */
  static async executeWithFallback<T>(
     serviceKey: string, 
     primaryLogic: () => Promise<T>, 
     fallbackLogic: () => Promise<T>
  ): Promise<T> {
     
     if (this.isDegraded(serviceKey)) {
        return await fallbackLogic();
     }

     try {
       return await primaryLogic();
     } catch (e: any) {
       // Is it a network/infrastructure timeout?
       if (e.message.includes('timeout') || e.message.includes('ECONNREFUSED')) {
          this.markServiceDegraded(serviceKey, true);
          // Auto-heal logic will periodically check if it's back up later via heartbeats
          return await fallbackLogic();
       }
       throw e;
     }
  }
}
