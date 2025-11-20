
'use client';

import { openDB, IDBPDatabase } from 'idb';
import { sha256Hex, canonicalString, signString } from './crypto';

// Define the database schema
interface RegenKernelDB {
    actions: {
        key: string;
        value: any;
    };
    ledger: {
        key: number;
        value: any;
        indexes: { 'timestamp': string };
    };
    meta: {
        key: string;
        value: any;
    };
     keyStore: {
        key: string;
        value: CryptoKey;
    };
}

let dbPromise: Promise<IDBPDatabase<RegenKernelDB>> | null = null;

// Function to get the database instance
function getDb(): Promise<IDBPDatabase<RegenKernelDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RegenKernelDB>('RegenKernelDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('actions')) {
            db.createObjectStore('actions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ledger')) {
            const ledgerStore = db.createObjectStore('ledger', { keyPath: 'index', autoIncrement: true });
            ledgerStore.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta');
        }
        if (!db.objectStoreNames.contains('keyStore')) {
            db.createObjectStore('keyStore');
        }
      },
    });
  }
  return dbPromise;
}


async function computeLedgerStateHash(): Promise<string> {
    const db = await getDb();
    const allLedgerEntries = await db.getAllFromIndex('ledger', 'timestamp');
    const concatenatedHashes = allLedgerEntries.map(entry => entry.payload.actionHash).join('');
    return sha256Hex(concatenatedHashes);
}

/**
 * Saves an action to the local IndexedDB, updates the ledger,
 * and signs the action.
 * @param payload The action data to save.
 * @returns The fully processed and signed action payload.
 */
export async function saveActionLocally(payload: any): Promise<any> {
    const db = await getDb();
    
    // 1. Finalize payload details
    const finalPayload = {
        ...payload,
        id: payload.id || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
    };

    // 2. Create canonical string and hash it
    const cString = canonicalString(finalPayload);
    finalPayload.actionHash = await sha256Hex(cString);

    // 3. Sign the hash
    finalPayload.signature = await signString(finalPayload.actionHash);

    // 4. Save the action
    await db.put('actions', finalPayload);

    // 5. Add to ledger
    await db.add('ledger', {
        type: 'ACTION_ADD',
        payload: {
            actionId: finalPayload.id,
            actionHash: finalPayload.actionHash,
        },
        ts: finalPayload.timestamp,
    });

    // 6. Recompute and save the new ledger state hash
    const ledgerStateHash = await computeLedgerStateHash();
    await db.put('meta', ledgerStateHash, 'ledgerStateHash');
    finalPayload.ledgerStateHash = ledgerStateHash;
    
    // 7. Update the action with the final ledger state hash
    await db.put('actions', finalPayload);

    return finalPayload;
}

/**
 * Retrieves all actions from the local database.
 * @returns A promise that resolves to an array of all actions.
 */
export async function getAllLocalActions(): Promise<any[]> {
    const db = await getDb();
    return db.getAll('actions');
}
