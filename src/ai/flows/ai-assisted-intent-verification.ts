'use server';

/**
 * @fileOverview An AI-assisted intent verification flow.
 *
 * - aiAssistedIntentVerification - A function that uses AI to help verify intent submissions.
 * - AIAssistedIntentVerificationInput - The input type for the aiAssistedIntentVerification function.
 * - AIAssistedIntentVerificationOutput - The return type for the aiAssistedIntentVerification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAssistedIntentVerificationInputSchema = z.object({
  title: z.string().describe('The name of the action performed.'),
  description: z.string().describe('A detailed description of the action performed.'),
  category: z.string().optional().describe('The type of action performed (e.g., planting, cleaning).'),
  location: z.string().optional().describe('The location where the action was performed.'),
  proofs: z.array(z.object({ type: z.string(), url: z.string() })).optional().describe('Array of proofs of the action performed.'),
});
export type AIAssistedIntentVerificationInput = z.infer<typeof AIAssistedIntentVerificationInputSchema>;

const AIAssistedIntentVerificationOutputSchema = z.object({
  trustScore: z.number().describe('A trust score from 0 (no trust) to 100 (fully trustworthy).'),
  reasoning: z.string().describe('The reasoning behind the assigned trust score.'),
});
export type AIAssistedIntentVerificationOutput = z.infer<typeof AIAssistedIntentVerificationOutputSchema>;

export async function aiAssistedIntentVerification(input: AIAssistedIntentVerificationInput): Promise<AIAssistedIntentVerificationOutput> {
  return aiAssistedIntentVerificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistedIntentVerificationPrompt',
  input: {schema: AIAssistedIntentVerificationInputSchema},
  output: {schema: AIAssistedIntentVerificationOutputSchema},
  prompt: `
You are a verification agent for regenerative impact reports.

Analyze the following submission:
Title: "{{title}}"
Description: "{{description}}"
Category: "{{category}}"
Location: "{{location}}"
Proofs: {{#each proofs}}[{{this.type}}: {{this.url}}] {{/each}}

Evaluate the following:
1. Is the description specific and coherent?
2. Does it describe a real, tangible action (not just an intention)?
3. Does it include verifiable or measurable outcomes?
4. Are there any indications of fake, copied, or unrelated data?
5. Assign a trust score from 0 (no trust) to 100 (fully trustworthy).

Return a JSON object with your evaluation.
`,
});

const aiAssistedIntentVerificationFlow = ai.defineFlow(
  {
    name: 'aiAssistedIntentVerificationFlow',
    inputSchema: AIAssistedIntentVerificationInputSchema,
    outputSchema: AIAssistedIntentVerificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
