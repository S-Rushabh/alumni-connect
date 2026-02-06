import { doc, setDoc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { UserPresence } from "../types";

// Update User Presence
export const updateUserPresence = async (uid: string, status: 'online' | 'offline' | 'away') => {
    try {
        const presenceRef = doc(db, 'user_presence', uid);
        await setDoc(presenceRef, {
            uid,
            status,
            lastSeen: Timestamp.now()
        }, { merge: true });
    } catch (error) {
        console.error("Error updating presence:", error);
    }
};

// Get User Presence
export const getUserPresence = async (uid: string): Promise<UserPresence | null> => {
    try {
        const presenceRef = doc(db, 'user_presence', uid);
        const presenceSnap = await getDoc(presenceRef);

        if (presenceSnap.exists()) {
            return presenceSnap.data() as UserPresence;
        }

        return null;
    } catch (error) {
        console.error("Error getting presence:", error);
        return null;
    }
};

// Subscribe to User Presence (real-time updates)
export const subscribeToPresence = (uid: string, callback: (presence: UserPresence | null) => void) => {
    const presenceRef = doc(db, 'user_presence', uid);

    return onSnapshot(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as UserPresence);
        } else {
            callback(null);
        }
    });
};

// Set user online
export const setUserOnline = async (uid: string) => {
    await updateUserPresence(uid, 'online');
};

// Set user offline
export const setUserOffline = async (uid: string) => {
    await updateUserPresence(uid, 'offline');
};

// Set user away (after inactivity)
export const setUserAway = async (uid: string) => {
    await updateUserPresence(uid, 'away');
};

// Get formatted last seen text
export const getLastSeenText = (lastSeen: any): string => {
    if (!lastSeen) return 'Never';

    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return lastSeenDate.toLocaleDateString();
};
