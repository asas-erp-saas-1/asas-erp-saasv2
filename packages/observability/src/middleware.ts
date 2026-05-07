import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export class ObservabilityMiddleware {
  static handle(req: NextRequest): { traceId: string; responseHeaders: Headers } {
    // Extract or Generate Trace ID
    const incomingTraceId = req.headers.get('x-b3-traceid') || req.headers.get('traceparent');
    const traceId = incomingTraceId || uuidv4();
    
    // Setup correlation headers for child processes
    const responseHeaders = new Headers(req.headers);
    responseHeaders.set('x-b3-traceid', traceId);
    responseHeaders.set('x-correlation-id', traceId);

    console.log(`[OBSERVABILITY] 🌐 Request Trace Initialized: ${traceId} | Path: ${req.nextUrl.pathname}`);

    return { traceId, responseHeaders };
  }

  static injectTrace(res: NextResponse, traceId: string) {
    res.headers.set('x-trace-id', traceId);
    return res;
  }
}
