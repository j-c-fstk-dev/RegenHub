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
