'use server';

import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue, doc, updateDoc, collection, addDoc, getDoc, query, where, getDocs } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';

async function getAdminFirestore() {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        throw new Error('Server configuration error: FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
    }
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
         if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
            });
        }
    } catch(e) {
        console.error("Error parsing service account key in getAdminFirestore", e);
        throw new Error("Server configuration error: Could not parse Firebase service account key.");
    }
    return getFirestore();
}


/**
 * Creates a new LEAP assessment document in Firestore for the current user's organization.
 */
export async function startLeapAssessment(): Promise<{ success: boolean; error?: string; assessmentId?: string }> {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        throw new Error('Server configuration error: FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
    }

    let serviceAccount: ServiceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
        throw new Error("Server configuration error: Could not parse Firebase service account key.");
    }
    
    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    }

    const db = getFirestore();
    const authAdmin = getAuth();
    
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization) {
      return { success: false, error: "Unauthorized: No token provided." };
    }
    
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userOrgsQuery = query(collection(db, 'organizations'), where('createdBy', '==', userId));
    const orgSnapshot = await getDocs(userOrgsQuery);

    if (orgSnapshot.empty) {
      return { success: false, error: "User is not associated with any organization. Please create one first." };
    }
    const orgId = orgSnapshot.docs[0].id;


    const assessmentRef = await addDoc(collection(db, 'leapAssessments'),{
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
     if (error instanceof Error && (error.message.includes('parse'))) {
        return { success: false, error: 'Server configuration error: Could not parse Firebase service account key.'}
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
    const db = await getAdminFirestore();
    const assessmentRef = doc(db, 'leapAssessments', assessmentId);

    await updateDoc(assessmentRef, {
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
    const db = await getAdminFirestore();
    const assessmentRef = doc(db, 'leapAssessments', assessmentId);

    await updateDoc(assessmentRef, {
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
    const db = await getAdminFirestore();
    const assessmentRef = doc(db, 'leapAssessments', assessmentId);

    await updateDoc(assessmentRef, {
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
    const db = await getAdminFirestore();
    const assessmentRef = doc(db, 'leapAssessments', assessmentId);

    await updateDoc(assessmentRef, {
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