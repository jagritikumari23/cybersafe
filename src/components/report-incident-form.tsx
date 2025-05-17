
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AlertTriangle, CalendarIcon, FileText, Globe, Info, Loader2, LocateFixed, MapPin, ShieldQuestion, UploadCloud, User, Waypoints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from "date-fns"
import { useToast } from '@/hooks/use-toast';
import { ReportType, type EvidenceFile, ReportStatus, type Report, AITriageCategory, AITriageUrgency, EscalationTarget, type SuspectDetails, type IncidentLocation } from '@/lib/types';
import { addReportToStorage, updateReportInStorage } from '@/lib/report-store';
import { autoTriage, type AutoTriageInput } from '@/ai/flows/auto-triage';
import { suggestEscalation, type SuggestEscalationInput } from '@/ai/flows/suggest-escalation-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'video/mp4', 'video/quicktime'];

const reportSchema = z.object({
  type: z.nativeEnum(ReportType, { required_error: 'Please select a report type.' }),
  description: z.string().min(50, 'Description must be at least 50 characters.').max(5000, 'Description must be at most 5000 characters.'),
  incidentDate: z.date({ required_error: 'Please select the date of the incident.' }),
  
  reporterName: z.string().optional().default(''),
  reporterContact: z.string().optional().default('').refine(val => !val || /^(^\S+@\S+\.\S+$)|(^\d{10}$)/.test(val), {
    message: "Invalid email or 10-digit phone number.",
  }),

  suspectPhone: z.string().optional().default(''),
  suspectEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  suspectIpAddress: z.string().ip({ version: "v4", message: "Invalid IPv4 address." }).optional().or(z.literal('')),
  suspectWebsite: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  suspectBankAccount: z.string().optional().default(''),
  suspectOtherInfo: z.string().max(500, "Suspect details too long").optional().default(''),

  locationType: z.enum(['auto', 'manual', 'not_provided']).default('not_provided'),
  manualLocationCity: z.string().optional().default(''),
  manualLocationState: z.string().optional().default(''),
  manualLocationCountry: z.string().optional().default(''),
  
  additionalEvidenceText: z.string().max(2000, "Additional evidence text too long").optional().default(''),
  evidenceFiles: z.array(z.custom<File>(val => val instanceof File)).max(5, 'You can upload a maximum of 5 files.').optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

function generateStructuredId(city?: string, state?: string): string {
  const stateAbbr = state ? state.substring(0, 2).toUpperCase() : 'XX';
  const cityAbbr = city ? city.substring(0, 3).toUpperCase() : 'YYY';
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${stateAbbr}-${cityAbbr}-${year}-${randomSuffix}`;
}

export default function ReportIncidentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<EvidenceFile[]>([]);
  const [autoLocation, setAutoLocation] = useState<Partial<IncidentLocation> | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: '',
      reporterName: '',
      reporterContact: '',
      suspectPhone: '',
      suspectEmail: '',
      suspectIpAddress: '',
      suspectWebsite: '',
      suspectBankAccount: '',
      suspectOtherInfo: '',
      locationType: 'not_provided',
      manualLocationCity: '',
      manualLocationState: '',
      manualLocationCountry: 'India', // Default to India
      additionalEvidenceText: '',
      evidenceFiles: [],
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentFilesCount = selectedFiles.length;
      const newFilesCount = filesArray.length;

      if (currentFilesCount + newFilesCount > 5) {
        toast({ title: "File Limit Exceeded", description: `You can upload a maximum of 5 files. You have selected ${currentFilesCount} and tried to add ${newFilesCount}.`, variant: "destructive" });
        event.target.value = ''; return;
      }
      
      const newEvidenceFiles: EvidenceFile[] = [];
      const newFormFiles: File[] = [];

      for (const file of filesArray) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File Too Large", description: `${file.name} exceeds 5MB.`, variant: "destructive" });
          event.target.value = ''; return;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast({ title: "Invalid File Type", description: `${file.name} has an unsupported file type.`, variant: "destructive" });
          event.target.value = ''; return;
        }
        newEvidenceFiles.push({ name: file.name, type: file.type, size: file.size });
        newFormFiles.push(file);
      }
      setSelectedFiles(prev => [...prev, ...newEvidenceFiles]);
      form.setValue('evidenceFiles', [...(form.getValues('evidenceFiles') || []), ...newFormFiles] as any);
      event.target.value = '';
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    const currentFormFiles = form.getValues('evidenceFiles') || [];
    form.setValue('evidenceFiles', currentFormFiles.filter(file => file.name !== fileName));
  };

  const fetchUserLocation = () => {
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Basic reverse geocoding simulation or use a service in a real app
          // For prototype, we'll just store coords and a placeholder.
          const locationDetails = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          setAutoLocation({ latitude, longitude, details: locationDetails, country: "India (auto-detected)" });
          form.setValue('locationType', 'auto');
          toast({ title: "Location Fetched", description: "Your current location has been automatically determined." });
          setIsFetchingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({ title: 'Location Error', description: 'Could not fetch location. Please enter manually or ensure permissions are granted.', variant: 'destructive' });
          form.setValue('locationType', 'manual'); // Fallback to manual
          setIsFetchingLocation(false);
        }
      );
    } else {
      toast({ title: 'Location Not Supported', description: 'Geolocation is not supported by your browser. Please enter manually.', variant: 'warning' });
      form.setValue('locationType', 'manual');
    }
  };

  useEffect(() => {
    if (form.watch('locationType') === 'auto' && !autoLocation && !isFetchingLocation) {
      fetchUserLocation();
    }
  }, [form.watch('locationType')]);


  async function onSubmit(data: ReportFormValues) {
    setIsSubmitting(true);

    let incidentLocationData: IncidentLocation;
    if (data.locationType === 'auto' && autoLocation) {
      incidentLocationData = {
        type: 'auto',
        details: autoLocation.details || 'Auto-detected location',
        latitude: autoLocation.latitude,
        longitude: autoLocation.longitude,
        city: autoLocation.city, // Would be set by reverse geocoding
        state: autoLocation.state, // Would be set by reverse geocoding
        country: autoLocation.country || 'India',
      };
    } else if (data.locationType === 'manual') {
      incidentLocationData = {
        type: 'manual',
        city: data.manualLocationCity,
        state: data.manualLocationState,
        country: data.manualLocationCountry,
        details: `${data.manualLocationCity}, ${data.manualLocationState}, ${data.manualLocationCountry}`.trim(),
      };
    } else {
      incidentLocationData = { type: 'not_provided' };
    }
    
    const reportId = generateStructuredId(incidentLocationData.city, incidentLocationData.state);

    const suspectDetails: SuspectDetails = {
        phone: data.suspectPhone,
        email: data.suspectEmail,
        ipAddress: data.suspectIpAddress,
        website: data.suspectWebsite,
        bankAccount: data.suspectBankAccount,
        otherInfo: data.suspectOtherInfo,
    };
    
    let currentReport: Report = {
      id: reportId,
      type: data.type,
      description: data.description,
      incidentDate: data.incidentDate.toISOString(),
      reporterName: data.reporterName,
      reporterContact: data.reporterContact,
      suspectDetails: Object.values(suspectDetails).some(val => val && val.length > 0) ? suspectDetails : undefined,
      incidentLocation: incidentLocationData,
      additionalEvidenceText: data.additionalEvidenceText,
      evidenceFiles: selectedFiles,
      submissionDate: new Date().toISOString(),
      status: ReportStatus.FILED,
      timelineNotes: "Report submitted. Awaiting initial processing."
    };
    addReportToStorage(currentReport);
    toast({ title: 'Report Filed', description: `Your report ID is ${reportId}. Starting AI analysis.` });

    try {
      // AI Triage
      currentReport.status = ReportStatus.AI_TRIAGE_PENDING;
      currentReport.timelineNotes = "Report submitted. AI Triage in progress...";
      updateReportInStorage(currentReport);
      toast({ title: 'Processing...', description: `Report ${reportId}: AI Triage is in progress.`, duration: 2000 });

      const triageInput: AutoTriageInput = {
        reportText: `Type: ${data.type}\nDescription: ${data.description}${data.reporterName ? `\nReporter: ${data.reporterName}`: ''}`,
      };
      const triageResult = await autoTriage(triageInput);
      
      currentReport.aiTriage = {
          category: triageResult.category as AITriageCategory | string,
          urgency: triageResult.urgency as AITriageUrgency | string,
          summary: triageResult.summary,
      };
      currentReport.status = ReportStatus.AI_TRIAGE_COMPLETED;
      currentReport.timelineNotes = `AI Triage complete. Category: ${triageResult.category}. Urgency: ${triageResult.urgency}. Preparing escalation suggestion...`;
      updateReportInStorage(currentReport);
      toast({ title: 'AI Triage Completed', description: `Report ${reportId} analyzed. Category: ${triageResult.category}, Urgency: ${triageResult.urgency}.`, variant: "default" });

      // Escalation Suggestion
      currentReport.status = ReportStatus.ESCALATION_SUGGESTION_PENDING;
      updateReportInStorage(currentReport);
      toast({ title: 'Processing...', description: `Report ${reportId}: Suggesting escalation path.`, duration: 2000 });
      
      let suspectInfoForAI = "No specific suspect details provided.";
      if (currentReport.suspectDetails) {
        suspectInfoForAI = Object.entries(currentReport.suspectDetails)
            .filter(([, value]) => value && value.trim() !== "")
            .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`) // Add space before caps for readability
            .join(', ') || suspectInfoForAI;
      }

      const escalationInput: SuggestEscalationInput = {
        reportText: `Type: ${data.type}. Description: ${data.description}. Incident Location: ${currentReport.incidentLocation?.details || 'Not specified'}. Additional Evidence Text: ${data.additionalEvidenceText || 'None'}.`,
        reportType: data.type,
        suspectInfo: suspectInfoForAI,
        locationInfo: currentReport.incidentLocation?.details || 'Not specified',
        triageCategory: triageResult.category,
        triageUrgency: triageResult.urgency,
      };
      const escalationResult = await suggestEscalation(escalationInput);

      currentReport.aiEscalation = {
        target: escalationResult.suggestedTarget as EscalationTarget | string,
        reasoning: escalationResult.reasoning,
      };
      currentReport.status = ReportStatus.ESCALATION_SUGGESTION_COMPLETED;
      
      // Simulate case acceptance and officer assignment based on urgency
      if (triageResult.urgency === AITriageUrgency.HIGH || triageResult.urgency === AITriageUrgency.MEDIUM) {
        currentReport.assignedOfficerName = "Officer K (System Assigned)"; // Mock assignment
        currentReport.chatId = `chat_${reportId}`;
        currentReport.status = ReportStatus.OFFICER_ASSIGNED;
        currentReport.timelineNotes = `AI analysis complete. Escalation to ${escalationResult.suggestedTarget} suggested. Officer K assigned. Investigation will commence shortly. You can use the chat feature for updates.`;
         toast({ title: 'Officer Assigned & Escalation Suggested', description: `Officer K assigned to Report ${reportId}. Suggested Escalation: ${escalationResult.suggestedTarget}.`, variant: "default", duration: 6000 });
      } else {
        currentReport.status = ReportStatus.CASE_ACCEPTED; // Case accepted, but not high enough for immediate officer
        currentReport.timelineNotes = `AI analysis complete. Escalation to ${escalationResult.suggestedTarget} suggested. Your case has been accepted and will be reviewed by personnel for further action.`;
        toast({ title: 'Escalation Suggestion Ready', description: `Report ${reportId} processed. Suggested Escalation: ${escalationResult.suggestedTarget}. Case accepted for review.`, variant: "default", duration: 6000 });
      }

      // Simulate notification to authority
      if (escalationResult.suggestedTarget !== EscalationTarget.INTERNAL_REVIEW_FURTHER_INFO_NEEDED) {
        toast({
            title: "Authority Notification (Simulated)",
            description: `A notification for escalation to ${escalationResult.suggestedTarget} would be sent.`,
            variant: "info",
            duration: 5000
        });
      }
      
      updateReportInStorage(currentReport);
      
      form.reset();
      setSelectedFiles([]);
      setAutoLocation(null);
      router.push(`/track-report?id=${reportId}`);

    } catch (error) {
      console.error('Error during AI processing steps:', error);
      currentReport.status = ReportStatus.FILED; 
      currentReport.aiTriage = currentReport.aiTriage || { category: "Error", urgency: "N/A", summary: "AI Triage failed."};
      currentReport.aiEscalation = currentReport.aiEscalation || { target: EscalationTarget.INTERNAL_REVIEW_FURTHER_INFO_NEEDED, reasoning: "Escalation suggestion failed."};
      currentReport.timelineNotes = "An error occurred during AI analysis. Your report has been filed with basic details. Please check tracking. It will be manually reviewed.";
      updateReportInStorage(currentReport);
      toast({
        title: 'Processing Error',
        description: 'An error occurred during AI analysis. Report submitted. It will be manually reviewed.',
        variant: 'destructive',
      });
      router.push(`/track-report?id=${reportId}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Report a Cybercrime Incident</CardTitle>
        <CardDescription>Please provide comprehensive details for effective analysis and action.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold">Core Incident Details</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Cybercrime</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select the type of incident" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ReportType).map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Incident</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description of Incident</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe what happened, when, platforms involved, amounts, any suspect information..." className="min-h-[150px] resize-y" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold">Your Information (Optional)</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                   <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle>Why provide contact info?</AlertTitle>
                    <AlertDescription>
                      Providing your contact details can help investigators reach out if more information is needed. It remains confidential.
                    </AlertDescription>
                  </Alert>
                  <FormField control={form.control} name="reporterName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl><Input placeholder="Enter your full name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="reporterContact" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Phone Number</FormLabel>
                        <FormControl><Input placeholder="Enter your email or 10-digit phone number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold">Suspect Information (If known)</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="suspectPhone" render={({ field }) => (<FormItem><FormLabel>Suspect Phone</FormLabel><FormControl><Input placeholder="e.g., +91XXXXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="suspectEmail" render={({ field }) => (<FormItem><FormLabel>Suspect Email</FormLabel><FormControl><Input placeholder="e.g., suspect@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="suspectIpAddress" render={({ field }) => (<FormItem><FormLabel>Suspect IP Address</FormLabel><FormControl><Input placeholder="e.g., 192.168.1.100" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="suspectWebsite" render={({ field }) => (<FormItem><FormLabel>Suspect Website/URL</FormLabel><FormControl><Input placeholder="e.g., https://scamwebsite.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="suspectBankAccount" render={({ field }) => (<FormItem><FormLabel>Suspect Bank Account (if any)</FormLabel><FormControl><Input placeholder="Bank name and account number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="suspectOtherInfo" render={({ field }) => (<FormItem><FormLabel>Other Suspect Details</FormLabel><FormControl><Textarea placeholder="Any other handles, profiles, or information" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-semibold">Incident Location</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                    <FormField
                        control={form.control}
                        name="locationType"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>How would you like to provide location?</FormLabel>
                            <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select location method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_provided">Prefer not to say / Not relevant</SelectItem>
                                    <SelectItem value="auto">Use My Current Location</SelectItem>
                                    <SelectItem value="manual">Enter Manually</SelectItem>
                                </SelectContent>
                            </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {form.watch('locationType') === 'auto' && (
                        <div className="p-3 border rounded-md bg-muted/50">
                            {isFetchingLocation && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching location...</p>}
                            {autoLocation?.details && <p className="text-sm text-foreground">Auto-detected: {autoLocation.details}</p>}
                            {!isFetchingLocation && !autoLocation?.details && <p className="text-sm text-destructive">Could not fetch location. Try manual entry.</p>}
                        </div>
                    )}
                    {form.watch('locationType') === 'manual' && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="manualLocationCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City of incident" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="manualLocationState" render={({ field }) => (<FormItem><FormLabel>State/Province</FormLabel><FormControl><Input placeholder="State/Province" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="manualLocationCountry" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="Country of incident" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    )}
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-lg font-semibold">Evidence</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="additionalEvidenceText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Evidence Details (URLs, Email Excerpts, etc.)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Paste relevant URLs, email headers/content, chat logs, transaction IDs here..." className="min-h-[100px] resize-y" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="evidenceFiles"
                    render={({ field }) => ( 
                      <FormItem>
                        <FormLabel>Upload Evidence Files (Screenshots, Documents)</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer border-input hover:border-primary transition-colors">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">Max 5 files, up to 5MB each. Allowed: JPG, PNG, PDF, TXT, MP4, MOV</p>
                            <Input type="file" multiple className="hidden" id="evidence-upload" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} value="" />
                            <label htmlFor="evidence-upload" className="mt-2 text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">Browse files</label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Files:</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        {selectedFiles.map((file, index) => (
                          <li key={`${file.name}-${index}`} className="text-sm flex items-center justify-between">
                            <span className="truncate max-w-[calc(100%-4rem)]"><FileText className="inline h-4 w-4 mr-1 text-muted-foreground"/>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.name)} className="text-destructive hover:text-destructive/80">Remove</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button type="submit" className="w-full md:w-auto text-lg py-3 px-6" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting & Analyzing...</>) : ('Submit Report Securely')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
