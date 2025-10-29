import { NextResponse, NextRequest } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Query } from 'firebase-admin/firestore';

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
          console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin actions will fail.");
      }
    }
    return getFirestore();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true';

  try {
    const db = initializeAdminApp();
    if (getApps().length === 0) {
        return NextResponse.json({ success: false, error: "Firebase Admin not initialized." }, { status: 500 });
    }
    
    let actionsQuery: Query = db.collection('actions');

    // For the public wall, only show verified. For admin, show all.
    if (!showAll) {
      actionsQuery = actionsQuery.where('status', '==', 'verified');
    }
    
    actionsQuery = actionsQuery.orderBy('createdAt', 'desc').limit(100);

    const actionsSnapshot = await actionsQuery.get();

    const actions = actionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(actions, { status: 200 });

  } catch (error) {
    console.error('Error fetching actions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
