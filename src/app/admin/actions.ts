'use server';

import { getFirestore, doc, updateDoc, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';

// Helper to initialize Firebase Admin SDK only once
function initializeAdminApp() {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
       const serviceAccount: ServiceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin actions will fail.");
    }
  }
  return getFirestore();
}


/**
 * Approves an action and assigns an impact score.
 * This is a Server Action called from the Admin Panel.
 * @param actionId The ID of the action document to approve.
 * @param impactScore The manual score (0-100) assigned by the human validator.
 * @param validatorId The UID of the admin/validator performing the action.
 */
export async function approveAction(
  actionId: string,
  impactScore: number,
  validatorId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!actionId || impactScore === undefined || !validatorId) {
    return { success: false, error: 'Action ID, impact score, and validator ID are required.' };
  }
  if (impactScore < 0 || impactScore > 100) {
    return { success: false, error: 'Impact score must be between 0 and 100.' };
  }

  try {
    const db = initializeAdminApp();
    const actionRef = doc(db, 'actions', actionId);

    await updateDoc(actionRef, {
      status: 'verified',
      validationScore: impactScore, // Storing the human-assigned score
      validatorId: validatorId,
      validatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to approve action: ${errorMessage}` };
  }
}


/**
 * Updates the wallet address for a user's profile.
 * @param userId The ID of the user document.
 * @param walletAddress The new wallet address to save.
 */
export async function updateUserWallet(
  userId: string,
  walletAddress: string,
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !walletAddress) {
    return { success: false, error: 'User ID and wallet address are required.' };
  }

  try {
    const db = initializeAdminApp();
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      walletAddress: walletAddress,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to update wallet: ${errorMessage}` };
  }
}
