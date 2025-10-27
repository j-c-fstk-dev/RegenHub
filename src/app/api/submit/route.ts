import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

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

    // Transaction to ensure atomicity
    const { actorRef, actionRef } = await db.runTransaction(async (transaction) => {
      const actorsRef = db.collection('actors');
      const actorQuery = actorsRef.where('regenId', '==', regenId).limit(1);
      const actorSnap = await transaction.get(actorQuery);

      let actorRef;

      if (actorSnap.empty) {
        actorRef = db.collection('actors').doc();
        transaction.set(actorRef, {
          displayName,
          regenId,
          createdAt: new Date(),
        });
      } else {
        actorRef = actorSnap.docs[0].ref;
      }

      const actionRef = actorRef.collection('actions').doc();
      transaction.set(actionRef, {
        title,
        description,
        category,
        location,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (Array.isArray(proofs)) {
        proofs.forEach((p: any) => {
          if(p.url) {
            const proofRef = actionRef.collection('proofs').doc();
            transaction.set(proofRef, {
              type: p.type || 'link',
              url: p.url,
              hash: crypto.createHash('sha256').update(p.url).digest('hex'),
              createdAt: new Date(),
            });
          }
        });
      }
      
      return { actorRef, actionRef };
    });

    return NextResponse.json({ success: true, actorId: actorRef.id, actionId: actionRef.id }, { status: 200 });

  } catch (error) {
    console.error('Error in submitAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
