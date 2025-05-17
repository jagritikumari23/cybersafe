
'use server';
/**
 * @fileOverview Automatically classifies and prioritizes cybercrime reports based on urgency.
 *
 * - autoTriage - A function that handles the report classification and prioritization process.
 * - AutoTriageInput - The input type for the autoTriage function.
 * - AutoTriageOutput - The return type for the autoTriage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ReportType } from '@/lib/types'; // Import ReportType

const AutoTriageInputSchema = z.object({
  reportText: z.string().describe('The text of the cybercrime report (preferably in English).'),
  reportType: z.nativeEnum(ReportType).describe('The user-selected type of cybercrime.'),
});
export type AutoTriageInput = z.infer<typeof AutoTriageInputSchema>;

const AutoTriageOutputSchema = z.object({
  category: z
    .enum([
      'Financial Fraud',
      'Sextortion',
      'Cyberbullying',
      'Hacking',
      'Identity Theft',
      'Phishing', // Added Phishing as a distinct category if AI can discern
      'Other',
    ])
    .describe('The AI determined category of the cybercrime report.'),
  urgency: z
    .enum(['High', 'Medium', 'Low'])
    .describe(
      'The urgency of the report, based on keywords like "threat to life", "significant financial loss", "ongoing attack", etc.'
    ),
  summary: z.string().describe('A short summary of the report (max 1-2 sentences).'),
});
export type AutoTriageOutput = z.infer<typeof AutoTriageOutputSchema>;

export async function autoTriage(input: AutoTriageInput): Promise<AutoTriageOutput> {
  return autoTriageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoTriagePrompt',
  input: {schema: AutoTriageInputSchema},
  output: {schema: AutoTriageOutputSchema},
  prompt: `You are an AI assistant specializing in triaging cybercrime reports.
  The user has already categorized this report as type: {{reportType}}.
  Your primary task is to refine this, determine urgency, and summarize.

  Given the following report text (which should be in English for best results):
  "{{{reportText}}}"

  1. Refined Category: Based on the report text, confirm or refine the cybercrime category. Choose one: Financial Fraud, Sextortion, Cyberbullying, Hacking, Identity Theft, Phishing, Other.
     If the user's type '{{reportType}}' strongly aligns, use it. If the text clearly indicates a more specific or different category from the list, select that.
  2. Urgency: Determine the urgency as High, Medium, or Low.
     - High: Implies immediate threat (e.g., threat to life, safety, critical infrastructure), ongoing significant financial loss, child safety issues, national security.
     - Medium: Serious incidents like significant financial loss already occurred but not ongoing, major identity theft, severe harassment.
     - Low: Less severe cases, minor financial loss, past incidents with no current threat.
  3. Summary: Provide a concise 1-2 sentence summary of the core issue in the report.

  Focus on accuracy and strict adherence to the defined categories and urgency levels.
  `,
});

const autoTriageFlow = ai.defineFlow(
  {
    name: 'autoTriageFlow',
    inputSchema: AutoTriageInputSchema,
    outputSchema: AutoTriageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (!output) {
        throw new Error("AI Triage failed, AI did not return an output.");
    }
    return output;
  }
);
