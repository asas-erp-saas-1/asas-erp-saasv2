'use client';

import { useEffect } from 'react';
import { ErrorTracker } from '@/lib/observability/errors';

export function GlobalErrorTracker() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      ErrorTracker.captureError(event.error || new Error(event.message), {
        context: 'GlobalWindowUnhandledError',
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      ErrorTracker.captureError(event.reason, {
        context: 'GlobalUnhandledRejection',
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
