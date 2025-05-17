
'use server';
/**
 * @fileOverview Translates text from a source language to a target language.
 *
 * - translateText - A function that handles the text translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "English", "Hindi").'),
  sourceLanguage: z.string().optional().describe('The source language of the text (e.g., "Spanish", "French"). If not provided, the AI will attempt to auto-detect.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
  detectedSourceLanguage: z.string().optional().describe('The source language detected by the AI, if not provided in input.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text into {{targetLanguage}}.
{{#if sourceLanguage}}The source language is {{sourceLanguage}}.{{else}}Attempt to auto-detect the source language.{{/if}}

Text to translate:
"{{textToTranslate}}"

Respond with the translated text and the detected source language if it was auto-detected.
If source language was provided, you can omit detectedSourceLanguage or re-state the provided one.
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("Translation failed, AI did not return an output.");
    }
    // Ensure translatedText is always a string, even if AI returns empty or unexpected.
    // This helps prevent downstream errors if the AI fails to translate properly.
    const translatedText = output.translatedText || input.textToTranslate; // Fallback to original if translation is empty
    const detectedSourceLanguage = output.detectedSourceLanguage || input.sourceLanguage;

    return {
        translatedText,
        detectedSourceLanguage
    };
  }
);
