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

const AutoTriageInputSchema = z.object({
  reportText: z.string().describe('The text of the cybercrime report.'),
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
      'Other',
    ])
    .describe('The category of the cybercrime report.'),
  urgency: z
    .enum(['High', 'Medium', 'Low'])
    .describe(
      'The urgency of the report, based on keywords like "threat to life" or "lost huge money".'
    ),
  summary: z.string().describe('A short summary of the report.'),
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

  Given the following report text, classify the report into one of the following categories: Financial Fraud, Sextortion, Cyberbullying, Hacking, Identity Theft, or Other.
  Also, determine the urgency of the report as High, Medium, or Low, based on keywords like "threat to life", "lost huge money", etc.
  Finally, provide a short summary of the report.

  Report Text: {{{reportText}}}
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
    return output!;
  }
);
