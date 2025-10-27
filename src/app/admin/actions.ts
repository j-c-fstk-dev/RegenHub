'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { revalidatePath } from 'next/cache';

// Ensure Firebase is initialized only once
if (getApps().length === 0) {
  const serviceAccount: ServiceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

/**
 * Marks an action as "verified" in Firestore.
 * This is a server action callable from the admin dashboard.
 * @param actorId The ID of the actor who submitted the action.
 * @param actionId The ID of the action to approve.
 */
export async function approveAction(actorId: string, actionId: string) {
  if (!actorId || !actionId) {
    return { success: false, error: 'Missing actorId or actionId' };
  }

  try {
    const actionRef = db.collection('actors').doc(actorId).collection('actions').doc(actionId);
    
    await actionRef.update({
      status: 'verified',
      updatedAt: new Date(),
    });

    // Revalidate the impact wall path to show the new action immediately
    revalidatePath('/impact');
    
    return { success: true };
  } catch (error) {
    console.error('Error approving action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
