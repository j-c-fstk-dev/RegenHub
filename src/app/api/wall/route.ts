
import { NextResponse, NextRequest } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Query } from 'firebase-admin/firestore';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true';

  try {
    let actionsQuery: Query = db.collectionGroup('actions');

    // For the public wall, only show verified. For admin, show all.
    if (!showAll) {
      actionsQuery = actionsQuery.where('status', '==', 'verified');
    }
    
    actionsQuery = actionsQuery.orderBy('createdAt', 'desc').limit(100);

    const actionsSnapshot = await actionsQuery.get();

    const actions = actionsSnapshot.docs.map(doc => {
      const parentActorRef = doc.ref.parent.parent;
      return {
        id: doc.id,
        actorId: parentActorRef ? parentActorRef.id : null,
        ...doc.data()
      };
    });

    return NextResponse.json(actions, { status: 200 });

  } catch (error) {
    console.error('Error fetching actions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
