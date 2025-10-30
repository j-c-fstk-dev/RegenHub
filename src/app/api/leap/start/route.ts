
import { NextResponse, NextRequest } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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


export async function POST(req: NextRequest) {
  const db = initializeAdminApp();
  const authorization = req.headers.get('Authorization');
  
  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized: No token provided." }, { status: 401 });
  }

  try {
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const orgId = userData?.orgs?.[0];

    if (!orgId) {
      return NextResponse.json({ success: false, error: "Usuário não está associado a nenhuma organização." }, { status: 400 });
    }

    const assessmentRef = await db.collection('leapAssessments').add({
      orgId: orgId,
      stage: 'L',
      locale: 'pt-BR', // Default locale
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, assessmentId: assessmentRef.id }, { status: 200 });

  } catch (error) {
    console.error('Error starting LEAP assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    if (error instanceof Error && (error.message.includes('ID token has expired') || error.message.includes('could not be verified'))) {
        return NextResponse.json({ success: false, error: 'Sua sessão expirou. Por favor, faça login novamente.'}, { status: 401 });
    }
    return NextResponse.json({ success: false, error: `Failed to start assessment: ${errorMessage}` }, { status: 500 });
  }
}
