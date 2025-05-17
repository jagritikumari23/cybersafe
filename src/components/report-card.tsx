
'use client';

import type { Report, SuspectDetails, IncidentLocation } from '@/lib/types';
import { ReportStatus, ReportType, EscalationTarget } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    AlertCircle, CheckCircle2, Clock, FileText, Fingerprint, Fish, Landmark, MessagesSquare, Smile, Terminal, User, Bot, 
    MessageSquare as ChatIcon, Waypoints, Info, Building, Globe, ShieldAlert, AlertTriangle, UserCheck, UserCog, SearchCheck, Microscope, CaseUpper
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

interface ReportCardProps {
  report: Report;
}

const getStatusIcon = (status: ReportStatus) => {
  const iconClass = "h-4 w-4 mr-1.5";
  switch (status) {
    case ReportStatus.FILED:
      return <FileText className={`${iconClass} text-gray-500`} />;
    case ReportStatus.AI_TRIAGE_PENDING:
    case ReportStatus.ESCALATION_SUGGESTION_PENDING:
      return <Clock className={`${iconClass} text-yellow-500`} />;
    case ReportStatus.AI_TRIAGE_COMPLETED:
    case ReportStatus.ESCALATION_SUGGESTION_COMPLETED:
      return <SearchCheck className={`${iconClass} text-blue-400`} />;
    case ReportStatus.CASE_ACCEPTED:
      return <UserCheck className={`${iconClass} text-indigo-500`} />;
    case ReportStatus.OFFICER_ASSIGNED:
      return <UserCog className={`${iconClass} text-blue-500`} />;
    case ReportStatus.INVESTIGATION_INITIATED:
      return <Microscope className={`${iconClass} text-teal-500`} />;
    case ReportStatus.INVESTIGATION_UPDATES:
      return <AlertCircle className={`${iconClass} text-blue-500`} />;
    case ReportStatus.ESCALATED_TO_AUTHORITY:
        return <Building className={`${iconClass} text-purple-500`} />;
    case ReportStatus.CASE_CLOSED:
      return <CheckCircle2 className={`${iconClass} text-green-500`} />;
    default:
      return <Clock className={`${iconClass} text-gray-500`} />;
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

const getEscalationTargetIcon = (target?: EscalationTarget | string) => {
    const className = "h-4 w-4 mr-2";
    switch(target) {
        case EscalationTarget.CERT_IN_TECHNICAL_EMERGENCY: return <Terminal className={`${className} text-red-600`} />;
        case EscalationTarget.I4C_NATIONAL_COORDINATION: return <Building className={`${className} text-blue-600`} />;
        case EscalationTarget.INTERPOL_INTERNATIONAL_CRIME: return <Globe className={`${className} text-green-600`} />;
        case EscalationTarget.NATIONAL_SECURITY_AGENCY_ALERT: return <ShieldAlert className={`${className} text-red-700`} />;
        case EscalationTarget.LOCAL_DISTRICT_CYBER_CELL:
        case EscalationTarget.STATE_CYBER_HQ:
             return <Landmark className={`${className} text-indigo-600`} />;
        default: return <Waypoints className={`${className} text-gray-600`} />;
    }
}

const renderSuspectDetails = (suspects?: SuspectDetails) => {
    if (!suspects || Object.values(suspects).every(val => !val || val.trim() === '')) return null;
    return (
        <div>
            <h4 className="text-sm font-semibold text-muted-foreground mt-3 mb-1">Suspect Information</h4>
            <ul className="list-disc list-inside text-sm space-y-0.5">
                {suspects.phone && <li>Phone: {suspects.phone}</li>}
                {suspects.email && <li>Email: {suspects.email}</li>}
                {suspects.ipAddress && <li>IP Address: {suspects.ipAddress}</li>}
                {suspects.website && <li>Website: {suspects.website}</li>}
                {suspects.bankAccount && <li>Bank Account: {suspects.bankAccount}</li>}
                {suspects.otherInfo && <li>Other: {suspects.otherInfo}</li>}
            </ul>
        </div>
    );
};

const renderLocationDetails = (location?: IncidentLocation) => {
    if (!location || location.type === 'not_provided') return null;
    return (
        <div>
            <h4 className="text-sm font-semibold text-muted-foreground mt-3 mb-1">Incident Location</h4>
            <p className="text-sm">
                {location.details || `${location.city || ''}${location.city && location.state ? ', ' : ''}${location.state || ''}${ (location.city || location.state) && location.country ? ', ' : ''}${location.country || ''}`.trim() || "Not specified"}
                {location.type === 'auto' && <span className="text-xs text-muted-foreground ml-1">(Auto-detected)</span>}
            </p>
        </div>
    );
};


export default function ReportCard({ report }: ReportCardProps) {
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <div>
                <CardTitle className="text-xl flex items-center">
                    {getReportTypeIcon(report.type)}
                    {report.type}
                </CardTitle>
                <CardDescription className="text-xs break-all">Report ID: {report.id}</CardDescription>
            </div>
            <Badge variant={report.status === ReportStatus.CASE_CLOSED ? "secondary" : "default"} className="whitespace-nowrap text-xs px-2 py-1 h-fit">
                {getStatusIcon(report.status)}
                <span className="ml-1">{report.status}</span>
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">Incident Date</h4>
          <p>{format(parseISO(report.incidentDate), 'PPP')}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
          <p className="text-sm line-clamp-3">{report.description}</p>
        </div>
        
        {renderSuspectDetails(report.suspectDetails)}
        {renderLocationDetails(report.incidentLocation)}

        {report.additionalEvidenceText && (
             <div>
                <h4 className="text-sm font-semibold text-muted-foreground mt-3 mb-1">Additional Evidence Text</h4>
                <p className="text-sm line-clamp-2 bg-muted/30 p-2 rounded-md">{report.additionalEvidenceText}</p>
            </div>
        )}
        
        {report.aiTriage && (
          <div className="p-3 bg-accent/20 rounded-md border border-accent/50 mt-2">
            <h4 className="text-sm font-semibold flex items-center text-accent-foreground/80 mb-1">
                <Bot className="h-4 w-4 mr-2 text-accent" /> AI Triage Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium text-muted-foreground">Category: </span><span>{report.aiTriage.category}</span></div>
                <div><span className="font-medium text-muted-foreground">Urgency: </span><Badge variant={getUrgencyBadgeVariant(report.aiTriage.urgency)} size="sm">{report.aiTriage.urgency}</Badge></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground italic"><span className="font-medium">Summary: </span>{report.aiTriage.summary}</p>
          </div>
        )}

        {report.aiEscalation && (
          <div className="p-3 bg-purple-500/10 rounded-md border border-purple-500/30 mt-2">
            <h4 className="text-sm font-semibold flex items-center text-purple-700 dark:text-purple-300 mb-1">
                {getEscalationTargetIcon(report.aiEscalation.target)} AI Suggested Escalation
            </h4>
            <div className="text-sm mb-1">
                <span className="font-medium text-muted-foreground">Target: </span>
                <Badge variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-300">{report.aiEscalation.target}</Badge>
            </div>
            <p className="text-xs text-muted-foreground italic"><span className="font-medium">Reasoning: </span>{report.aiEscalation.reasoning}</p>
          </div>
        )}
        
        {report.timelineNotes && (
            <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/30 mt-2">
                 <h4 className="text-sm font-semibold flex items-center text-blue-700 dark:text-blue-300 mb-1">
                    <CaseUpper className="h-4 w-4 mr-2" /> Current Status & Next Steps
                </h4>
                <p className="text-xs text-blue-700/90 dark:text-blue-300/90">{report.timelineNotes}</p>
            </div>
        )}


        {report.evidenceFiles && report.evidenceFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mt-3 mb-1">Evidence Files</h4>
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
                <h4 className="text-sm font-semibold text-muted-foreground mt-3 mb-1">Reporter</h4>
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
      <CardFooter className="text-xs text-muted-foreground pt-3">
        <p>Submitted on: {format(parseISO(report.submissionDate), 'PPp, EEEE')}</p>
      </CardFooter>
    </Card>
  );
}

// Helper for ShadCN badge size prop if needed (not standard, but for consistency)
declare module '@/components/ui/badge' {
  interface BadgeProps {
    size?: 'sm' | 'default';
  }
}
// In badge.tsx, if you were to add size:
// const badgeVariants = cva(
//   "...", { variants: { variant: {...}, size: { default: "px-2.5 py-0.5 text-xs", sm: "px-2 py-0.5 text-[10px]" } }, defaultVariants: {..., size: "default"} }
// )
// For this prototype, existing badge size is fine.
