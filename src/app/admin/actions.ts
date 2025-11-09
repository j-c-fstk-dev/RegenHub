'use server';

import { Firestore, doc, updateDoc } from 'firebase/firestore';

export async function updateUserWallet(
  firestore: Firestore, 
  userId: string, 
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !walletAddress) {
    return { success: false, error: "User ID and wallet address are required." };
  }
  if (!firestore) {
    return { success: false, error: "Firestore instance is not available." };
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
