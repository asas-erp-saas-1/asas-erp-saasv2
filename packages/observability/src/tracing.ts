import { z } from 'zod';

export const TraceMetadataSchema = z.object({
  traceId: z.string().uuid(),
  spanId: z.string().uuid().optional(),
  actor: z.object({
    userId: z.string().uuid(),
    tenantId: z.string().uuid(),
    role: z.string()
  }),
  timestamp: z.string().datetime(),
  kernelIsShadow: z.boolean()
});

export type TraceMetadata = z.infer<typeof TraceMetadataSchema>;

export class TelemetryDecorator {
  static withSpan<T>(name: string, traceId: string, fn: () => Promise<T>): Promise<T> {
     // In a physical environment with OpenTelemetry, this invokes tracer.startActiveSpan
     // For this reconstruction, we mock the instrumentation point.
     console.log(`[TRACE: ${traceId}] [SPAN START] ${name}`);
     const start = Date.now();
     
     return fn().finally(() => {
        const duration = Date.now() - start;
        console.log(`[TRACE: ${traceId}] [SPAN END] ${name} - Duration: ${duration}ms`);
     });
  }
}
