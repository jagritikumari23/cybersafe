import { useState, useEffect } from 'react';
import type { Report } from '@/lib/types';

export function useReports(status: string | null = null, limitCount: number = 10) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const searchParams = new URLSearchParams({ limit: String(limitCount) });
    if (status) searchParams.set('status', status);

    setLoading(true);
    setError(null);
    fetch(`/api/reports?${searchParams}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load reports.');
        setReports(result as Report[]);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return;
        setError(fetchError instanceof Error ? fetchError : new Error('Failed to load reports.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [status, limitCount]);

  return { reports, loading, error };
}