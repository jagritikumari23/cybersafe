
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
import { AlertTriangle, CalendarIcon, FileText, Globe, Info, Languages, Loader2, LocateFixed, MapPin, ShieldQuestion, UploadCloud, User, Waypoints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from "date-fns"
import { useToast } from '@/hooks/use-toast';
import { ReportType, type EvidenceFile, type Report, type SuspectDetails, type IncidentLocation, ComplaintLanguages, type ComplaintLanguageCode } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'video/mp4', 'video/quicktime'];

const reportSchema = z.object({
  type: z.nativeEnum(ReportType, { required_error: 'Please select a report type.' }),
  originalDescriptionLanguage: z.string().min(1, "Please select the language of your description."),
  description: z.string().min(50, 'Description must be at least 50 characters.').max(5000, 'Description must be at most 5000 characters.'),
  incidentDate: z.date({ required_error: 'Please select the date of the incident.' }),
  
  reporterName: z.string().optional(),
  reporterContact: z.string().optional().refine(val => !val || val === '' || /^(^\S+@\S+\.\S+$)|(^\d{10}$)/.test(val), {
    message: "Invalid email or 10-digit phone number.",
  }),

  suspectPhone: z.string().optional(),
  suspectEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  suspectIpAddress: z.string().ip({ version: "v4", message: "Invalid IPv4 address." }).optional().or(z.literal('')),
  suspectWebsite: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  suspectBankAccount: z.string().optional(),
  suspectOtherInfo: z.string().max(500, "Suspect details too long").optional(),

  locationType: z.enum(['auto', 'manual', 'not_provided']).default('not_provided'),
  manualLocationCity: z.string().optional(),
  manualLocationState: z.string().optional(),
  manualLocationCountry: z.string().optional(),
  
  additionalEvidenceText: z.string().max(2000, "Additional evidence text too long").optional(),
  // evidenceFiles are handled separately as they are File objects, not directly part of Zod schema for form values in the same way
}).refine(data => {
    if (data.locationType === 'manual') {
        return !!data.manualLocationCity && !!data.manualLocationState && !!data.manualLocationCountry;
    }
    return true;
}, {
    message: "City, State, and Country are required for manual location entry.",
    path: ["manualLocationCity"], // Path to display error, can be any of them
});


