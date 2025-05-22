
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReportCard from '@/components/report-card';
import type { Report } from '@/lib/types';
// import { getReportsFromStorage } from '@/lib/report-store'; // No longer used
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { FileSearch, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // cn was missing

function TrackReportContent() {
  const [allReports, setAllReports] = useState<Report[]>([]); // Store all fetched reports
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/reports');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({error: "Failed to fetch reports."}));
          throw new Error(errorData.error || `Failed to load reports. Status: ${response.status}`);
        }
        const reportsData: Report[] = await response.json();
        setAllReports(reportsData);
        setFilteredReports(reportsData); // Initially, all reports are filtered reports
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching reports.");
        setAllReports([]);
        setFilteredReports([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  useEffect(() => {
    // Filter reports whenever searchTerm or allReports changes
    const lowerSearchTerm = searchTerm.toLowerCase();
    const newFilteredReports = allReports.filter(report =>
      report.id.toLowerCase().includes(lowerSearchTerm) ||
      report.type.toLowerCase().includes(lowerSearchTerm) ||
      (report.aiTriage?.category && report.aiTriage.category.toLowerCase().includes(lowerSearchTerm)) ||
      (report.description && report.description.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredReports(newFilteredReports);

    if (highlightId && !isLoading) {
      // Scroll to highlighted report after reports are loaded and filtered
      const element = document.getElementById(`report-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optional: Add a more prominent highlight style directly or remove after a timeout
        // element.classList.add('ring-4', 'ring-offset-2', 'ring-primary-focus'); 
        // setTimeout(() => element.classList.remove('ring-4', 'ring-offset-2', 'ring-primary-focus'), 3000);
      }
    }
  }, [searchTerm, allReports, highlightId, isLoading]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Reports</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Track Your Reports</h1>
        <div className="w-full md:w-1/2 lg:w-1/3">
          <Input
            type="text"
            placeholder="Search by ID, type, category, or keywords..."
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
              {searchTerm ? "No reports match your search criteria." : "No reports have been submitted yet, or there was an issue fetching them."}
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/report-incident">File a New Report</Link>
            </Button>
          </CardFooter>
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
