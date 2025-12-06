'use server';

/**
 * @fileOverview An AI-assisted intent verification flow.
 *
 * - aiAssistedIntentVerification - A function that uses AI to help verify intent submissions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
    AIAssistedIntentVerificationInputSchema, 
    AIAssistedIntentVerificationOutputSchema,
    type AIAssistedIntentVerificationInput,
    type AIAssistedIntentVerificationOutput
} from '@/ai/schemas/ai-assisted-intent-verification';


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


const SYSTEM_PROMPT = `You are the Regenerative Impact Validation Assistant working inside the RegenImpactHub platform.
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
