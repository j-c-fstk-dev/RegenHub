"use client";

import { useUser } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
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
  category?: string; // Legacy or for simpler use cases
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
}

const WizardContext = createContext<WizardContextProps | undefined>(undefined);

export const WizardProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(0); // Start at step 0 for welcome screen
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const getDraftRef = useCallback(() => {
      if (!user || !firestore) return null;
      return doc(firestore, `users/${user.uid}/actions/draft`);
  }, [user, firestore]);

  // Function to create or load a draft
  const loadOrCreateDraft = useCallback(async () => {
    const draftRef = getDraftRef();
    if (!draftRef) return;

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
  }, [user, firestore, getDraftRef, toast]);
  
  useEffect(() => {
    if (!isUserLoading && user) {
      loadOrCreateDraft();
    } else if (!isUserLoading && !user) {
      setIsLoading(false); // Not logged in, stop loading
    }
  }, [user, isUserLoading, loadOrCreateDraft]);

  // Function to update the draft in Firestore
  const updateDraft = useCallback(async (data: Partial<ActionDraft>) => {
    const draftRef = getDraftRef();
    if (!draftRef) return;
    
    setDraft(prev => prev ? { ...prev, ...data } : null); // Optimistic update
    try {
      await setDoc(draftRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating draft:", error);
      toast({ variant: "destructive", title: "Sync Error", description: "Could not save your progress." });
    }
  }, [getDraftRef, toast]);

  const submitAction = async () => {
    if (!draft) return;
    
    if (!draft.orgId || !draft.projectId) {
        toast({ variant: "destructive", title: "Missing Information", description: "Organization and Project must be set before submitting." });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication token not found.");
      
      const payload = {
        ...draft,
        mediaUrls: draft.mediaUrls?.map(m => m.url).filter(Boolean) || [], // Flatten for API
      };

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: "Success!", description: "Your action has been submitted for validation." });
        setIsSubmitted(true);
        // Delete the draft document after successful submission
        const draftRef = getDraftRef();
        if(draftRef) await deleteDoc(draftRef);
      } else {
        throw new Error(result.error || "Failed to submit action.");
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ variant: "destructive", title: "Submission Failed", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setDraft(null);
    setStep(0);
    setIsSubmitted(false);
    loadOrCreateDraft();
  };

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
