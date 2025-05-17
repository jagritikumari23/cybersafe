'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReportCard from '@/components/report-card';
import type { Report } from '@/lib/types';
import { getReportsFromStorage } from '@/lib/report-store';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileSearch, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

function TrackReportContent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  useEffect(() => {
    setIsLoading(true);
    const storedReports = getReportsFromStorage();
    setReports(storedReports);
    setIsLoading(false);
    
    if (highlightId) {
      const element = document.getElementById(`report-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId]);

  const filteredReports = reports.filter(report =>
    report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.aiTriage?.category && report.aiTriage.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <h1 className="text-3xl font-bold">Track Your Reports</h1>
        <div className="w-full md:w-1/3">
          <Input
            type="text"
            placeholder="Search by ID, type, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search reports"
          />
        </div>
      </div>

      {highlightId && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Report Highlighted</AlertTitle>
          <AlertDescription>
            Showing details for report ID: {highlightId}. You can find other reports below.
          </AlertDescription>
        </Alert>
      )}

      {filteredReports.length === 0 ? (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <FileSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Reports Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "No reports match your search criteria." : "You haven't submitted any reports yet, or your local storage is clear."}
            </p>
            <Button asChild>
              <Link href="/report-incident">File a New Report</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div key={report.id} id={`report-${report.id}`} className={cn(report.id === highlightId ? "ring-2 ring-primary shadow-lg rounded-lg" : "")}>
                 <ReportCard report={report} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


const CardSkeleton = () => (
  <div className="p-6 border rounded-lg shadow-sm bg-card">
    <div className="flex justify-between items-start mb-4">
      <div>
        <Skeleton className="h-6 w-40 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
    <div className="space-y-3">
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
    </div>
    <div className="mt-4">
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);


export default function TrackReportPage() {
  // Wrap with Suspense for useSearchParams
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading reports...</span></div>}>
      <TrackReportContent />
    </Suspense>
  );
}

// Helper to add cn if it's not globally available (though it should be from lib/utils)
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

