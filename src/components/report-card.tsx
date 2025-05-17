
'use client';

import type { Report } from '@/lib/types';
import { ReportStatus, ReportType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, FileText, Fingerprint, Fish, Landmark, MessagesSquare, Smile, Terminal, User, Bot, MessageSquare as ChatIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

interface ReportCardProps {
  report: Report;
}

const getStatusIcon = (status: ReportStatus) => {
  switch (status) {
    case ReportStatus.FILED:
    case ReportStatus.AI_TRIAGE_PENDING:
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case ReportStatus.AI_TRIAGE_COMPLETED:
    case ReportStatus.OFFICER_ASSIGNED:
    case ReportStatus.INVESTIGATION_UPDATES:
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case ReportStatus.CASE_CLOSED:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getReportTypeIcon = (type: ReportType) => {
  const className = "h-5 w-5 mr-2";
  switch (type) {
    case ReportType.HACKING: return <Terminal className={className} />;
    case ReportType.ONLINE_FRAUD: return <Landmark className={className} />;
    case ReportType.IDENTITY_THEFT: return <Fingerprint className={className} />;
    case ReportType.CYBERBULLYING: return <MessagesSquare className={className} />;
    case ReportType.SEXTORTION: return <Smile className={className} />; 
    case ReportType.PHISHING: return <Fish className={className} />;
    default: return <AlertCircle className={className} />;
  }
}

const getUrgencyBadgeVariant = (urgency?: string): "default" | "destructive" | "secondary" | "outline" => {
    if (!urgency) return "outline";
    switch (urgency.toLowerCase()) {
        case 'high': return 'destructive';
        case 'medium': return 'default'; 
        case 'low': return 'secondary';
        default: return 'outline';
    }
}

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl flex items-center">
                    {getReportTypeIcon(report.type)}
                    {report.type}
                </CardTitle>
                <CardDescription>Report ID: {report.id}</CardDescription>
            </div>
            <Badge variant={report.status === ReportStatus.CASE_CLOSED ? "secondary" : "default"} className="whitespace-nowrap">
                {getStatusIcon(report.status)}
                <span className="ml-1">{report.status}</span>
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">Incident Date</h4>
          <p>{format(parseISO(report.incidentDate), 'PPP')}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
          <p className="text-sm line-clamp-3">{report.description}</p>
        </div>
        
        {report.aiTriage && (
          <div className="p-3 bg-accent/20 rounded-md border border-accent/50">
            <h4 className="text-sm font-semibold flex items-center text-accent-foreground/80 mb-1">
                <Bot className="h-4 w-4 mr-2 text-accent" /> AI Triage Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="font-medium text-muted-foreground">Category: </span>
                    <span>{report.aiTriage.category}</span>
                </div>
                 <div>
                    <span className="font-medium text-muted-foreground">Urgency: </span>
                    <Badge variant={getUrgencyBadgeVariant(report.aiTriage.urgency)}>{report.aiTriage.urgency}</Badge>
                </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground italic">
                <span className="font-medium">Summary: </span>{report.aiTriage.summary}
            </p>
          </div>
        )}

        {report.evidenceFiles && report.evidenceFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground">Evidence Files</h4>
            <ul className="list-disc list-inside text-sm">
              {report.evidenceFiles.map((file, index) => (
                <li key={index} className="truncate">
                  <FileText className="inline h-4 w-4 mr-1 text-muted-foreground" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
         {report.reporterName && (
            <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Reporter</h4>
                <p className="text-sm flex items-center"><User className="h-4 w-4 mr-1 text-muted-foreground"/> {report.reporterName} {report.reporterContact && `(${report.reporterContact})`}</p>
            </div>
        )}
        
        {report.status === ReportStatus.OFFICER_ASSIGNED && report.chatId && report.assignedOfficerName && (
            <div className="mt-4">
                 <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary">
                    <Link href={`/chat/${report.chatId}?reportId=${report.id}`}>
                        <ChatIcon className="mr-2 h-4 w-4" />
                        Chat with {report.assignedOfficerName}
                    </Link>
                 </Button>
            </div>
        )}

      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Submitted on: {format(parseISO(report.submissionDate), 'PPpp')}</p>
      </CardFooter>
    </Card>
  );
}
