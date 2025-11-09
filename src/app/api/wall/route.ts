import { NextResponse, NextRequest } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Query } from 'firebase-admin/firestore';

// Helper to initialize Firebase Admin SDK only once
function initializeAdminApp() {
    if (getApps().length > 0) {
        return getFirestore();
    }
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount: ServiceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        );
        initializeApp({
          credential: cert(serviceAccount),
        });
        return getFirestore();
    } 
    
    // Return null if initialization is not possible
    return null;
}

export async function GET(req: NextRequest) {
  try {
    const db = initializeAdminApp();
    if (!db) {
        console.error('API Error: Firebase Admin SDK not initialized. Service account key might be missing.');
        return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }
    
    let actionsQuery: Query = db.collection('actions')
                                .where('status', '==', 'verified')
                                .where('isPublic', '==', true) // Filter for public actions
                                .orderBy('createdAt', 'desc')
                                .limit(50);

    const actionsSnapshot = await actionsQuery.get();

    // Fetch all unique organization IDs from the actions
    const orgIds = [...new Set(actionsSnapshot.docs.map(doc => doc.data().orgId).filter(Boolean))];
    
    const orgsData: { [key: string]: { name: string; slug: string; image?: string; } } = {};

    if (orgIds.length > 0) {
        // Firestore 'in' query is limited to 30 items. Batch if necessary.
        const batches: string[][] = [];
        for (let i = 0; i < orgIds.length; i += 30) {
          batches.push(orgIds.slice(i, i + 30));
        }

        for (const batch of batches) {
          if (batch.length > 0) {
            const orgsRef = db.collection('organizations');
            const orgsQuery = orgsRef.where('__name__', 'in', batch);
            const orgsSnapshot = await orgsQuery.get();
            orgsSnapshot.forEach(doc => {
                orgsData[doc.id] = {
                    name: doc.data().name || 'Unknown Organization',
                    slug: doc.data().slug || '#',
                    image: doc.data().image || undefined,
                };
            });
          }
        }
    }

    const actions = actionsSnapshot.docs.map(doc => {
      const actionData = doc.data();
      return {
        id: doc.id,
        ...actionData,
        org: orgsData[actionData.orgId] || { name: 'Unknown Organization', slug: '#', image: undefined }
      };
    });

    return NextResponse.json(actions, { status: 200 });

  } catch (error) {
    console.error('Error fetching actions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
