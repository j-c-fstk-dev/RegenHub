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
  actionName: z.string().describe('The name of the action performed.'),
  actionType: z.string().describe('The type of action performed (e.g., planting, cleaning).'),
  actionDescription: z.string().describe('A detailed description of the action performed.'),
  location: z.string().describe('The location where the action was performed.'),
  numberOfParticipants: z.number().describe('The number of participants involved in the action.'),
  photos: z.array(z.string()).describe('Array of photo URLs as data URIs of the action performed.'),
  socialMediaLinks: z.array(z.string()).describe('Array of social media links related to the action.'),
});
export type AIAssistedIntentVerificationInput = z.infer<typeof AIAssistedIntentVerificationInputSchema>;

const AIAssistedIntentVerificationOutputSchema = z.object({
  isPotentiallyFalse: z.boolean().describe('Whether the intent submission is potentially false or low quality.'),
  reason: z.string().describe('The reason why the intent submission is potentially false or low quality.'),
  confidenceScore: z.number().describe('A score indicating the confidence level of the AI in its assessment.'),
});
export type AIAssistedIntentVerificationOutput = z.infer<typeof AIAssistedIntentVerificationOutputSchema>;

export async function aiAssistedIntentVerification(input: AIAssistedIntentVerificationInput): Promise<AIAssistedIntentVerificationOutput> {
  return aiAssistedIntentVerificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistedIntentVerificationPrompt',
  input: {schema: AIAssistedIntentVerificationInputSchema},
  output: {schema: AIAssistedIntentVerificationOutputSchema},
  prompt: `You are an AI assistant designed to help verify the validity and quality of intent submissions for regenerative actions. 

  Analyze the following information provided about the intent submission:

  Action Name: {{{actionName}}}
  Action Type: {{{actionType}}}
  Action Description: {{{actionDescription}}}
  Location: {{{location}}}
  Number of Participants: {{{numberOfParticipants}}}
  Photos: {{#each photos}}{{media url=this}}{{/each}}
  Social Media Links: {{#each socialMediaLinks}}{{{this}}}, {{/each}}

  Based on this information, determine if the intent submission is potentially false or of low quality. Consider factors such as the coherence of the description, the reasonableness of the number of participants, the presence and relevance of photos and social media links, and any other red flags that might indicate the submission is not genuine. Photos are passed in as data URIs.

  Respond with a JSON object that includes the following fields:

  - isPotentiallyFalse: A boolean value indicating whether the intent submission is potentially false or low quality. Set to true if there are reasons to suspect the submission, and false otherwise.
  - reason: A string explaining the reason why the intent submission is potentially false or low quality. Provide a detailed explanation of the red flags or inconsistencies that led to this conclusion. If isPotentiallyFalse is false, this field should explain what makes the submission trustworthy.
  - confidenceScore: A number between 0 and 1 indicating the confidence level of the AI in its assessment. A higher score indicates greater confidence.
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
