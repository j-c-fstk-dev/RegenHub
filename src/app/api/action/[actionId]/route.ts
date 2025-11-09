import { NextResponse, NextRequest } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initializeAdminApp() {
    if (getApps().length > 0) {
        return { db: getFirestore(), initialized: true };
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount: ServiceAccount = JSON.parse(
              process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            );
            initializeApp({
              credential: cert(serviceAccount),
            });
            return { db: getFirestore(), initialized: true };
        } catch(e) {
            console.error("Firebase Admin SDK Initialization Error:", e);
            return { db: null, initialized: false };
        }
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin actions will fail.");
      return { db: null, initialized: false };
    }
}

export async function GET(req: NextRequest, { params }: { params: { actionId: string } }) {
  const { actionId } = params;
  
  if (!actionId) {
    return NextResponse.json({ error: 'Action ID is required.' }, { status: 400 });
  }

  const { db, initialized } = initializeAdminApp();
  
  if (!initialized || !db) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // 1. Find the action by its ID
    const actionRef = db.collection('actions').doc(actionId);
    const actionDoc = await actionRef.get();

    if (!actionDoc.exists) {
      return NextResponse.json({ error: 'Action not found.' }, { status: 404 });
    }
    
    const actionData = actionDoc.data();

    if (!actionData) {
        return NextResponse.json({ error: 'Action data is empty.' }, { status: 404 });
    }
    
    // 2. Find the associated organization
    const orgRef = db.collection('organizations').doc(actionData.orgId);
    const orgDoc = await orgRef.get();
    
    if (!orgDoc.exists) {
        // If the org doesn't exist, we can still return action data but log a warning
        console.warn(`Organization with ID ${actionData.orgId} not found for action ${actionId}`);
        return NextResponse.json({ ...actionData, id: actionDoc.id, org: { name: 'Unknown Organization', slug: '#' } }, { status: 200 });
    }

    const orgData = orgDoc.data();

    // 3. Combine and return the data
    const responseData = {
        ...actionData,
        id: actionDoc.id,
        org: {
            name: orgData?.name,
            slug: orgData?.slug,
        }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`Error fetching action ${actionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
