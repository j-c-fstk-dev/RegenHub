'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { initializeAdminApp } from '@/lib/firebase-admin';

// This file is being kept for potential future admin actions,
// but toggleActionVisibility has been moved to the client.

export async function updateUserWallet(
  userId: string, 
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  const firestore = initializeAdminApp();
  if (!userId || !walletAddress) {
    return { success: false, error: "User ID and wallet address are required." };
  }

  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      walletAddress: walletAddress
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating wallet address:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to update wallet: ${errorMessage}` };
  }
}
