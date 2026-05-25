'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen text-center p-4">
        <div>
          <h2>Une erreur est survenue</h2>
          <button onClick={() => reset()}>Réessayer</button>
        </div>
      </body>
    </html>
  );
}
