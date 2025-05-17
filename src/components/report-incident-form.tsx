'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';
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
import { CalendarIcon, FileText, Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from "date-fns"
import { useToast } from '@/hooks/use-toast';
import { ReportType, type EvidenceFile, ReportStatus, type Report, AITriageCategory, AITriageUrgency } from '@/lib/types';
import { addReportToStorage } from '@/lib/report-store';
import { autoTriage, type AutoTriageInput } from '@/ai/flows/auto-triage'; // Corrected import for server action
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'video/mp4', 'video/quicktime'];

const reportSchema = z.object({
  type: z.nativeEnum(ReportType, { required_error: 'Please select a report type.' }),
  description: z.string().min(50, 'Description must be at least 50 characters.').max(5000, 'Description must be at most 5000 characters.'),
  incidentDate: z.date({ required_error: 'Please select the date of the incident.' }),
  reporterName: z.string().optional(),
  reporterContact: z.string().optional().refine(val => !val || /^(^\S+@\S+\.\S+$)|(^\d{10}$)/.test(val), {
    message: "Invalid email or 10-digit phone number.",
  }),
  evidenceFiles: z.array(z.custom<File>(val => val instanceof File)).max(5, 'You can upload a maximum of 5 files.').optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportIncidentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<EvidenceFile[]>([]);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: '',
      evidenceFiles: [],
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const newEvidenceFiles: EvidenceFile[] = filesArray.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));

      const allFiles = [...selectedFiles, ...newEvidenceFiles];
      
      if (allFiles.length > 5) {
        toast({ title: "File Limit Exceeded", description: "You can upload a maximum of 5 files.", variant: "destructive" });
        return;
      }

      for (const file of newEvidenceFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File Too Large", description: `${file.name} exceeds 5MB.`, variant: "destructive" });
          return;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast({ title: "Invalid File Type", description: `${file.name} has an unsupported file type.`, variant: "destructive" });
          return;
        }
      }
      setSelectedFiles(allFiles);
      form.setValue('evidenceFiles', filesArray as any); // react-hook-form expects File[]
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    const currentFormFiles = form.getValues('evidenceFiles') || [];
    form.setValue('evidenceFiles', currentFormFiles.filter(file => file.name !== fileName));
  };

  async function onSubmit(data: ReportFormValues) {
    setIsSubmitting(true);
    try {
      const reportId = `CS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const newReport: Omit<Report, 'aiTriage' | 'status'> = {
        id: reportId,
        type: data.type,
        description: data.description,
        incidentDate: data.incidentDate.toISOString(),
        reporterName: data.reporterName,
        reporterContact: data.reporterContact,
        evidenceFiles: selectedFiles,
        submissionDate: new Date().toISOString(),
      };
      
      // Store report first with pending AI status
      addReportToStorage({ ...newReport, status: ReportStatus.AI_TRIAGE_PENDING });
      toast({ title: 'Report Submitted', description: `Your report ID is ${reportId}. AI Triage is in progress.` });

      // Perform AI Triage
      const triageInput: AutoTriageInput = {
        reportText: `Type: ${data.type}\nDescription: ${data.description}`,
      };
      const triageResult = await autoTriage(triageInput);
      
      const completeReport: Report = {
        ...newReport,
        aiTriage: {
            category: triageResult.category as AITriageCategory | string,
            urgency: triageResult.urgency as AITriageUrgency | string,
            summary: triageResult.summary,
        },
        status: ReportStatus.AI_TRIAGE_COMPLETED,
      };

      addReportToStorage(completeReport); // Update report with AI triage results
      toast({ title: 'AI Triage Completed', description: `Report ${reportId} has been analyzed.`, variant: "default" });
      
      form.reset();
      setSelectedFiles([]);
      router.push(`/track-report?id=${reportId}`);

    } catch (error) {
      console.error('Error submitting report or with AI triage:', error);
      toast({
        title: 'Submission Error',
        description: 'Could not submit report or AI triage failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Report a Cybercrime Incident</CardTitle>
        <CardDescription>Please provide as much detail as possible. All information is kept confidential.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Cybercrime</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of incident" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ReportType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
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
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
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
                  <FormLabel>Description of Incident</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what happened, when, and any other relevant details..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please be specific. Include details like platform (e.g., Instagram, bank website), amounts involved, and any suspect information.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidenceFiles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Evidence (Screenshots, Documents, etc.)</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer border-input hover:border-primary transition-colors">
                       <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">Max 5 files, up to 5MB each. Allowed: JPG, PNG, PDF, TXT, MP4, MOV</p>
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="evidence-upload"
                        onChange={handleFileChange}
                        accept={ALLOWED_FILE_TYPES.join(',')}
                      />
                       <label htmlFor="evidence-upload" className="mt-2 text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">
                        Browse files
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload any supporting evidence. Ensure no personal sensitive data of others is included without consent unless crucial for the case.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Files:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm flex items-center justify-between">
                      <span className="truncate max-w-[80%]"><FileText className="inline h-4 w-4 mr-1 text-muted-foreground"/>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.name)} className="text-destructive hover:text-destructive/80">Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Your Contact Information (Optional)</h3>
                <FormField
                control={form.control}
                name="reporterName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="reporterContact"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email or Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter your email or 10-digit phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>


            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting & Analyzing...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
