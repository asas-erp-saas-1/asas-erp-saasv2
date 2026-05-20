'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-[400px] h-screen p-8 text-center bg-asas-charcoal text-white">
          <div className="w-16 h-16 rounded-sm bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold mb-2 uppercase tracking-widest text-asas-sand">ASAS OS - Erreur Système</h2>
          <p className="text-asas-silver mb-8 max-w-md text-sm leading-relaxed">
            Une erreur inattendue est survenue au niveau du serveur. 
            <br/><br/>
            {error.message}
          </p>
          <button
            onClick={() => {
              if (window.location.pathname.includes('/login')) {
                 reset();
              } else {
                 window.location.href = '/login';
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-asas-navy text-asas-sand border border-asas-silver/20 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Retour à l'accueil
          </button>
        </div>
      </body>
    </html>
  );
}
