export class DivergenceEngine {
  
  /**
   * Mechanically compares Legacy outcome vs Kernel intent.
   * Eliminates floating timestamps from hashes.
   */
  static compareAndReport(
    command: any, 
    legacy: ExecutionOutcome, 
    kernel: ExecutionOutcome, 
    traceId: string
  ) {
    
    // 1. Error Mismatches
    if (!!legacy.error !== !!kernel.error) {
       this.logDivergence(traceId, 'ERROR_MISMATCH', {
         legacyError: legacy.error?.message,
         kernelError: kernel.error?.message
       });
       return;
    }

    // 2. State Comparison (Normalizing Timestamps & floating keys)
    const normLegacy = this.normalize(legacy.result);
    const normKernel = this.normalize(kernel.intendedResult);

    const hashLegacy = JSON.stringify(normLegacy);
    const hashKernel = JSON.stringify(normKernel);

    if (hashLegacy !== hashKernel) {
        this.logDivergence(traceId, 'STATE_DIVERGENCE', {
           legacyHash: hashLegacy,
           kernelHash: hashKernel,
           legacyRaw: normLegacy,
           kernelRaw: normKernel
        });
    } else {
        console.log(`[SHADOW] ✅ Trace ${traceId} - Perfect Execution Match`);
    }

    // 3. Latency Monitoring
    const latencyDelta = kernel.durationMs - legacy.durationMs;
    // Log latency delta as metrics (Mocked in log)
    // console.log(`[SHADOW Metrics] Trace ${traceId} latency delta: ${latencyDelta}ms`);
  }

  private static normalize(obj: any): any {
    if (!obj) return obj;
    // Deep clone
    const clone = JSON.parse(JSON.stringify(obj));

    // Remove volatile fields injected during legacy saves
    const removeVolatile = (objToScrub: any) => {
      if (typeof objToScrub !== 'object' || objToScrub === null) return;
      
      delete objToScrub.updated_at;
      delete objToScrub.created_at;
      
      for (const key in objToScrub) {
        removeVolatile(objToScrub[key]);
      }
    };
    
    removeVolatile(clone);
    return clone;
  }

  private static logDivergence(traceId: string, reason: string, details: any) {
     console.error(`[SHADOW DIVERGENCE] ⚠️ ${reason} | Trace: ${traceId}`);
     console.error(`[SHADOW DIVERGENCE] Details: `, JSON.stringify(details, null, 2));
     // Send to Datadog/Sentry
  }
}

interface ExecutionOutcome {
  result?: any;
  intendedResult?: any;
  error?: any;
  durationMs: number;
}
