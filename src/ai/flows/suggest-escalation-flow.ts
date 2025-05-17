
'use server';
/**
 * @fileOverview Suggests an appropriate escalation path for a cybercrime report
 * based on detailed inputs including report text, type, suspect information, and location.
 *
 * - suggestEscalation - A function that handles the escalation suggestion process.
 * - SuggestEscalationInput - The input type for the suggestEscalation function.
 * - SuggestEscalationOutput - The return type for the suggestEscalation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { EscalationTarget } from '@/lib/types'; 

const SuggestEscalationInputSchema = z.object({
  reportText: z.string().describe('The detailed text of the cybercrime report, including description of the incident.'),
  reportType: z.string().describe('The primary type of the cybercrime (e.g., Hacking, Online Fraud).'),
  suspectInfo: z.string().optional().describe('Information about the suspect(s), if any (e.g., phone, email, IP, website, bank account). Example: "Suspect email: scam@example.com, IP: 1.2.3.4"'),
  locationInfo: z.string().optional().describe('Information about the incident location or victim location. Example: "Victim in Bihar, India" or "Server hosted in Mumbai"'),
  triageCategory: z.string().optional().describe('AI Triage determined category of the crime.'),
  triageUrgency: z.string().optional().describe('AI Triage determined urgency of the crime (High, Medium, Low).'),
});
export type SuggestEscalationInput = z.infer<typeof SuggestEscalationInputSchema>;

const SuggestEscalationOutputSchema = z.object({
  suggestedTarget: z
    .string()
    .describe(
      `The suggested escalation target. Must be one of: "${Object.values(EscalationTarget).join('", "')}".`
    ),
  reasoning: z.string().describe('A brief explanation for why this escalation target is suggested based on the provided rules and input.'),
});
export type SuggestEscalationOutput = z.infer<typeof SuggestEscalationOutputSchema>;

export async function suggestEscalation(input: SuggestEscalationInput): Promise<SuggestEscalationOutput> {
  return suggestEscalationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEscalationPrompt',
  input: {schema: SuggestEscalationInputSchema},
  output: {schema: SuggestEscalationOutputSchema},
  prompt: `You are an AI assistant specializing in cybercrime report analysis and routing for an Indian context.
  Your task is to suggest the most appropriate escalation path for a given cybercrime report using specific rules.

  Inputs provided:
  - Report Type: {{{reportType}}}
  - Report Details: {{{reportText}}}
  - Suspect Information: {{{suspectInfo}}}
  - Location Information: {{{locationInfo}}}
  - AI Triage Category: {{{triageCategory}}}
  - AI Triage Urgency: {{{triageUrgency}}}

  Analyze the inputs for:
  1.  Type of cybercrime.
  2.  Presence of foreign elements (e.g., foreign IP addresses, bank accounts, websites hosted abroad, international phone numbers/emails in suspectInfo or reportText).
  3.  Multiple jurisdiction clues (e.g., victim in one state, suspect/server in another state based on locationInfo, suspectInfo).

  Escalation Decision Tree (Strictly follow these rules):
  - If the report involves child abuse, terrorism, or clear threats to national security (discern from reportText, triageCategory):
    Suggest: "${EscalationTarget.NATIONAL_SECURITY_AGENCY_ALERT}"
    Reasoning: Mention the specific critical concern (child abuse, terrorism, national security threat).
  - Else if suspectInfo or reportText indicates scam from a foreign phone number, foreign IP address, or clear involvement of international entities AND the crime is significant (e.g. financial fraud, organized crime, not minor phishing):
    Suggest: "${EscalationTarget.INTERPOL_INTERNATIONAL_CRIME}"
    Reasoning: Mention the specific foreign element and its nature.
  - Else if suspectInfo or reportText mentions email servers, websites hosted outside India, or other technical elements with foreign links requiring specialized technical international coordination:
    Suggest: "${EscalationTarget.CERT_IN_TECHNICAL_EMERGENCY}" and mention MEA liaison if direct foreign government contact seems needed by CERT-In.
    Reasoning: Specify the technical foreign element. If MEA is relevant, state "CERT-In for technical aspects, MEA liaison for foreign coordination". The target should be "${EscalationTarget.CERT_IN_TECHNICAL_EMERGENCY}".
  - Else if the crime seems to be part of a national pattern (e.g. affecting multiple victims across states, large-scale fraud mentioned in reportText) OR involves a very large financial sum OR is complex organized cybercrime:
    Suggest: "${EscalationTarget.I4C_NATIONAL_COORDINATION}"
    Reasoning: Explain why it appears to be of national significance (pattern, high value, organized crime).
  - Else if there are clear cross-state links within India (e.g., victim in one state, suspect IP/phone/bank account in another state, based on locationInfo, suspectInfo, reportText):
    Suggest: "${EscalationTarget.STATE_CYBER_HQ}" (of the relevant state, if discernible, otherwise generic State HQ)
    Reasoning: Point out the cross-state linkage.
  - Else if the scam or incident appears localized (e.g., within a district or city) and doesn't meet above criteria:
    Suggest: "${EscalationTarget.LOCAL_DISTRICT_CYBER_CELL}"
    Reasoning: Indicate it appears to be a local matter.
  - Else (if none of the above clearly apply or information is insufficient for a specific external escalation):
    Suggest: "${EscalationTarget.INTERNAL_REVIEW_FURTHER_INFO_NEEDED}"
    Reasoning: State that more information or internal review is needed before external escalation.

  Always select ONE target from the provided list: "${Object.values(EscalationTarget).join('", "')}".
  Provide concise reasoning based *only* on the rules and input. Do not invent information.
  If triage urgency is High for 'Financial Fraud' or 'Sextortion', prioritize escalation to I4C or State HQ if criteria met.
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
    
    const validTargets = Object.values(EscalationTarget) as string[];
    if (!output || !validTargets.includes(output.suggestedTarget)) {
        console.warn(`AI suggested an invalid target: ${output?.suggestedTarget}. Defaulting.`);
        return {
            suggestedTarget: EscalationTarget.INTERNAL_REVIEW_FURTHER_INFO_NEEDED,
            reasoning: output?.reasoning || "AI could not determine a valid escalation target, or the suggested target was invalid. Defaulting to internal review and further information gathering."
        };
    }
    return output!;
  }
);
