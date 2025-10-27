import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { aiAssistedIntentVerification } from '@/ai/flows/ai-assisted-intent-verification';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, displayName, title, description, category, location, proofs } = body;

    if (!email || !title || !displayName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const regenPepper = process.env.REGEN_PEPPER;
    if (!regenPepper) {
      throw new Error('REGEN_PEPPER environment variable is not set.');
    }

    const regenId = crypto.createHash('sha256')
      .update(email.trim().toLowerCase() + regenPepper)
      .digest('hex')
      .slice(0, 12);

    let actorRef: FirebaseFirestore.DocumentReference;
    
    // Check if actor exists or create a new one
    const actorsRef = db.collection('actors');
    const actorQuery = actorsRef.where('regenId', '==', regenId).limit(1);
    const actorSnap = await actorQuery.get();

    if (actorSnap.empty) {
        actorRef = db.collection('actors').doc();
        await actorRef.set({
          displayName,
          regenId,
          createdAt: new Date(),
        });
      } else {
        actorRef = actorSnap.docs[0].ref;
    }
    
    // Create the action document first with 'pending' status
    const actionRef = actorRef.collection('actions').doc();
    await actionRef.set({
        title,
        description,
        category,
        location,
        status: 'pending', // Start as pending
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Add proofs if they exist
    if (Array.isArray(proofs)) {
        const batch = db.batch();
        proofs.forEach((p: any) => {
          if(p.url) {
            const proofRef = actionRef.collection('proofs').doc();
            batch.set(proofRef, {
              type: p.type || 'link',
              url: p.url,
              hash: crypto.createHash('sha256').update(p.url).digest('hex'),
              createdAt: new Date(),
            });
          }
        });
        await batch.commit();
    }

    // Run AI verification asynchronously (don't block the response to the user)
    aiAssistedIntentVerification({ title, description, category, location, proofs })
        .then(async (aiResult) => {
            await actionRef.update({
                aiVerification: aiResult,
                status: 'review_ready', // Update status for human review
                updatedAt: new Date(),
            });
            console.log(`AI verification complete for action ${actionRef.id}`);
        })
        .catch(aiError => {
            console.error(`AI verification failed for action ${actionRef.id}:`, aiError);
            // Optionally, update the document with an error status
            actionRef.update({ 
                status: 'review_failed',
                aiError: aiError instanceof Error ? aiError.message : 'Unknown AI error'
            }).catch(dbError => console.error('Failed to write AI error to DB:', dbError));
        });

    return NextResponse.json({ success: true, actorId: actorRef.id, actionId: actionRef.id }, { status: 200 });

  } catch (error) {
    console.error('Error in submitAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
