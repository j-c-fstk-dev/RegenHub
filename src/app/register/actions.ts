'use server';

import {
  aiAssistedIntentVerification,
  AIAssistedIntentVerificationInput,
  AIAssistedIntentVerificationOutput,
} from '@/ai/flows/ai-assisted-intent-verification';
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Invokes the AI-assisted verification flow on the server.
 * This is a dedicated Server Action to be called from the client after an intent is created.
 * @param input The data for the AI to process.
 * @param intentId The ID of the Firestore document to update with the verification result.
 */
export async function runAiVerification(
  input: AIAssistedIntentVerificationInput,
  intentId: string
): Promise<{ success: boolean; result?: AIAssistedIntentVerificationOutput; error?: string }> {
  try {
    const verificationResult = await aiAssistedIntentVerification(input);
    console.log('AI Verification Result:', verificationResult);

    // Update the document in Firestore with the AI result.
    // Server-side initialization is safe here within a Server Action.
    const { firestore } = initializeFirebase();
    const intentRef = doc(firestore, 'regenerative_intents', intentId);
    await updateDoc(intentRef, { aiVerification: verificationResult });

    return { success: true, result: verificationResult };
  } catch (error) {
    console.error('Error during AI verification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `AI Verification Failed: ${errorMessage}` };
  }
}
