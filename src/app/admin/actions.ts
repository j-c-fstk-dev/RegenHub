'use server';

import { doc, updateDoc, serverTimestamp, DocumentReference, Firestore } from 'firebase/firestore';

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

/**
 * Updates the wallet address for a user.
 * This is a server action that can be called from the client.
 * This function uses a client-side Firestore instance passed from the component.
 * @param db The client-side Firestore instance.
 * @param userId The UID of the user to update.
 * @param walletAddress The new wallet address.
 */
export async function updateUserWallet(
  db: Firestore,
  userId: string, 
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !walletAddress) {
    return { success: false, error: "User ID and wallet address are required." };
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      walletAddress: walletAddress
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating wallet address:", error);
    // In a real app, you might want to use a more sophisticated error handler.
    // For now, we'll return a generic error message.
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to update wallet: ${errorMessage}` };
  }
}
