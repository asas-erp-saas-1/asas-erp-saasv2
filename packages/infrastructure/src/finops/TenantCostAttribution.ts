export class TenantCostAttribution {
  private static tenantCosts: Map<string, number> = new Map();

  /**
   * Governs execution cost attribution mapping.
   * A single massive complex Query costs "credits" specific to that execution slice.
   */
  static attributeExecutionCompute(tenantId: string, queryMs: number, mbProcessed: number): void {
     // Simplified FinOps logic
     const baseCost = 0.0001; // Base worker compute unit
     const costDelta = (queryMs * 0.00001) + (mbProcessed * 0.0005) + baseCost;

     const current = this.tenantCosts.get(tenantId) || 0;
     this.tenantCosts.set(tenantId, current + costDelta);
     
     if (current + costDelta > 10.0) { // arbitrary alerting threshold
         console.warn(`[FINOPS ALERT] Tenant ${tenantId} compute usage exceeds baseline boundaries.`);
     }
  }

  static getTenantAttributedCost(tenantId: string): number {
      return this.tenantCosts.get(tenantId) || 0.0;
  }
}
