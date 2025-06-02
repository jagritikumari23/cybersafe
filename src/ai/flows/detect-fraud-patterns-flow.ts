
'use server';
/**
 * @fileOverview Detects potential fraud patterns by comparing a new report's suspect details
 * against a (simulated) list of known fraudulent identifiers or patterns from past reports.
 *
 * - detectFraudPatterns - A function that handles the fraud pattern detection.
 * - DetectFraudPatternsInput - The input type for the detectFraudPatterns function.
 * - DetectFraudPatternsOutput - The return type for the detectFraudPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import type { SuspectDetails, FraudPatternInfo } from '@/lib/types';

const SuspectDetailsSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  ipAddress: z.string().optional(),
  website: z.string().optional(),
  bankAccount: z.string().optional(),
  otherInfo: z.string().optional(),
});

const DetectFraudPatternsInputSchema = z.object({
  currentReportSuspectInfo: SuspectDetailsSchema.describe("Suspect details from the new report being analyzed."),
  // For a real system, this would come from a database of past reports / known fraudster profiles.
  // For prototype, we'll make the AI simulate this or pass a very small sample if available from localStorage.
  knownFraudulentIndicatorsText: z.string().describe(
    "A text block describing known fraudulent indicators. For example: 'Known scammer emails: fraudster@scam.com, badactor@phish.net. Known scam phone: +19876543210. Suspicious IP range: 123.45.67.x. Bank account 9876543210 linked to multiple frauds.'"
  ),
});
export type DetectFraudPatternsInput = z.infer<typeof DetectFraudPatternsInputSchema>;

// Output matches FraudPatternInfo from lib/types.ts
const DetectFraudPatternsOutputSchema = z.object({
  detected: z.boolean().describe('Whether a potential fraud pattern was detected.'),
  details: z.string().describe('Details about the detected pattern, or "No specific pattern detected" if none.'),
  confidence: z.enum(['High', 'Medium', 'Low']).optional().describe('Confidence level of the detection if a pattern is found.'),
});
export type DetectFraudPatternsOutput = z.infer<typeof DetectFraudPatternsOutputSchema>;


export async function detectFraudPatterns(input: DetectFraudPatternsInput): Promise<DetectFraudPatternsOutput> {
  return detectFraudPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectFraudPatternsPrompt',
  input: {schema: DetectFraudPatternsInputSchema},
  output: {schema: DetectFraudPatternsOutputSchema},
  prompt: `You are an AI assistant specialized in detecting fraud patterns in cybercrime reports.
  Your task is to compare suspect information from a new report against a list of known fraudulent indicators.

  New Report Suspect Information:
  - Phone: {{{currentReportSuspectInfo.phone}}}
  - Email: {{{currentReportSuspectInfo.email}}}
  - IP Address: {{{currentReportSuspectInfo.ipAddress}}}
  - Website: {{{currentReportSuspectInfo.website}}}
  - Bank Account: {{{currentReportSuspectInfo.bankAccount}}}
  - Other Info: {{{currentReportSuspectInfo.otherInfo}}}

  Known Fraudulent Indicators (from past cases or intelligence):
  {{{knownFraudulentIndicatorsText}}}

  Analyze the new report's suspect information. Check if any of the provided details (phone, email, IP, website, bank account, or highly similar patterns in otherInfo) match or are very similar to the known fraudulent indicators.

  - If a direct match or a very strong similarity is found (e.g., same email, same phone, IP in known malicious range, bank account previously flagged):
    Set 'detected' to true.
    Provide 'details' explaining WHAT matched (e.g., "Email address '{{currentReportSuspectInfo.email}}' matches a known fraudulent email.").
    Set 'confidence' to 'High' for direct matches, or 'Medium' for strong similarities.
  - If there are suggestive similarities but not direct matches (e.g., website domain is a common misspelling of a known scam site mentioned in otherInfo):
    Set 'detected' to true.
    Provide 'details' explaining the similarity (e.g., "Website '{{currentReportSuspectInfo.website}}' is highly similar to a known phishing domain pattern.").
    Set 'confidence' to 'Medium' or 'Low'.
  - If no significant matches or similarities are found:
    Set 'detected' to false.
    Set 'details' to "No specific fraud pattern detected based on available indicators."
    You can omit 'confidence' or set it to 'Low'.

  Focus on accuracy. Only flag if there's a reasonable indication of a link.
  `,
});

const detectFraudPatternsFlow = ai.defineFlow(
  {
    name: 'detectFraudPatternsFlow',
    inputSchema: DetectFraudPatternsInputSchema,
    outputSchema: DetectFraudPatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      return {
        detected: false,
        details: "AI pattern analysis failed to return a result.",
      };
    }
    return output;
  }
);
