
'use client';

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper function to store a CryptoKey in IndexedDB
async function storeCryptoKey(dbName: string, storeName: string, key: CryptoKey, keyName: string): Promise<void> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(storeName);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(key, keyName);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Helper function to retrieve a CryptoKey from IndexedDB
async function getCryptoKey(dbName: string, storeName: string, keyName: string): Promise<CryptoKey | null> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(storeName);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(keyName);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Creates a canonical string from an action object for hashing.
 * Fields are ordered to ensure deterministic output.
 * @param action The action object.
 * @returns A stable JSON string representation of the action.
 */
export function canonicalString(action: any): string {
    return JSON.stringify({
        id: action.id,
        title: action.title,
        description: action.description,
        timestamp: action.timestamp,
        location: action.location,
        metrics: action.metrics,
        media: (action.media || []).map((m: any) => ({ name: m.name, hash: m.hash, size: m.size }))
    });
}

/**
 * Computes a SHA-256 hash of a string and returns it as a hex string.
 * @param str The string to hash.
 * @returns A promise that resolves to the hex-encoded hash.
 */
export async function sha256Hex(str: string): Promise<string> {
    const enc = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


/**
 * Generates a new ECDSA P-256 key pair for signing and verification.
 * The private key is non-extractable and stored in IndexedDB.
 * @returns A promise that resolves to an object containing the base64-encoded public key.
 */
export async function generateKeypair(): Promise<{ publicKeyBase64: string }> {
    const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, // non-extractable private key
        ['sign', 'verify']
    );

    const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);

    // Store the keys in IndexedDB
    await storeCryptoKey('RegenKernelDB', 'keyStore', keyPair.privateKey, 'privateKey');
    await storeCryptoKey('RegenKernelDB', 'keyStore', keyPair.publicKey, 'publicKey');

    return { publicKeyBase64: arrayBufferToBase64(publicKeySpki) };
}

/**
 * Signs a string with the private key stored in IndexedDB.
 * @param dataString The string to sign.
 * @returns A promise that resolves to the base64-encoded signature.
 * @throws If the private key is not found.
 */
export async function signString(dataString: string): Promise<string> {
    const privateKey = await getCryptoKey('RegenKernelDB', 'keyStore', 'privateKey');
    if (!privateKey) {
        throw new Error("Private key not found. Please complete the Seed Protocol.");
    }

    const data = new TextEncoder().encode(dataString);
    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: { name: 'SHA-256' } },
        privateKey,
        data
    );

    return arrayBufferToBase64(signature);
}
