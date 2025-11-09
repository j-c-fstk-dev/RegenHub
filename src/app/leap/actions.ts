'use server';

import { doc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { initializeFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';

/**
 * Saves the data from the 'L - Locate' step of the LEAP assessment.
 * @param firestore The Firestore instance.
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

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return { success: false, error: "Firestore is not initialized." };
  }

  try {
    const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
    await updateDoc(assessmentRef, {
      'company.sector': companyData.sector,
      'company.size': companyData.size,
      'company.sites': companyData.sites.map(s => s.value),
      stage: 'E', // Move to the next stage
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    const permissionError = new FirestorePermissionError({
      path: `leapAssessments/${assessmentId}`,
      operation: 'update',
      requestResourceData: { company: companyData, stage: 'E' },
    });
    errorEmitter.emit('permission-error', permissionError);
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
    
    const { firestore } = initializeFirebase();
    if (!firestore) {
        return { success: false, error: "Firestore is not initialized." };
    }

  try {
    const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
    await updateDoc(assessmentRef, {
      'inputs.water': data.inputs.water,
      'inputs.energy': data.inputs.energy,
      'impacts.generalPractices': data.impacts.practices,
      stage: 'A', // Move to the next stage
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
     const permissionError = new FirestorePermissionError({
      path: `leapAssessments/${assessmentId}`,
      operation: 'update',
      requestResourceData: { ...data, stage: 'A' },
    });
    errorEmitter.emit('permission-error', permissionError);
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

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return { success: false, error: "Firestore is not initialized." };
  }

  try {
    const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
    await updateDoc(assessmentRef, {
      risks: data.risks,
      opportunities: data.opportunities,
      stage: 'P', // Move to the next stage
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    const permissionError = new FirestorePermissionError({
      path: `leapAssessments/${assessmentId}`,
      operation: 'update',
      requestResourceData: { ...data, stage: 'P' },
    });
    errorEmitter.emit('permission-error', permissionError);
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

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return { success: false, error: "Firestore is not initialized." };
  }

  try {
    const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
    await updateDoc(assessmentRef, {
      plan: data.plan,
      stage: 'done', // Mark assessment as complete
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
     const permissionError = new FirestorePermissionError({
      path: `leapAssessments/${assessmentId}`,
      operation: 'update',
      requestResourceData: { ...data, stage: 'done' },
    });
    errorEmitter.emit('permission-error', permissionError);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return { success: false, error: `Failed to save data: ${errorMessage}` };
  }
}
