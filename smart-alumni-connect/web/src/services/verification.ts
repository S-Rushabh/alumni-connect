import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";

// Simulate SHA-256 Hashing (Mock)
const mockSha256 = async (data: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

export const verifyUserOnBlockchain = async (userId: string) => {
    try {
        // 1. Generate unique hash for the verification event
        const hash = await mockSha256(`VERIFY_${userId}_${Date.now()}`);

        // 2. Store "on-chain" (simulated by storing hash in Firestore)
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            verification: {
                isVerified: true,
                certificateHash: hash,
                issuedAt: Timestamp.now()
            }
        });

        return hash;
    } catch (error) {
        console.error("Blockchain verification failed:", error);
        throw error;
    }
};
