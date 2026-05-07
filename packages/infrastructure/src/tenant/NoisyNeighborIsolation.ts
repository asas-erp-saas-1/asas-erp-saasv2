export class NoisyNeighborIsolation {
  private static tenantQueueVelocity: Map<string, number> = new Map();

  /**
   * Partitions executing tenants if they breach sustained velocity bounds, 
   * preserving generic pool availability for all other tenants.
   */
  static assessThrottleRequirement(tenantId: string, incomingEventsPerMinute: number): 'STANDARD' | 'DEPRIORITIZED' {
      this.tenantQueueVelocity.set(tenantId, incomingEventsPerMinute);

      const THRESHOLD = 5000; // Events per min before throttling isolates

      if (incomingEventsPerMinute >= THRESHOLD) {
          console.warn(`[RESOURCE GOVERNANCE] Tenant ${tenantId} hitting ${incomingEventsPerMinute} RPM. Rerouting to Isolated Queue.`);
          return 'DEPRIORITIZED';
      }

      return 'STANDARD';
  }
}
