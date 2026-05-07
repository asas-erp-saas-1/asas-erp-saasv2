import { z } from 'zod';

export class DualExecutionTracer {
  
  static logExecution(traceId: string, environment: 'legacy' | 'kernel', metrics: ExecutionMetrics) {
      const payload = {
         timestamp: new Date().toISOString(),
         trace_id: traceId,
         env: environment,
         duration_ms: metrics.durationMs,
         success: metrics.success,
         error_name: metrics.errorName
      };
      
      // Physically write structured logs mapped for Datadog indexing
      console.log(JSON.stringify({ __schema: 'DUAL_EXECUTION_TRACE', ...payload }));
  }
}

interface ExecutionMetrics {
  durationMs: number;
  success: boolean;
  errorName?: string;
}
