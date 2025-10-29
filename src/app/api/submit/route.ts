import { NextResponse, type NextRequest } from 'next/server';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { aiAssistedIntentVerification } from '@/ai/flows/ai-assisted-intent-verification';

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount: ServiceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
        // This is for local development where the key might not be set,
        // it will fail gracefully in a deployed environment if the key is missing.
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Skipping Admin SDK initialization for local dev.");
    }
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  if (getApps().length === 0) {
      return NextResponse.json({ success: false, error: 'Firebase Admin not initialized. Check server logs.' }, { status: 500 });
  }

  // 1. Check for authentication
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

  try {
    // 2. Create the new Action document
    const actionRef = await db.collection('actions').add({
      intentId: intentId || null,
      projectId,
      orgId,
      title,
      description,
      category: category || null,
      location: location || null,
      mediaUrls: mediaUrls || [],
      status: 'submitted', // Start with "submitted" status
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      validatedAt: null,
      validatorId: null,
      validationComments: null,
      validationScore: null,
      certificateUrl: null,
    });

    // 3. Trigger the AI precheck/verification flow asynchronously (don't block the response)
    aiAssistedIntentVerification({
        actionId: actionRef.id,
        title,
        description,
        category,
        location,
        proofs: mediaUrls.map((url: string) => ({ type: 'link', url }))
    }).catch(aiError => {
        // Log the error, but don't fail the user request
        console.error(`AI verification failed for action ${actionRef.id}:`, aiError);
        // Optionally, update the action status to 'review_failed'
        actionRef.update({ status: 'review_failed', aiVerification: { reasoning: `AI process failed: ${aiError.message}` } });
    });


    // 4. Respond to the user immediately
    return NextResponse.json({ success: true, actionId: actionRef.id }, { status: 200 });

  } catch (error) {
    console.error('Error creating action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
