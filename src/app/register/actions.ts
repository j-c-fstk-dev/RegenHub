"use server";

import { z } from "zod";
import { aiAssistedIntentVerification } from "@/ai/flows/ai-assisted-intent-verification";

// A simplified input schema for the action, as the full schema is on the client.
const ActionInputSchema = z.object({
  actionName: z.string(),
  actionType: z.string(),
  actionDescription: z.string(),
  location: z.string(),
  numberOfParticipants: z.number(),
  photos: z.array(z.string()),
  socialMediaLinks: z.array(z.string()),
});

type ActionInput = z.infer<typeof ActionInputSchema>;

export async function submitIntent(
  data: ActionInput
): Promise<{ success: boolean; error?: string; verification?: any }> {
  const validatedData = ActionInputSchema.safeParse(data);

  if (!validatedData.success) {
    return { success: false, error: "Invalid data provided." };
  }

  try {
    const verificationResult = await aiAssistedIntentVerification(validatedData.data);
    
    console.log("AI Verification Result:", verificationResult);
    
    // In a real application, you would now save the intent and the verification result to a database (e.g., Supabase).
    // The intent would be marked as 'pending' or automatically 'verified' based on the AI's confidence.
    // e.g., if (!verificationResult.isPotentiallyFalse && verificationResult.confidenceScore > 0.8) { ... }

    // For now, we just simulate a successful submission.
    return { success: true, verification: verificationResult };

  } catch (error) {
    console.error("Error during AI verification:", error);
    return { success: false, error: "An error occurred during the verification process." };
  }
}
