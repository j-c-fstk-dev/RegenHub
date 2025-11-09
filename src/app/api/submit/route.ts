'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { aiAssistedIntentVerification } from '@/ai/flows/ai-assisted-intent-verification';
import type { AIAssistedIntentVerificationInput } from '@/ai/schemas/ai-assisted-intent-verification';

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
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Skipping Admin SDK initialization. API will fail if called.");
    }
  }
  return getFirestore();
}

async function triggerAiVerification(actionId: string, aiInput: AIAssistedIntentVerificationInput) {
    try {
        const aiResult = await aiAssistedIntentVerification(aiInput);
        const firestore = getFirestore();
        const docToUpdate = firestore.collection('actions').doc(actionId);
        await docToUpdate.update({ 
            aiVerification: aiResult,
            status: 'review_ready' 
        });
        console.log(`AI verification for action ${actionId} succeeded and document updated.`);
    } catch (aiError: any) {
        console.error(`AI verification or Firestore update failed for action ${actionId}:`, aiError);
        try {
            const firestore = getFirestore();
            const docToUpdate = firestore.collection('actions').doc(actionId);
            await docToUpdate.update({ 
                status: 'review_failed', 
                aiVerification: { 
                    summary: `AI process failed: ${aiError.message}`,
                    notes: aiError.stack,
                    flags: { lowTextDensity: true }
                }
            });
        } catch (updateError) {
            console.error(`CRITICAL: FAILED to update action ${actionId} with AI failure status:`, updateError);
        }
    }
}


export async function POST(req: NextRequest) {
  const db = initializeAdminApp();
  if (getApps().length === 0) {
      return NextResponse.json({ success: false, error: 'Firebase Admin not initialized. Check server logs.' }, { status: 500 });
  }

  let actionRefId: string | null = null;

  try {
    const authToken = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(authToken);
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const {
      intentId,
      projectId,
      orgId,
      description,
      title,
      category,
      location,
      mediaUrls,
    } = await req.json();

    if (!title || !description || !orgId || !projectId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const userDoc = await db.collection('users').doc(userId).get();
    const twitterHandle = userDoc.exists ? userDoc.data()?.twitterHandle : undefined;

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
        return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }
    const projectData = projectDoc.data();

    const actionRef = await db.collection('actions').add({
      intentId: intentId || null,
      projectId,
      orgId,
      title,
      description,
      category: category || null,
      location: location || null,
      mediaUrls: mediaUrls || [],
      status: 'submitted',
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      validatedAt: null,
      validatorId: null,
      validationComments: null,
      validationScore: null,
      certificateUrl: null,
    });
    
    actionRefId = actionRef.id;

    const aiInput: AIAssistedIntentVerificationInput = {
      actionId: actionRef.id,
      project: { 
        title: projectData?.title || 'Untitled Project', 
        location: projectData?.location || location || "" 
      },
      category: category || "Other",
      description,
      evidences: (mediaUrls || []).map((url: string) => ({ type: 'link', url })),
      submitter: {
        twitterHandle,
      },
      locale: 'pt-BR',
    };

    // Trigger AI verification without awaiting it. Fire-and-forget.
    triggerAiVerification(actionRef.id, aiInput);

    // Respond immediately to the user.
    return NextResponse.json({ success: true, actionId: actionRef.id }, { status: 200 });

  } catch (error) {
    console.error(`Error creating action (ID: ${actionRefId ?? 'N/A'}):`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
