
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReportCard from '@/components/report-card';
import type { Report } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { FileSearch, Loader2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function TrackReportContent() {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  const [reportId, setReportId] = useState(highlightId ?? '');
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [trackingSecret, setTrackingSecret] = useState('');
  const [trackingSecretForId, setTrackingSecretForId] = useState<string | null>(null);
  const [newTrackingSecret, setNewTrackingSecret] = useState(false);

  useEffect(() => {
    setReportId(highlightId ?? '');
    setLookupId(highlightId);
    setReport(null);
    setError(null);

    if (!highlightId) {
      setTrackingSecret('');
      setTrackingSecretForId(null);
      setNewTrackingSecret(false);
      setIsLoading(false);
      return;
    }

    const secretStorageKey = `cybersafe:report-tracking:${highlightId}`;
    const savedSecret = sessionStorage.getItem(secretStorageKey);
    if (savedSecret) sessionStorage.removeItem(secretStorageKey);
    if (savedSecret) {
      setTrackingSecret(savedSecret);
      setTrackingSecretForId(highlightId);
      setNewTrackingSecret(true);
    } else {
      setTrackingSecret('');
      setTrackingSecretForId(null);
      setNewTrackingSecret(false);
    }
  }, [highlightId]);

  useEffect(() => {
    if (!lookupId || !trackingSecret || trackingSecretForId !== lookupId) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/reports/${encodeURIComponent(lookupId)}`, {
      signal: controller.signal,
      headers: { 'x-report-tracking-secret': trackingSecret },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load this report.');
        setReport(result as Report);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return;
        setError('Report not found or tracking credentials are invalid.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [lookupId, trackingSecret, trackingSecretForId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Track a Report</h1>
        <form
          className="flex w-full gap-2 md:w-1/2 lg:w-1/3"
          onSubmit={(event) => {
            event.preventDefault();
            const id = reportId.trim();
            if (!id || !trackingSecret.trim()) return;
            setReport(null);
            setError(null);
            setNewTrackingSecret(false);
            setTrackingSecretForId(id);
            setLookupId(id);
          }}
          aria-label="Track a report"
        >
          <Input
            type="text"
            placeholder="Report ID"
            value={reportId}
            onChange={(event) => setReportId(event.target.value)}
            className="w-full"
            aria-label="Report ID"
          />
          <Input
            type="text"
            placeholder="Tracking secret"
            value={trackingSecret}
            onChange={(event) => setTrackingSecret(event.target.value)}
            className="w-full"
            aria-label="Tracking secret"
            autoComplete="off"
          />
          <Button type="submit" disabled={!reportId.trim() || !trackingSecret.trim()}>Track</Button>
        </form>
      </div>

      {lookupId && trackingSecretForId === lookupId && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <FileSearch className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">{newTrackingSecret ? 'Save Your Tracking Secret' : 'Private Report Lookup'}</AlertTitle>
          <AlertDescription>
            {newTrackingSecret
              ? 'This secret is shown only once. Store it safely; you need both the report ID and secret to view this report again.'
              : 'The report ID alone cannot open the report. Keep the tracking secret private.'}
          </AlertDescription>
        </Alert>
      )}

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to Load Report</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : report ? (
        <div className={cn('rounded-lg', report.id === lookupId ? 'ring-2 ring-primary' : '')}>
          <ReportCard report={report} />
        </div>
      ) : (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">Enter Your Report ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Use the report ID from your submission confirmation to view its status.</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/report-incident">File a New Report</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}


const CardSkeleton = () => (
  <Card className="p-6 shadow-sm">
    <CardHeader className="p-0 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
    </CardHeader>
    <CardContent className="p-0 space-y-3">
      <div className="space-y-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="p-3 bg-muted/50 rounded-md border">
        <Skeleton className="h-5 w-1/3 mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-3 w-full mt-2" />
         <Skeleton className="h-3 w-2/3 mt-1" />
      </div>
    </CardContent>
    <CardFooter className="p-0 mt-4">
      <Skeleton className="h-3 w-1/3" />
    </CardFooter>
  </Card>
);


export default function TrackReportPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-3 text-lg">Loading reports...</p></div>}>
      <TrackReportContent />
    </Suspense>
  );
}
