'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ShieldCheck, ShieldAlert, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateCyberRiskScore, type CyberRiskAssessmentInput } from '@/ai/flows/cyber-risk-score-flow';
import type { CyberRiskQuestion, CyberRiskResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const questions: CyberRiskQuestion[] = [
  { id: 'q1_passwords', text: 'Do you use strong, unique passwords for different online accounts (e.g., using a password manager)?', answerType: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { id: 'q2_2fa', text: 'Do you enable Two-Factor Authentication (2FA/MFA) on your important accounts (email, banking, social media) wherever available?', answerType: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { id: 'q3_updates', text: 'Do you regularly update your software, apps, and operating system on your devices?', answerType: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { id: 'q4_phishing', text: 'Are you cautious about clicking links or downloading attachments from unknown or unsolicited emails and messages?', answerType: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { id: 'q5_vpn', text: 'How often do you use a VPN (Virtual Private Network) when connecting to public Wi-Fi networks?', answerType: 'select', options: [{ value: 'always', label: 'Always' }, { value: 'sometimes', label: 'Sometimes' }, { value: 'rarely_never', label: 'Rarely/Never' }] },
  { id: 'q6_backup', text: 'Do you regularly back up your important personal data (photos, documents, etc.) to an external drive or cloud service?', answerType: 'radio', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
];

const generateFormSchema = () => {
  const schemaObject: Record<string, z.ZodString> = {};
  questions.forEach(q => {
    schemaObject[q.id] = z.string().min(1, { message: "Please select an answer." });
  });
  return z.object(schemaObject);
};

const formSchema = generateFormSchema();
type FormValues = z.infer<typeof formSchema>;

export default function CyberRiskForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<CyberRiskResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: questions.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {}),
    mode: 'onChange', // Important for enabling submit button based on form.formState.isValid
  });

  const handleNextQuestion = async () => {
    const currentFieldId = questions[currentQuestionIndex].id as any;
    const isValid = await form.trigger(currentFieldId); // Validate current field
    if (isValid && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const onFinalSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setAssessmentResult(null);
    try {
      const aiInput: CyberRiskAssessmentInput = { answers: data };
      const result = await calculateCyberRiskScore(aiInput);
      setAssessmentResult(result);
      toast({
        title: 'Assessment Complete!',
        description: `Your Cyber Risk Score is ${result.score}/100.`,
        variant: result.level === 'Low' || result.level === 'Medium' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error calculating risk score:', error);
      toast({
        title: 'Error',
        description: 'Could not calculate your risk score. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev -1);
    }
  }
  
  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;


  if (assessmentResult) {
    const scoreColor = assessmentResult.score <= 33 ? 'text-green-500' : assessmentResult.score <= 66 ? 'text-yellow-500' : 'text-red-500';
    const levelIcon = assessmentResult.level === 'Low' ? <ShieldCheck className={`h-6 w-6 ${scoreColor}`} /> : <ShieldAlert className={`h-6 w-6 ${scoreColor}`} />;


    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Your Cyber Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Your Score:</p>
            <p className={`text-6xl font-bold my-2 ${scoreColor}`}>{assessmentResult.score}<span className="text-3xl">/100</span></p>
            <div className="flex items-center justify-center text-2xl font-semibold">
              {levelIcon}
              <span className="ml-2">{assessmentResult.level} Risk</span>
            </div>
          </div>
          
          <Alert variant={assessmentResult.level === 'Low' || assessmentResult.level === 'Medium' ? 'default' : 'destructive'} className="bg-opacity-10">
             {assessmentResult.level === 'Low' || assessmentResult.level === 'Medium' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle className="font-semibold">Summary</AlertTitle>
            <AlertDescription>{assessmentResult.summaryMessage}</AlertDescription>
          </Alert>

          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" />Personalized Recommendations:</h3>
            <ul className="space-y-2 list-disc list-inside text-foreground/90">
              {assessmentResult.recommendations.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
           <Button onClick={() => { setAssessmentResult(null); setCurrentQuestionIndex(0); form.reset(); }} className="w-full" variant="outline">
            Retake Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Cyber Risk Self-Assessment</CardTitle>
        <CardDescription>Answer a few questions to understand your current cyber risk profile.</CardDescription>
         <Progress value={progress} className="w-full mt-2 h-2" />
         <p className="text-sm text-muted-foreground text-right mt-1">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* The form element now uses form.handleSubmit for the final submission */}
          <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-8">
            <div key={currentQuestion.id} className="space-y-4 p-1">
                <FormLabel className="text-lg font-semibold text-foreground">{currentQuestion.text}</FormLabel>
                <FormField
                    control={form.control}
                    name={currentQuestion.id as any}
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                        {currentQuestion.answerType === 'radio' ? (
                            <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                            >
                            {currentQuestion.options.map(option => (
                                <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value={option.value} />
                                </FormControl>
                                <FormLabel className="font-normal text-md">{option.label}</FormLabel>
                                </FormItem>
                            ))}
                            </RadioGroup>
                        ) : (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentQuestion.options.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        )}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <CardFooter className="flex justify-between px-1">
                <Button type="button" variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0 || isSubmitting}>
                    Back
                </Button>

                {isLastQuestion ? (
                  <Button
                    type="submit" // This will trigger form.handleSubmit(onFinalSubmit)
                    disabled={isSubmitting || !form.formState.isValid} // Check overall form validity
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Calculating...' : 'Get My Score'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={!form.watch(currentQuestion.id as any) || isSubmitting } // Check current field for "Next"
                    className="min-w-[120px]"
                  >
                    Next Question
                  </Button>
                )}
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
