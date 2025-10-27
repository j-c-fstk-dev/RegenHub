
import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers";

// Ensure Firebase is initialized only once
if (getApps().length === 0) {
  const serviceAccount: ServiceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

/**
 * This is a placeholder for the weekly batching function.
 * In a production environment, this would be a scheduled job (e.g., a cron job)
 * that runs automatically once a week.
 *
 * It will:
 * 1. Query all certificates generated in the last week.
 * 2. Construct a Merkle tree from their hashes.
 * 3. Anchor the Merkle root on-chain via a smart contract call.
 * 4. Save the Merkle root and transaction hash to the `/batches` collection.
 */
export async function GET(req: Request) {
    try {
        console.log("Simulating weekly batch run...");

        // 1. Query all certificates that haven't been batched yet.
        // In a real scenario, you'd track which certs are batched. For now, we'll get all.
        const certificatesSnapshot = await db.collectionGroup("certificate").get();
        if(certificatesSnapshot.empty) {
            return NextResponse.json({ success: true, message: "No new certificates to batch." }, { status: 200 });
        }

        const leaves = certificatesSnapshot.docs.map(doc =>
            Buffer.from(doc.data().hash.replace("0x", ""), "hex")
        );
        
        // 2. Construct the Merkle tree.
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = tree.getHexRoot();

        console.log("Calculated Merkle Root:", root);

        // 3. Anchor the root on-chain (placeholder).
        // const txHash = await onchainAnchor(root);
        const txHash = `0x${Buffer.from(keccak256(Buffer.from(root))).toString('hex').slice(0,64)}`;
        console.log("Simulated On-Chain Tx Hash:", txHash);

        // 4. Save the batch details.
        const batchRef = await db.collection("batches").add({
            merkleRoot: root,
            txHash,
            certificateCount: leaves.length,
            createdAt: new Date()
        });

        // In a real app, you would also update the individual certificates with their batchId.

        return NextResponse.json({ success: true, batchId: batchRef.id, merkleRoot: root, txHash }, { status: 200 });

    } catch (error) {
        console.error("Error running weekly batch:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
