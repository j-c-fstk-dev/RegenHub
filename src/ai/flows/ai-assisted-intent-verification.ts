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

// Based on Document 3.2: IAOutput.ts
const SubScoreSchema = z.object({
  impactDepth: z.number().min(0).max(10).describe("Score for the depth and significance of the action's impact."),
  communityInvolvement: z.number().min(0).max(10).describe("Score for the level of community involvement and participation."),
  clarity: z.number().min(0).max(10).describe("Score for the clarity and completeness of the description and submission."),
  evidenceQuality: z.number().min(0).max(10).describe("Score for the quality, relevance, and diversity of the evidence provided."),
});

const FlagsSchema = z.object({
  missingLocation: z.boolean().default(false).describe("Flag if location is missing."),
  staleMedia: z.boolean().default(false).describe("Flag if media is older than one year."),
  duplicateMedia: z.boolean().default(false).describe("Flag if duplicate media URLs are found."),
  lowTextDensity: z.boolean().default(false).describe("Flag if the description is too short (under 140 characters)."),
});

export const AIAssistedIntentVerificationOutputSchema = z.object({
  summary: z.string().describe("A short, neutral summary of the action (<= 80 words)."),
  subscores: SubScoreSchema,
  weights: z.object({ 
    impactDepth: z.number(), 
    communityInvolvement: z.number(), 
    clarity: z.number(), 
    evidenceQuality: z.number() 
  }),
  finalScore: z.number().min(0).max(100).describe("The final weighted score."),
  flags: FlagsSchema,
  recommendation: z.enum(['approve','reject','needs_info']).describe("The AI's recommendation for the human validator."),
  notes: z.string().optional().describe("AI's reasoning for score adjustments or flags."),
});
export type AIAssistedIntentVerificationOutput = z.infer<typeof AIAssistedIntentVerificationOutputSchema>;


// Based on Document 3.1: IAInput.ts
const EvidenceSchema = z.object({
  type: z.enum(['image','pdf','video','link']),
  url: z.string().url(),
});

export const AIAssistedIntentVerificationInputSchema = z.object({
  actionId: z.string(),
  project: z.object({ title: z.string(), location: z.string().optional() }),
  category: z.string(),
  description: z.string(),
  evidences: z.array(EvidenceSchema),
  submitter: z.object({
    twitterHandle: z.string().optional().describe("The submitter's X/Twitter handle, if available.")
  }).optional(),
  locale: z.enum(['pt-BR','en']).default('pt-BR')
});
export type AIAssistedIntentVerificationInput = z.infer<typeof AIAssistedIntentVerificationInputSchema>;


/**
 * Runs a deterministic precheck on the input data to generate flags.
 * Based on Document 5.
 */
const runPrecheck = (input: AIAssistedIntentVerificationInput) => {
  const flags = { missingLocation: false, staleMedia: false, duplicateMedia: false, lowTextDensity: false };

  // Location check
  if (!input.project.location && !/\b[A-Za-zÀ-ÿ]+\b/.test(input.description)) {
      flags.missingLocation = true;
  }

  // Text density check
  if ((input.description ?? '').trim().length < 140) {
      flags.lowTextDensity = true;
  }

  // Simplified duplicate media check by URL
  const urls = new Set<string>();
  let dup = false;
  for (const ev of input.evidences) {
    if (urls.has(ev.url)) {
      dup = true;
      break;
    }
    urls.add(ev.url);
  }
  if (dup) flags.duplicateMedia = true;
  
  // Stale media check is omitted as we don't have media timestamps in this MVP.

  return flags;
};


const SYSTEM_PROMPT = `You are the Regenerative Impact Validation Assistant working inside the Regen Hub platform.
Your tasks:
1) Adjust the four subscores in a conservative range (±2 points) based on the evidence and description. If the submitter has a verified X/Twitter handle, consider this a positive trust signal and slightly increase clarity and evidenceQuality scores (+0.5).
2) Produce a short, neutral summary (<= 80 words).
3) Set flags only if directly supported by the evidence.
4) Recommend one of: approve | reject | needs_info.
Strict rules:
- Output MUST be valid JSON matching the IAOutputSchema (no markdown, no extra text).
- Never invent data; rely only on input fields and extracted metadata.
- Keep the finalScore consistent with subscores and weights.
- If a twitterHandle is present, mention it in the notes as a positive trust indicator.`;

const buildUserPrompt = (input: AIAssistedIntentVerificationInput, heuristics: Partial<AIAssistedIntentVerificationOutput> ) => `
INPUT:
${JSON.stringify(input)}

HEURISTICS (draft you may adjust ±2):
${JSON.stringify({
  subscores: heuristics.subscores,
  weights: heuristics.weights,
  flags: heuristics.flags
})}

Return only a JSON object matching IAOutputSchema.`;


export async function aiAssistedIntentVerification(input: AIAssistedIntentVerificationInput): Promise<AIAssistedIntentVerificationOutput> {
  return aiAssistedIntentVerificationFlow(input);
}

const aiAssistedIntentVerificationFlow = ai.defineFlow(
  {
    name: 'aiAssistedIntentVerificationFlow',
    inputSchema: AIAssistedIntentVerificationInputSchema,
    outputSchema: AIAssistedIntentVerificationOutputSchema,
  },
  async input => {
    const flags = runPrecheck(input);

    // Heuristics: start with a baseline and adjust with rules
    let subscores = { impactDepth: 5, communityInvolvement: 5, clarity: 5, evidenceQuality: 5 };
    if (flags.lowTextDensity) subscores.clarity -= 1;
    if (flags.missingLocation) subscores.evidenceQuality -= 1;
    if(input.evidences.length === 0) subscores.evidenceQuality -= 2;

    // New trust signal from X/Twitter handle
    if (input.submitter?.twitterHandle) {
      subscores.clarity += 0.5;
      subscores.evidenceQuality += 0.5;
    }

    const weights = { impactDepth: 0.30, communityInvolvement: 0.25, clarity: 0.20, evidenceQuality: 0.25 };
    
    const heuristics = { subscores, weights, flags };

    const promptText = buildUserPrompt(input, heuristics);

    const prompt = ai.definePrompt({
      name: 'aiAssistedIntentVerificationPrompt',
      prompt: promptText,
      input: { schema: z.any() },
      output: { schema: AIAssistedIntentVerificationOutputSchema },
      config: {
        model: 'googleai/gemini-2.5-flash', // Use a model known for good JSON output
        custom: { system: SYSTEM_PROMPT }
      }
    });

    const {output} = await prompt({});
    
    if (!output) {
      throw new Error("AI model did not return a valid output.");
    }
    
    // Ensure final score is consistent
    const calculatedScore = 10 * (
        output.subscores.impactDepth * output.weights.impactDepth +
        output.subscores.communityInvolvement * output.weights.communityInvolvement +
        output.subscores.clarity * output.weights.clarity +
        output.subscores.evidenceQuality * output.weights.evidenceQuality
    );
    output.finalScore = Math.round(calculatedScore);


    return output;
  }
);
