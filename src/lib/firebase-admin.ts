import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function initializeAdminApp() {
    if (getApps().length > 0) {
        return getFirestore();
    }
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount: ServiceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        );
        initializeApp({
          credential: cert(serviceAccount),
        });
        return getFirestore();
    } 
    
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin SDK initialization failed.');
}
