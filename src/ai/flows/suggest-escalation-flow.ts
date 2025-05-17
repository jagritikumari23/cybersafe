
'use server';
/**
 * @fileOverview Suggests an appropriate escalation path for a cybercrime report.
 *
 * - suggestEscalation - A function that handles the escalation suggestion process.
 * - SuggestEscalationInput - The input type for the suggestEscalation function.
 * - SuggestEscalationOutput - The return type for the suggestEscalation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { EscalationTarget } from '@/lib/types'; // Import for prompting

const SuggestEscalationInputSchema = z.object({
  reportText: z.string().describe('The detailed text of the cybercrime report, including description and type.'),
  reportType: z.string().describe('The primary type of the cybercrime (e.g., Hacking, Online Fraud).'),
});
export type SuggestEscalationInput = z.infer<typeof SuggestEscalationInputSchema>;

const SuggestEscalationOutputSchema = z.object({
  suggestedTarget: z
    .string()
    .describe(
      `The suggested escalation target. Must be one of: "${Object.values(EscalationTarget).join('", "')}".`
    ),
  reasoning: z.string().describe('A brief explanation for why this escalation target is suggested.'),
});
export type SuggestEscalationOutput = z.infer<typeof SuggestEscalationOutputSchema>;

export async function suggestEscalation(input: SuggestEscalationInput): Promise<SuggestEscalationOutput> {
  return suggestEscalationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEscalationPrompt',
  input: {schema: SuggestEscalationInputSchema},
  output: {schema: SuggestEscalationOutputSchema},
  prompt: `You are an AI assistant specializing in cybercrime report analysis and routing.
  Your task is to suggest the most appropriate escalation path for a given cybercrime report.

  Consider the report type: {{{reportType}}}
  Consider the report details: {{{reportText}}}

  Based on this information, suggest an escalation target from the following options:
  - "${EscalationTarget.LOCAL_POLICE}": For general cybercrimes requiring local law enforcement attention.
  - "${EscalationTarget.STATE_CYBER_CELL}": For more complex cases or those spanning across districts within a state.
  - "${EscalationTarget.I4C}": For nationally significant financial frauds, organized cybercrime, or cases requiring central coordination.
  - "${EscalationTarget.CERT_IN}": For incidents involving critical infrastructure, government systems, or large-scale technical attacks like DDoS, malware outbreaks affecting many users.
  - "${EscalationTarget.INTERPOL}": For cases with clear international involvement (e.g., suspect or victim in different countries, international money trails).
  - "${EscalationTarget.NONE}": If the case seems minor, lacks sufficient details for escalation, or should be handled internally first.

  Provide your suggested target and a concise reasoning for your choice.
  If the report mentions specific entities like government websites, large financial losses, or international elements, use that to guide your decision.
  For example, hacking of a critical government website should go to CERT-In. Large financial fraud might go to I4C.
  If the crime seems localized and not part of a larger pattern, Local Police might be appropriate.
  `,
});

const suggestEscalationFlow = ai.defineFlow(
  {
    name: 'suggestEscalationFlow',
    inputSchema: SuggestEscalationInputSchema,
    outputSchema: SuggestEscalationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the output target is one of the predefined enum values, otherwise default to NONE
    const validTargets = Object.values(EscalationTarget) as string[];
    if (!output || !validTargets.includes(output.suggestedTarget)) {
        return {
            suggestedTarget: EscalationTarget.NONE,
            reasoning: output?.reasoning || "AI could not determine a valid escalation target, or the suggested target was invalid. Defaulting to internal review."
        };
    }
    return output!;
  }
);
