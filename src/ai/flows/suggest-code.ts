import { defineFlow } from 'genkit';
import { ai } from '../genkit';
import { z } from 'zod';

export const suggestCodeFlow = defineFlow(
  {
    name: 'suggestCodeFlow',
    inputSchema: z.object({
      prompt: z.string(),
      language: z.enum(['html', 'css', 'javascript']),
      html: z.string(),
      css: z.string(),
      javascript: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { prompt, language, html, css, javascript } = input;

    const systemPrompt = `You are an expert web developer. Your task is to provide code suggestions based on the user's request.
- You will be given the current HTML, CSS, and JavaScript code.
- You will also be given a user prompt describing the desired change or addition.
- You must determine the best way to implement the user's request.
- You must ONLY return the raw code for the specified language (${language}).
- Do NOT include any explanations, comments, or markdown formatting like \`\`\`${language} or \`\`\`.
- If the request is to modify existing code, you should provide the new, complete version of the modified code block or selector.
- If the request is to add new code, provide only the new code to be added.`;

    const fullPrompt = `User Request: "${prompt}"

Current HTML:
\`\`\`html
${html || '(empty)'}
\`\`\`

Current CSS:
\`\`\`css
${css || '(empty)'}
\`\`\`

Current JavaScript:
\`\`\`javascript
${javascript || '(empty)'}
\`\`\`

Based on the user request and the current code, provide the code suggestion for the ${language.toUpperCase()} language. Remember, ONLY return the raw code.`;

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: fullPrompt,
      config: {
        // Temperature of 0.2 makes the model more focused and deterministic
        temperature: 0.2,
      },
      system: systemPrompt,
    });

    return llmResponse.text();
  }
);