type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportIncidentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilesData, setSelectedFilesData] = useState<EvidenceFile[]>([]); // For display and to send to backend
  const [actualFiles, setActualFiles] = useState<File[]>([]); // For potential direct upload later, not directly used in this JSON submission

  const [autoLocation, setAutoLocation] = useState<Partial<IncidentLocation> | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: undefined, // No default type
      originalDescriptionLanguage: 'en', 
      description: '',
      incidentDate: undefined,
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
      manualLocationCountry: 'India', 
      additionalEvidenceText: '',
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const currentFilesCount = selectedFilesData.length;
      const newFilesCount = filesArray.length;

      if (currentFilesCount + newFilesCount > 5) {
        toast({ title: "File Limit Exceeded", description: `You can upload a maximum of 5 files. You have selected ${currentFilesCount} and tried to add ${newFilesCount}.`, variant: "destructive" });
        event.target.value = ''; return;
      }
      
      const newEvidenceFilesForDisplay: EvidenceFile[] = [];
      const newActualFormFiles: File[] = [];

      for (const file of filesArray) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File Too Large", description: `${file.name} exceeds 5MB.`, variant: "destructive" });
          event.target.value = ''; return;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast({ title: "Invalid File Type", description: `${file.name} has an unsupported file type.`, variant: "destructive" });
          event.target.value = ''; return;
        }
        newEvidenceFilesForDisplay.push({ name: file.name, type: file.type, size: file.size });
        newActualFormFiles.push(file);
      }
      setSelectedFilesData(prev => [...prev, ...newEvidenceFilesForDisplay]);
      setActualFiles(prev => [...prev, ...newActualFormFiles]); // Store actual files if needed for direct upload later
      event.target.value = '';
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFilesData(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setActualFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };
  
  const fetchUserLocation = () => {
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Basic reverse geocoding simulation (would use a service like Google Geocoding API in real app)
          let city = "Unknown City", state = "Unknown State", country = "Unknown Country";
          try {
            // Placeholder: In a real app, call a geocoding API here
            // For prototype, we'll keep it simple.
             city = "Auto-Detected City"; // Placeholder
             state = "Auto-Detected State"; // Placeholder
             country = "India (Approx.)";
          } catch (e) { console.error("Geocoding simulation error", e); }

          const locationDetails = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          setAutoLocation({ latitude, longitude, details: locationDetails, city, state, country });
          form.setValue('locationType', 'auto');
          toast({ title: "Location Fetched", description: `Location: ${city}, ${state}` });
          setIsFetchingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({ title: 'Location Error', description: 'Could not fetch location. Please enter manually or ensure permissions are granted.', variant: 'destructive' });
          form.setValue('locationType', 'manual'); 
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({ title: 'Location Not Supported', description: 'Geolocation is not supported by your browser. Please enter manually.', variant: 'warning' });
      form.setValue('locationType', 'manual');
    }
  };

  useEffect(() => {
    const locationType = form.watch('locationType');
    if (locationType === 'auto' && !autoLocation && !isFetchingLocation) {
      fetchUserLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('locationType')]);


  async function onSubmit(data: ReportFormValues) {
    setIsSubmitting(true);

    let incidentLocationPayload: IncidentLocation;
    if (data.locationType === 'auto' && autoLocation) {
      incidentLocationPayload = {
        type: 'auto',
        details: autoLocation.details || 'Auto-detected location',
        latitude: autoLocation.latitude,
        longitude: autoLocation.longitude,
        city: autoLocation.city, 
        state: autoLocation.state, 
        country: autoLocation.country || 'India (auto-detected)',
      };
    } else if (data.locationType === 'manual') {
      incidentLocationPayload = {
        type: 'manual',
        city: data.manualLocationCity,
        state: data.manualLocationState,
        country: data.manualLocationCountry,
        details: [data.manualLocationCity, data.manualLocationState, data.manualLocationCountry].filter(Boolean).join(', ') || 'Manual location entry',
      };
    } else {
      incidentLocationPayload = { type: 'not_provided' };
    }
    
    const suspectDetailsPayload: SuspectDetails = {
        phone: data.suspectPhone,
        email: data.suspectEmail,
        ipAddress: data.suspectIpAddress,
        website: data.suspectWebsite,
        bankAccount: data.suspectBankAccount,
        otherInfo: data.suspectOtherInfo,
    };

    // We send `selectedFilesData` which contains name, type, size.
    // Actual file binary data upload would require a different mechanism (e.g., FormData to a dedicated upload endpoint).
    const reportPayload = {
      type: data.type,
      originalDescriptionLanguage: data.originalDescriptionLanguage,
      description: data.description,
      incidentDate: data.incidentDate.toISOString(), // Ensure date is ISO string
      reporterName: data.reporterName,
      reporterContact: data.reporterContact,
      suspectDetails: Object.values(suspectDetailsPayload).some(val => String(val).trim()) ? suspectDetailsPayload : undefined,
      incidentLocation: incidentLocationPayload,
      additionalEvidenceText: data.additionalEvidenceText,
      evidenceFiles: selectedFilesData, // Sending metadata
    };

    try {
      toast({ title: 'Submitting Report...', description: 'Please wait while we process your report.', duration: 3000 });
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({error: "Server error during submission."}));
        throw new Error(errorData.details || errorData.error || `Server responded with ${response.status}`);
      }

      const submittedReport: Report = await response.json();

      toast({
        title: 'Report Submitted Successfully!',
        description: `Your report ID is ${submittedReport.id}. AI analysis results are available.`,
        variant: 'default',
        duration: 8000,
      });
      
      form.reset();
      setSelectedFilesData([]);
      setActualFiles([]);
      setAutoLocation(null);
      router.push(`/track-report?id=${submittedReport.id}`);

    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Submission Error',
        description: (error instanceof Error ? error.message : 'An unknown error occurred. Please try again.'),
        variant: 'destructive',
      });
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
                    name="originalDescriptionLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground" /> Language of Description</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ComplaintLanguages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Choose the language you will use for the incident description below.</FormDescription>
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
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                if (value === 'auto') fetchUserLocation();
                                if (value !== 'manual') { // Clear manual fields if not manual
                                    form.setValue('manualLocationCity', '');
                                    form.setValue('manualLocationState', '');
                                    // form.setValue('manualLocationCountry', 'India'); // Keep default or clear as needed
                                }
                            }} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Select location method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_provided">Prefer not to say / Not relevant</SelectItem>
                                    <SelectItem value="auto"><div className="flex items-center"><LocateFixed className="mr-2 h-4 w-4"/>Use My Current Location</div></SelectItem>
                                    <SelectItem value="manual"><div className="flex items-center"><MapPin className="mr-2 h-4 w-4"/>Enter Manually</div></SelectItem>
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
                            {autoLocation?.details && <p className="text-sm text-foreground">Auto-detected: {autoLocation.details} ({autoLocation.city}, {autoLocation.state})</p>}
                            {!isFetchingLocation && !autoLocation?.details && form.watch('locationType') === 'auto' && <p className="text-sm text-destructive">Could not fetch location. Ensure permissions are granted, or try manual entry.</p>}
                        </div>
                    )}
                    {form.watch('locationType') === 'manual' && (
                        <div className="space-y-4 p-1 border border-dashed rounded-md mt-2">
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
                   <FormItem> {/* No FormField needed as not directly part of Zod schema for form.handleSubmit */}
                        <FormLabel>Upload Evidence Files (Screenshots, Documents)</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer border-input hover:border-primary transition-colors">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">Max 5 files, up to 5MB each. Allowed: JPG, PNG, PDF, TXT, MP4, MOV</p>
                            <Input type="file" multiple className="hidden" id="evidence-upload" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} />
                            <label htmlFor="evidence-upload" className="mt-2 text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">Browse files</label>
                          </div>
                        </FormControl>
                        <FormMessage /> {/* For general file errors if any, not from Zod */}
                    </FormItem>
                  {selectedFilesData.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Files:</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        {selectedFilesData.map((file, index) => (
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
              {isSubmitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting &amp; Analyzing...</>) : ('Submit Report Securely')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
