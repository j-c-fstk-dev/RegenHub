'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
      storage: null,
    };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp as FirebaseApp | null}
      auth={firebaseServices.auth as Auth | null}
      firestore={firebaseServices.firestore as Firestore | null}
      storage={firebaseServices.storage as FirebaseStorage | null}
    >
      {children}
    </FirebaseProvider>
  );
}
