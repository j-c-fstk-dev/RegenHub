'use server';

import { doc, updateDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';

/**
 * Approves an action and assigns an impact score.
 * This is now called from the client-side but remains a Server Action for potential future server-only logic.
 * It now accepts a DocumentReference from the client-side Firestore instance.
 * @param actionRef A client-side DocumentReference to the action document.
 * @param impactScore The manual score (0-100) assigned by the human validator.
 * @param validatorId The UID of the admin/validator performing the action.
 */
export async function approveAction(
  actionRef: DocumentReference,
  impactScore: number,
  validatorId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!actionRef || impactScore === undefined || !validatorId) {
    return { success: false, error: 'Action reference, impact score, and validator ID are required.' };
  }
  if (impactScore < 0 || impactScore > 100) {
    return { success: false, error: 'Impact score must be between 0 and 100.' };
  }

  try {
    // The actionRef is now a live, client-side reference,
    // and this updateDoc call will be executed on the client,
    // respecting the security rules for the authenticated admin user.
    await updateDoc(actionRef, {
      status: 'verified',
      validationScore: impactScore,
      validatorId: validatorId,
      validatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to approve action: ${errorMessage}` };
  }
}
