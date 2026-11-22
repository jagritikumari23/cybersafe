'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('An unexpected application error occurred.');
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <AlertTriangle className="mb-6 h-24 w-24 text-destructive" />
      <h1 className="mb-4 text-4xl font-bold text-destructive">Oops! Something went wrong.</h1>
      <p className="mb-8 max-w-md text-lg text-foreground/80">
        We encountered an unexpected issue. Please try again, or contact support if the problem persists.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="default"
          size="lg"
        >
          Try Again
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
          size="lg"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}
