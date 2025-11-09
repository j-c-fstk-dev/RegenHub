'use server';

import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

// Helper to initialize Firebase Admin SDK only once
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getFirestore();
  }
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount: ServiceAccount = JSON.parse(
            Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
        );
        initializeApp({
            credential: cert(serviceAccount),
        });
        return getFirestore();
      } catch (e) {
          console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
          throw new Error("Server configuration error: Could not parse Firebase service account key.");
      }
  } 
  
  throw new Error('Server configuration error: FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
}

/**
 * Creates a new LEAP assessment document in Firestore for the current user's organization.
 */
export async function startLeapAssessment(): Promise<{ success: boolean; error?: string; assessmentId?: string }> {
  try {
    const db = initializeAdminApp();
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization) {
      return { success: false, error: "Unauthorized: No token provided." };
    }
  
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Find the user's organization. For now, we'll assume the user has one org.
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const orgId = userData?.orgs?.[0];

    if (!orgId) {
      return { success: false, error: "User is not associated with any organization." };
    }

    const assessmentRef = await db.collection('leapAssessments').add({
      orgId: orgId,
      stage: 'L',
      locale: 'en', // Default locale
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, assessmentId: assessmentRef.id };

  } catch (error) {
    console.error('Error starting LEAP assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    if (error instanceof Error && (error.message.includes('ID token has expired') || error.message.includes('could not be verified'))) {
        return { success: false, error: 'Your session has expired. Please log in again.'}
    }
    return { success: false, error: `Failed to start assessment: ${errorMessage}` };
  }
}

/**
 * Saves the data from the 'L - Locate' step of the LEAP assessment.
 * @param assessmentId The ID of the assessment document.
 * @param companyData The company data to save.
 */
export async function saveLeapL(
  assessmentId: string,
  companyData: { sector: string; size: string; sites: { value: string }[] }
): Promise<{ success: boolean; error?: string }> {
  if (!assessmentId) {
    return { success: false, error: "Assessment ID is required." };
  }

  try {
    const db = initializeAdminApp();
    const assessmentRef = db.collection('leapAssessments').doc(assessmentId);

    await assessmentRef.update({
      'company.sector': companyData.sector,
      'company.size': companyData.size,
      'company.sites': companyData.sites.map(s => s.value),
      stage: 'E', // Move to the next stage
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving LEAP stage L:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to save data: ${errorMessage}` };
  }
}

/**
 * Saves the data from the 'E - Evaluate' step of the LEAP assessment.
 * @param assessmentId The ID of the assessment document.
 * @param data The data to save.
 */
export async function saveLeapE(
  assessmentId: string,
  data: {
    inputs: {
      water: { source: string; volume: string };
      energy: { source: string; consumption: string };
    };
    impacts: {
      practices: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  if (!assessmentId) {
    return { success: false, error: "Assessment ID is required." };
  }

  try {
    const db = initializeAdminApp();
    const assessmentRef = db.collection('leapAssessments').doc(assessmentId);

    await assessmentRef.update({
      'inputs.water': data.inputs.water,
      'inputs.energy': data.inputs.energy,
      // For now, we put practices under a generic 'impacts' field. This can be refined.
      'impacts.generalPractices': data.impacts.practices,
      stage: 'A', // Move to the next stage
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving LEAP stage E:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to save data: ${errorMessage}` };
  }
}

/**
 * Saves the data from the 'A - Assess' step of the LEAP assessment.
 * @param assessmentId The ID of the assessment document.
 * @param data The risks and opportunities data to save.
 */
export async function saveLeapA(
  assessmentId: string,
  data: {
    risks: { theme: string; probability: number; severity: number; notes?: string }[];
    opportunities: { theme: string; rationale?: string; ease: number; payoff: number }[];
  }
): Promise<{ success: boolean; error?: string }> {
  if (!assessmentId) {
    return { success: false, error: "Assessment ID is required." };
  }

  try {
    const db = initializeAdminApp();
    const assessmentRef = db.collection('leapAssessments').doc(assessmentId);

    await assessmentRef.update({
      risks: data.risks,
      opportunities: data.opportunities,
      stage: 'P', // Move to the next stage
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving LEAP stage A:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to save data: ${errorMessage}` };
  }
}


/**
 * Saves the data from the 'P - Prepare' step of the LEAP assessment.
 * @param assessmentId The ID of the assessment document.
 * @param data The action plan data to save.
 */
export async function saveLeapP(
  assessmentId: string,
  data: {
    plan: { action: string; owner: string; deadline: string; cost?: number; kpi?: string }[];
  }
): Promise<{ success: boolean; error?: string }> {
  if (!assessmentId) {
    return { success: false, error: "Assessment ID is required." };
  }

  try {
    const db = initializeAdminApp();
    const assessmentRef = db.collection('leapAssessments').doc(assessmentId);

    await assessmentRef.update({
      plan: data.plan,
      stage: 'done', // Mark assessment as complete
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving LEAP stage P:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to save data: ${errorMessage}` };
  }
}
