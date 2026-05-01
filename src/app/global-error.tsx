'use client';

import { useEffect } from 'react';
import { ErrorTracker } from '@/lib/observability/errors';
import { AlertOctagon, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    ErrorTracker.captureError(error, { context: 'GlobalErrorBoundary' });
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-[#050505] text-gray-100 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-[#111] border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertOctagon className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">System Critical Failure</h1>
          <p className="text-gray-400 text-sm mb-8">
            A fatal error has occurred at the application boundary. The engineering team has been notified via the ErrorTracker.
          </p>
          <button
            onClick={() => reset()}
            className="flex items-center justify-center w-full gap-2 px-6 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Reboot Application
          </button>
        </div>
      </body>
    </html>
  );
}
