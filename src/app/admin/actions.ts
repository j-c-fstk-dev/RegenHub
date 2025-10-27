'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { revalidatePath } from 'next/cache';
import { keccak256 } from 'ethers';

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
 * Marks an action as "verified" in Firestore and generates its certificate.
 * This is a server action callable from the admin dashboard.
 * @param actorId The ID of the actor who submitted the action.
 * @param actionId The ID of the action to approve.
 */
export async function approveAction(actorId: string, actionId: string) {
  if (!actorId || !actionId) {
    return { success: false, error: 'Missing actorId or actionId' };
  }

  const actionRef = db.collection('actors').doc(actorId).collection('actions').doc(actionId);

  try {
    const actionDoc = await actionRef.get();
    if (!actionDoc.exists) {
      return { success: false, error: 'Action not found.' };
    }
    const actionData = actionDoc.data()!;

    // 1. Update action status to verified
    await actionRef.update({
      status: 'verified',
      updatedAt: new Date(),
    });

    // 2. Generate and store the certificate (ETAPA 3.1)
    const certificateData = {
      version: '1.0',
      actorId: actorId,
      actionId: actionId,
      title: actionData.title,
      description: actionData.description,
      category: actionData.category,
      timestamp: new Date().toISOString(),
    };
    
    const certificateJson = JSON.stringify(certificateData);
    const hash = keccak256(Buffer.from(certificateJson));

    const certificateRef = actionRef.collection('certificate').doc('current');
    await certificateRef.set({
      hash,
      anchoredAt: new Date(),
    });

    // Revalidate the impact wall path to show the new action immediately
    revalidatePath('/impact');
    
    return { success: true, certificateHash: hash };
  } catch (error) {
    console.error('Error approving action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
