"use client";

import { useUser } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, addDoc, collection } from "firebase/firestore";
import { useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface ActionDraft {
  id: string;
  status: "draft" | "submitted" | "review_ready" | "verified" | "rejected";
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
  orgId?: string;
  projectId?: string;
  title?: string;
  description?: string;
  actionTypeId?: string;
  actionTypeName?: string;
  baseScore?: number;
  domain?: string;
  location?: string;
  mediaUrls?: { url: string }[];
  category?: string;
}


interface WizardContextProps {
  step: number;
  setStep: (step: number) => void;
  draftId: string | null;
  draft: ActionDraft | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  setDraft: (draft: ActionDraft | null) => void;
  updateDraft: (data: Partial<ActionDraft>) => void;
  submitAction: () => Promise<void>;
  resetWizard: () => void;
  startNewWizard: () => void;
}

const WizardContext = createContext<WizardContextProps | undefined>(undefined);

export const WizardProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const getDraftRef = useCallback(() => {
      if (!user || !firestore) return null;
      return doc(firestore, `users/${user.uid}/actions/draft`);
  }, [user, firestore]);

  const loadOrCreateDraft = useCallback(async () => {
    const draftRef = getDraftRef();
    if (!draftRef || draft) return;

    setIsLoading(true);
    
    try {
      const draftSnap = await getDoc(draftRef);
      if (draftSnap.exists()) {
        const existingDraft = { id: draftSnap.id, ...draftSnap.data() } as ActionDraft;
        setDraft(existingDraft);
      } else {
        const newDraft: ActionDraft = {
          id: 'draft',
          status: "draft",
          createdBy: draftRef.parent.parent!.id,
          createdAt: serverTimestamp(),
        };
        await setDoc(draftRef, newDraft);
        setDraft(newDraft);
      }
      setDraftId('draft');
    } catch (error) {
      console.error("Error loading or creating draft:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your draft." });
    } finally {
      setIsLoading(false);
    }
  }, [getDraftRef, toast, draft]);
  
  useEffect(() => {
    if (!isUserLoading && user && !isSubmitted) {
      loadOrCreateDraft();
    } else if (!isUserLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isUserLoading, isSubmitted, loadOrCreateDraft]);

  const updateDraft = useCallback(async (data: Partial<ActionDraft>) => {
    const draftRef = getDraftRef();
    if (!draftRef) return;
    
    setDraft(prev => prev ? { ...prev, ...data } : null);
    try {
      await setDoc(draftRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating draft:", error);
      const permissionError = new FirestorePermissionError({
        path: draftRef.path,
        operation: 'write',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: "destructive", title: "Sync Error", description: "Could not save your progress." });
    }
  }, [getDraftRef, toast]);

  const submitAction = async () => {
    if (!draft || !user || !firestore) return;
    
    if (!draft.orgId || !draft.projectId) {
        toast({ variant: "destructive", title: "Missing Information", description: "Organization and Project must be set before submitting." });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const actionPayload = {
        title: draft.title || "",
        description: draft.description || "",
        orgId: draft.orgId,
        projectId: draft.projectId,
        category: draft.actionTypeName || "Other", // Using actionTypeName as category
        location: draft.location || null,
        mediaUrls: draft.mediaUrls?.map(m => m.url).filter(Boolean) || [],
        status: 'submitted', // AI verification will be handled separately
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        validatedAt: null,
        validatorId: null,
        validationComments: null,
        validationScore: null,
        certificateUrl: null,
        // The AI result will be added later by a separate process
      };

      const actionsCollection = collection(firestore, 'actions');
      await addDoc(actionsCollection, actionPayload);

      toast({ title: "Success!", description: "Your action has been submitted for validation." });
      setIsSubmitted(true);
      
      const draftRef = getDraftRef();
      if (draftRef) await deleteDoc(draftRef);

    } catch (error) {
      console.error("Submission failed:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      const permissionError = new FirestorePermissionError({
          path: 'actions',
          operation: 'create',
          requestResourceData: draft,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: "destructive", title: "Submission Failed", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = useCallback(async () => {
    const draftRef = getDraftRef();
    if(draftRef) {
        await deleteDoc(draftRef);
    }
    setDraft(null);
    setDraftId(null);
    setStep(0);
    setIsSubmitted(false);
    setIsLoading(true); // Set to loading to trigger draft creation
  }, [getDraftRef]);
  
  const startNewWizard = () => {
    resetWizard().then(() => {
        // The useEffect will handle loading/creating the new draft
        // as isLoading is set to true and isSubmitted is false.
        loadOrCreateDraft();
    });
  }

  const value = {
    step,
    setStep,
    draftId,
    draft,
    isLoading,
    isSubmitting,
    isSubmitted,
    setDraft,
    updateDraft,
    submitAction,
    resetWizard,
    startNewWizard
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};
