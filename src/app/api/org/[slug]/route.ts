import { NextResponse, NextRequest } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Query } from 'firebase-admin/firestore';

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
          // In a real scenario, you might want to throw an error here if the admin SDK is essential
      }
    }
    return getFirestore();
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json({ error: 'Organization slug is required.' }, { status: 400 });
  }

  try {
    const db = initializeAdminApp();
    
    // 1. Find the organization by slug
    const orgQuery = db.collection('organizations').where('slug', '==', slug).limit(1);
    const orgSnapshot = await orgQuery.get();

    if (orgSnapshot.empty) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    const orgDoc = orgSnapshot.docs[0];
    const organization = { id: orgDoc.id, ...orgDoc.data() };


    // 2. Find verified actions for that organization
    const actionsQuery = db.collection('actions')
                           .where('orgId', '==', organization.id)
                           .where('status', '==', 'verified')
                           .orderBy('createdAt', 'desc');

    const actionsSnapshot = await actionsQuery.get();
    const actions = actionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // 3. Return the combined data
    return NextResponse.json({ organization, actions }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching profile for slug ${slug}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
