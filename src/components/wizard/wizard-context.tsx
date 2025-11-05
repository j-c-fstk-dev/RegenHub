"use client";

import { useUser } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";

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
  location?: any;
  mediaUrls?: string[];
}


interface WizardContextProps {
  step: number;
  setStep: (step: number) => void;
  draftId: string | null;
  draft: ActionDraft | null;
  isLoading: boolean;
  setDraft: (draft: ActionDraft | null) => void;
  updateDraft: (data: Partial<ActionDraft>) => void;
}

const WizardContext = createContext<WizardContextProps | undefined>(undefined);

export const WizardProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to create or load a draft
  const loadOrCreateDraft = useCallback(async () => {
    if (!user || !firestore) return;

    setIsLoading(true);
    const draftRef = doc(firestore, `users/${user.uid}/actions/draft`);
    
    try {
      const draftSnap = await getDoc(draftRef);
      if (draftSnap.exists()) {
        const existingDraft = { id: draftSnap.id, ...draftSnap.data() } as ActionDraft;
        setDraft(existingDraft);
        setDraftId(draftSnap.id); // 'draft'
      } else {
        const newDraft: ActionDraft = {
          id: 'draft',
          status: "draft",
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        };
        await setDoc(draftRef, newDraft);
        setDraft(newDraft);
        setDraftId('draft');
      }
    } catch (error) {
      console.error("Error loading or creating draft:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore]);
  
  useEffect(() => {
    if (!isUserLoading && user) {
      loadOrCreateDraft();
    } else if (!isUserLoading && !user) {
      setIsLoading(false); // Not logged in, stop loading
    }
  }, [user, isUserLoading, loadOrCreateDraft]);

  // Function to update the draft in Firestore
  const updateDraft = async (data: Partial<ActionDraft>) => {
    if (!draftId || !user || !firestore) return;
    const draftRef = doc(firestore, `users/${user.uid}/actions/${draftId}`);
    try {
      const currentDraft = draft ? { ...draft, ...data } : { ...data };
      setDraft(currentDraft as ActionDraft); // Optimistic update
      await setDoc(draftRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating draft:", error);
    }
  };


  const value = {
    step,
    setStep,
    draftId,
    draft,
    isLoading,
    setDraft,
    updateDraft,
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
