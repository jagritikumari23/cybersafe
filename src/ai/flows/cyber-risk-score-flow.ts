
'use server';
/**
 * @fileOverview Calculates a user's cyber risk score based on their answers to a questionnaire
 * and provides personalized recommendations.
 *
 * - calculateCyberRiskScore - A function that handles the risk score calculation.
 * - CyberRiskAssessmentInput - The input type for the calculateCyberRiskScore function.
 * - CyberRiskAssessmentOutput - The return type for the calculateCyberRiskScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CyberRiskAssessmentAnswers, CyberRiskResult } from '@/lib/types'; // Assuming types are defined here

const CyberRiskAssessmentInputSchema = z.object({
  answers: z.record(z.string()).describe('An object where keys are question IDs and values are the user\'s answers.'),
  // Example: { "q1_passwords": "yes", "q2_2fa": "no", "q3_updates": "yes", "q4_phishing": "yes", "q5_vpn": "sometimes", "q6_backup": "no" }
});
export type CyberRiskAssessmentInput = z.infer<typeof CyberRiskAssessmentInputSchema>;

const CyberRiskAssessmentOutputSchema = z.object({
  score: z.number().min(0).max(100).describe('The calculated cyber risk score, from 0 (lowest risk) to 100 (highest risk).'),
  level: z.enum(['Low', 'Medium', 'High', 'Very High']).describe('The qualitative risk level based on the score.'),
  recommendations: z.array(z.string()).describe('A list of personalized recommendations to reduce cyber risk.'),
  summaryMessage: z.string().describe('A brief summary message about the user\'s risk profile.'),
});
export type CyberRiskAssessmentOutput = z.infer<typeof CyberRiskAssessmentOutputSchema>;

export async function calculateCyberRiskScore(input: CyberRiskAssessmentInput): Promise<CyberRiskAssessmentOutput> {
  return calculateCyberRiskScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateCyberRiskScorePrompt',
  input: {schema: CyberRiskAssessmentInputSchema},
  output: {schema: CyberRiskAssessmentOutputSchema},
  prompt: `You are an AI assistant that calculates a cyber risk score based on a user's answers to a questionnaire and provides personalized security recommendations.

  The user has provided the following answers (question ID: answer):
  {{#each answers}}
  - {{#if @key}}{{@key}}{{else}}UnknownQuestion{{/if}}: {{{this}}}
  {{/each}}

  **Questionnaire Reference and Scoring Logic (Internal - do not repeat to user):**
  Assume questions cover topics like:
  - q1_passwords: Use of strong, unique passwords (yes = low risk, no = high risk)
  - q2_2fa: Use of Two-Factor Authentication (yes = low risk, no = high risk)
  - q3_updates: Regular software updates (yes = low risk, no = high risk)
  - q4_phishing: Caution with suspicious links/attachments (yes = low risk, no = high risk)
  - q5_vpn: Use of VPN on public Wi-Fi (yes = low risk, sometimes = medium, no = high risk)
  - q6_backup: Regular data backups (yes = low risk, no = high risk)

  **Scoring Guidelines:**
  - Base Score: Start at 0 (lowest risk).
  - For each "risky" answer (e.g., no to unique passwords, no to 2FA, no to updates, not cautious with phishing, no VPN, no backups), add points. A "no" typically adds 15-20 points. "Sometimes" for VPN might add 10 points.
  - A "yes" (good practice) adds 0 points or might slightly reduce the total if other factors are very good (not critical for prototype).
  - Ensure the final score is between 0 and 100.

  **Risk Level Mapping:**
  - 0-25: Low Risk
  - 26-50: Medium Risk
  - 51-75: High Risk
  - 76-100: Very High Risk

  **Recommendations:**
  - Provide 3-5 specific, actionable recommendations tailored to the user's "risky" answers.
  - If all answers are good, provide general reinforcement tips like "Keep up the great work! Regularly review your security settings."

  **Summary Message:**
  - A brief, encouraging, or cautionary message based on their overall risk level.

  **Example for q1_passwords = "no":**
  - Recommendation: "Start using a password manager to create and store strong, unique passwords for all your accounts."
  - Points added: ~18

  Based on the user's answers: {{answers}}, calculate their score, determine the level, and provide tailored recommendations and a summary message.
  Do not explain the internal scoring. Just provide the score, level, recommendations, and summary.
  `,
});

const calculateCyberRiskScoreFlow = ai.defineFlow(
  {
    name: 'calculateCyberRiskScoreFlow',
    inputSchema: CyberRiskAssessmentInputSchema,
    outputSchema: CyberRiskAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to calculate risk score.");
    }
    // Ensure score is within bounds, just in case AI deviates.
    output.score = Math.max(0, Math.min(100, output.score));
    return output;
  }
);
