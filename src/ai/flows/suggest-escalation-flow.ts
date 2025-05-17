
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
import { EscalationTarget, ReportType } from '@/lib/types'; 

const SuggestEscalationInputSchema = z.object({
  reportText: z.string().describe('The detailed text of the cybercrime report (preferably in English), including description of the incident.'),
  reportType: z.nativeEnum(ReportType).describe('The primary type of the cybercrime (e.g., Hacking, Online Fraud) as selected by user.'),
  suspectInfo: z.string().optional().describe('Information about the suspect(s), if any (e.g., phone, email, IP, website, bank account). Example: "Suspect email: scam@example.com, IP: 1.2.3.4"'),
  locationInfo: z.string().optional().describe('Information about the incident location or victim location (e.g., "Victim in Bihar, India", "Server hosted in Mumbai", "Website domain registered in US").'),
  additionalEvidenceText: z.string().optional().describe('Additional textual evidence like URLs, email headers/content, chat logs, transaction IDs.'),
  triageCategory: z.string().optional().describe('AI Triage determined category of the crime (e.g., Financial Fraud, Sextortion).'),
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
  Your task is to suggest the most appropriate escalation path for a given cybercrime report using specific rules. The report text should be in English.

  Inputs provided:
  - User Selected Report Type: {{{reportType}}}
  - Report Details (description, potentially translated to English): {{{reportText}}}
  - Suspect Information: {{{suspectInfo}}}
  - Location Information (victim, incident, server): {{{locationInfo}}}
  - Additional Textual Evidence (URLs, email excerpts, etc.): {{{additionalEvidenceText}}}
  - AI Triage Determined Category: {{{triageCategory}}}
  - AI Triage Determined Urgency: {{{triageUrgency}}}

  Analyze all inputs for:
  1.  Nature and severity of the cybercrime (refer to reportType, reportText, triageCategory, triageUrgency).
  2.  Presence of foreign elements: Check suspectInfo (foreign phone numbers like non +91, international bank details if mentioned), locationInfo (mentions of foreign countries for victim, suspect, or servers/websites), additionalEvidenceText (foreign URLs, emails from foreign domains).
  3.  Multiple jurisdiction clues within India: Check locationInfo, suspectInfo for details pointing to different Indian states (e.g., victim in one state, suspect IP/phone/bank account in another).

  Escalation Decision Tree (Strictly follow these rules in order of precedence):
  - If reportText, triageCategory, or reportType clearly indicate child abuse, child sexual exploitation material (CSAM), terrorism, or direct threats to national security:
    Suggest: "${EscalationTarget.NATIONAL_SECURITY_AGENCY_ALERT}"
    Reasoning: Mention the specific critical concern (child abuse/CSAM, terrorism, national security threat).
  - Else if suspectInfo, locationInfo or additionalEvidenceText strongly indicate a scam originating from a foreign phone number (non +91), a foreign IP address clearly linked to the scam, or definite involvement of international financial entities (e.g. foreign bank in suspect details) for a significant crime (e.g. major financial fraud, organized crime, not minor isolated phishing):
    Suggest: "${EscalationTarget.INTERPOL_INTERNATIONAL_CRIME}"
    Reasoning: Mention the specific foreign element (e.g., "foreign phone number used by suspect", "international bank account involved") and its nature.
  - Else if locationInfo, suspectInfo, or additionalEvidenceText mention email servers hosted outside India, websites hosted abroad, or other critical technical infrastructure with clear foreign links requiring specialized technical international coordination (e.g. DDOS attack from foreign servers):
    Suggest: "${EscalationTarget.CERT_IN_TECHNICAL_EMERGENCY}"
    Reasoning: Specify the technical foreign element (e.g., "website hosted on foreign server", "email originated from international mail server"). If MEA liaison seems necessary for CERT-In's work (e.g. contacting foreign ISPs), you can note "CERT-In for technical aspects; MEA liaison may be required for foreign government coordination". The target must remain "${EscalationTarget.CERT_IN_TECHNICAL_EMERGENCY}".
  - Else if the crime appears to be part of a large-scale national pattern (e.g. affecting multiple victims across states as described in reportText, a major data breach of an Indian entity, complex organized cybercrime network operating nationally) OR involves a very substantial financial sum (e.g. > Rs 1 Crore indicated) OR triageUrgency is 'High' for 'Financial Fraud' or 'Sextortion' and it appears widespread:
    Suggest: "${EscalationTarget.I4C_NATIONAL_COORDINATION}"
    Reasoning: Explain why it appears to be of national significance (e.g., "pattern suggests national scale", "high financial value impacting multiple users", "organized cybercrime network").
  - Else if there are clear cross-state links within India (e.g., victim in one state, suspect IP/phone/bank account in another state based on locationInfo, suspectInfo, reportText):
    Suggest: "${EscalationTarget.STATE_CYBER_HQ}" (mention "of relevant state(s)" if discernible, otherwise generic State HQ)
    Reasoning: Point out the cross-state linkage (e.g., "victim in State A, suspect's bank in State B").
  - Else if the scam or incident appears localized (e.g., within a district or city, or online harassment between known local individuals) and doesn't meet above criteria:
    Suggest: "${EscalationTarget.LOCAL_DISTRICT_CYBER_CELL}"
    Reasoning: Indicate it appears to be a local matter.
  - Else (if none of the above clearly apply or information is insufficient for a specific external escalation):
    Suggest: "${EscalationTarget.INTERNAL_REVIEW_FURTHER_INFO_NEEDED}"
    Reasoning: State that more information or internal review is needed before external escalation. Be specific if possible (e.g. "Insufficient details on suspect location for specific jurisdiction", "Nature of foreign element unclear for targeted escalation").

  Always select ONE target from the provided list: "${Object.values(EscalationTarget).join('", "')}".
  Provide concise reasoning based *only* on the rules and input. Do not invent information.
  If triageUrgency is High, especially for Financial Fraud or Sextortion, prioritize I4C or State HQ if other criteria for them are met.
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
    return output;
  }
);
