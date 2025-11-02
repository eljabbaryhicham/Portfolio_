// Implements the AI code suggestion functionality.
//
// - `suggestCode`: Accepts a description of desired functionality and returns suggested code.
// - `SuggestCodeInput`: Input type for `suggestCode`, a description of the desired code.
// - `SuggestCodeOutput`: Output type for `suggestCode`, containing the AI-suggested code.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeInputSchema = z.object({
  description: z.string().describe('A description of the desired HTML, CSS, or JavaScript code functionality.'),
});
export type SuggestCodeInput = z.infer<typeof SuggestCodeInputSchema>;

const SuggestCodeOutputSchema = z.object({
  code: z.string().describe('The AI-suggested HTML, CSS, or JavaScript code.'),
});
export type SuggestCodeOutput = z.infer<typeof SuggestCodeOutputSchema>;

export async function suggestCode(input: SuggestCodeInput): Promise<SuggestCodeOutput> {
  return suggestCodeFlow(input);
}

const suggestCodePrompt = ai.definePrompt({
  name: 'suggestCodePrompt',
  input: {schema: SuggestCodeInputSchema},
  output: {schema: SuggestCodeOutputSchema},
  prompt: `You are an AI code assistant that suggests code snippets based on user descriptions.

  The user will provide a description of the desired functionality, and you should generate the corresponding HTML, CSS, or JavaScript code.

  Description: {{{description}}}

  Code:`,
});

const suggestCodeFlow = ai.defineFlow(
  {
    name: 'suggestCodeFlow',
    inputSchema: SuggestCodeInputSchema,
    outputSchema: SuggestCodeOutputSchema,
  },
  async input => {
    const {output} = await suggestCodePrompt(input);
    return output!;
  }
);
