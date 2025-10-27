
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { revalidatePath } from 'next/cache';
import { keccak256 } from 'ethers';

// Ensure Firebase is initialized only once
try {
  if (getApps().length === 0) {
    const serviceAccount: ServiceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );

    initializeApp({
      credential: cert(serviceAccount),
    });
  }
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
}

const db = getFirestore();

/**
 * Marks an action as "verified" in Firestore and generates its certificate.
 * This is a server action callable from the admin dashboard.
 * @param actorId The ID of the actor who submitted the action.
 * @param actionId The ID of the action to approve.
 * @param impactScore The human-assigned score for the action's impact.
 */
export async function approveAction(actorId: string, actionId: string, impactScore: number) {
  if (!actorId || !actionId) {
    return { success: false, error: 'Missing actorId or actionId' };
  }
  if (impactScore === undefined || impactScore < 0 || impactScore > 100) {
    return { success: false, error: 'Invalid Impact Score. Must be between 0 and 100.' };
  }


  const actionRef = db.collection('actors').doc(actorId).collection('actions').doc(actionId);

  try {
     if (getApps().length === 0) {
      return { success: false, error: 'Firebase Admin not initialized.' };
    }
    const actionDoc = await actionRef.get();
    if (!actionDoc.exists) {
      return { success: false, error: 'Action not found.' };
    }
    const actionData = actionDoc.data()!;

    // 1. Calculate RegenScore
    const trustScore = actionData.aiVerification?.trustScore ?? 0;
    const regenScore = Math.round((trustScore * 0.6) + (impactScore * 0.4));

    // 2. Update action status and scores
    await actionRef.update({
      status: 'verified',
      'humanVerification.impactScore': impactScore,
      'humanVerification.regenScore': regenScore,
      updatedAt: new Date(),
    });

    // 3. Generate and store the certificate
    const certificateData = {
      version: '1.0',
      actorId: actorId,
      actionId: actionId,
      title: actionData.title,
      description: actionData.description,
      category: actionData.category,
      timestamp: new Date().toISOString(),
      scores: {
        trustScore,
        impactScore,
        regenScore,
      },
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
