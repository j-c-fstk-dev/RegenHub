'use server';

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Initializes the Firebase Admin SDK.
 * @returns The Firestore database instance.
 * @throws If the service account key is not found.
 */
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // This will be caught by the action handler and result in a user-friendly error.
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not found. Server is not configured for admin operations.');
  }

  const serviceAccount: ServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
  });

  return getFirestore();
}

/**
 * Approves an action and assigns an impact score.
 * This is a Server Action that uses the Firebase Admin SDK to perform a privileged update.
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
    const actionRef = db.collection('actions').doc(actionId);

    await actionRef.update({
      status: 'verified',
      validationScore: impactScore,
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
 * Updates the wallet address for a user.
 * This is a server action that can be called from the client.
 * NOTE: This action uses the ADMIN SDK. For it to work, the service account
 * credentials must be available in the environment.
 * @param userId The UID of the user to update.
 * @param walletAddress The new wallet address.
 */
export async function updateUserWallet(
  userId: string, 
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !walletAddress) {
    return { success: false, error: "User ID and wallet address are required." };
  }

  try {
    const db = initializeAdminApp();
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      walletAddress: walletAddress
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating wallet address:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to update wallet: ${errorMessage}` };
  }
}
