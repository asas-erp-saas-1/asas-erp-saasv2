import { KernelContext } from '../../kernel/src/ContextHydrator';

export class DynamicAttributePolicyEvaluator {
  /**
   * ABAC Engine. Evaluates temporal and contextual states before allowing mutations.
   */
  static evaluate(ctx: KernelContext, targetResource: any, requiredAttributes: Record<string, any>) {
     // 1. Temporal constraints (e.g. Can only edit deals during business hours, or before they close)
     if (targetResource.status === 'won' || targetResource.status === 'lost') {
        throw new Error("[POLICY DENIED] Cannot mutate a functionally closed resource.");
     }

     // 2. Risk Evaluation Context Check
     const riskScore = (ctx.identity as any).riskScore;
     if (riskScore && riskScore > 75) {
        throw new Error("[POLICY DENIED] High Risk Session cannot mutate financial bounds.");
     }

     // 3. Dynamic requirement matching
     // Iterate across required dynamic attributes and guarantee the resource possesses them.
     for (const [key, val] of Object.entries(requiredAttributes)) {
         if (targetResource[key] !== val) {
             throw new Error(`[POLICY DENIED] Resource missing required dynamic attribute: ${key}=${val}`);
         }
     }
  }
}
