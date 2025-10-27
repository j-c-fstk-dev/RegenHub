import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure Firebase is initialized only once
if (getApps().length === 0) {
  try {
    const serviceAccount: ServiceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

export async function GET(req: Request) {
  try {
    const actionsSnapshot = await db.collectionGroup('actions')
      .where('status', '==', 'verified')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const verifiedActions = actionsSnapshot.docs.map(doc => {
      const parentActorRef = doc.ref.parent.parent;
      return {
        id: doc.id,
        actorId: parentActorRef ? parentActorRef.id : null,
        ...doc.data()
      };
    });

    return NextResponse.json(verifiedActions, { status: 200 });

  } catch (error) {
    console.error('Error fetching verified actions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
