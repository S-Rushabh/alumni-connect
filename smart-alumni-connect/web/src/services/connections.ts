import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Connection } from "../types";

// Send Connection Request
export const sendConnectionRequest = async (
    requesterId: string,
    requesterName: string,
    requesterPhoto: string | undefined,
    requesterRole: string | undefined,
    requesterCompany: string | undefined,
    recipientId: string,
    recipientName: string,
    recipientPhoto: string | undefined,
    recipientRole: string | undefined,
    recipientCompany: string | undefined,
    message?: string
) => {
    try {
        // Check if connection already exists
        const existing = await checkConnectionStatus(requesterId, recipientId);
        if (existing) {
            throw new Error("Connection request already exists");
        }

        const connectionsRef = collection(db, 'connections');

        // Build connection data object, omitting undefined fields
        const connectionData: any = {
            requesterId,
            requesterName,
            recipientId,
            recipientName,
            status: 'pending',
            message: message || '',
            createdAt: Timestamp.now()
        };

        // Only add optional fields if they're defined
        if (requesterPhoto) connectionData.requesterPhoto = requesterPhoto;
        if (requesterRole) connectionData.requesterRole = requesterRole;
        if (requesterCompany) connectionData.requesterCompany = requesterCompany;
        if (recipientPhoto) connectionData.recipientPhoto = recipientPhoto;
        if (recipientRole) connectionData.recipientRole = recipientRole;
        if (recipientCompany) connectionData.recipientCompany = recipientCompany;

        await addDoc(connectionsRef, connectionData);

        console.log("Connection request sent successfully");
    } catch (error) {
        console.error("Error sending connection request:", error);
        throw error;
    }
};

// Accept Connection Request
export const acceptConnectionRequest = async (connectionId: string, connection: Connection) => {
    try {
        const connectionRef = doc(db, 'connections', connectionId);
        await updateDoc(connectionRef, {
            status: 'accepted',
            respondedAt: Timestamp.now()
        });

        // Create chat thread when connection is accepted
        const chatId = [connection.requesterId, connection.recipientId].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, {
            participants: [connection.requesterId, connection.recipientId],
            participantIds: [connection.requesterId, connection.recipientId],
            lastMessage: '',
            lastUpdated: Timestamp.now(),
            createdAt: Timestamp.now()
        }, { merge: true });

        console.log("Connection request accepted and chat created");
    } catch (error) {
        console.error("Error accepting connection request:", error);
        throw error;
    }
};

// Reject Connection Request
export const rejectConnectionRequest = async (connectionId: string) => {
    try {
        const connectionRef = doc(db, 'connections', connectionId);
        await updateDoc(connectionRef, {
            status: 'rejected',
            respondedAt: Timestamp.now()
        });
        console.log("Connection request rejected");
    } catch (error) {
        console.error("Error rejecting connection request:", error);
        throw error;
    }
};

// Get Connection Requests (pending requests for a user)
export const getConnectionRequests = async (userId: string): Promise<Connection[]> => {
    try {
        const connectionsRef = collection(db, 'connections');
        const q = query(
            connectionsRef,
            where("recipientId", "==", userId),
            where("status", "==", "pending"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Connection));
    } catch (error) {
        console.error("Error fetching connection requests:", error);
        return [];
    }
};

// Get User Connections (accepted connections)
export const getUserConnections = async (userId: string): Promise<Connection[]> => {
    try {
        const connectionsRef = collection(db, 'connections');

        // Get connections where user is requester
        const q1 = query(
            connectionsRef,
            where("requesterId", "==", userId),
            where("status", "==", "accepted")
        );

        // Get connections where user is recipient
        const q2 = query(
            connectionsRef,
            where("recipientId", "==", userId),
            where("status", "==", "accepted")
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        const connections1 = snapshot1.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Connection));

        const connections2 = snapshot2.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Connection));

        return [...connections1, ...connections2];
    } catch (error) {
        console.error("Error fetching user connections:", error);
        return [];
    }
};

// Check Connection Status between two users
export const checkConnectionStatus = async (user1: string, user2: string): Promise<Connection | null> => {
    try {
        const connectionsRef = collection(db, 'connections');

        // Check both directions
        const q1 = query(
            connectionsRef,
            where("requesterId", "==", user1),
            where("recipientId", "==", user2)
        );

        const q2 = query(
            connectionsRef,
            where("requesterId", "==", user2),
            where("recipientId", "==", user1)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        if (!snapshot1.empty) {
            return {
                id: snapshot1.docs[0].id,
                ...snapshot1.docs[0].data()
            } as Connection;
        }

        if (!snapshot2.empty) {
            return {
                id: snapshot2.docs[0].id,
                ...snapshot2.docs[0].data()
            } as Connection;
        }

        return null;
    } catch (error) {
        console.error("Error checking connection status:", error);
        return null;
    }
};

// Remove Connection
export const removeConnection = async (connectionId: string) => {
    try {
        const connectionRef = doc(db, 'connections', connectionId);
        await deleteDoc(connectionRef);
        console.log("Connection removed");
    } catch (error) {
        console.error("Error removing connection:", error);
        throw error;
    }
};

// Subscribe to Connection Requests (Incoming)
export const subscribeToConnectionRequests = (userId: string, callback: (requests: Connection[]) => void) => {
    const connectionsRef = collection(db, 'connections');
    const q = query(
        connectionsRef,
        where("recipientId", "==", userId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Connection));
        callback(requests);
    });
};

// Subscribe to User Connections (Accepted)
export const subscribeToUserConnections = (userId: string, callback: (connections: Connection[]) => void) => {
    const connectionsRef = collection(db, 'connections');

    // We need to listen to both: requesterId == userId AND recipientId == userId
    // Firestore OR queries for different fields are tricky in one go if we want to combine them easily with other filters
    // effectively. However, for a simple "OR" on two fields, we might need two listeners or a complex query.
    // simpler approach: simple client-side merge of two listeners or just listen to all connections involving the user?
    // "connections" collection might get large.
    // Let's use two listeners and merge them in the valid way, or use a workaround.

    // Actually, a better schema/query structure is usually "participants array contains userId". 
    // But we have requesterId and recipientId. 
    // Let's use two queries. But `onSnapshot` returns an unsubscribe function.
    // We can wrap this construction.

    const q1 = query(
        connectionsRef,
        where("requesterId", "==", userId),
        where("status", "==", "accepted")
    );

    const q2 = query(
        connectionsRef,
        where("recipientId", "==", userId),
        where("status", "==", "accepted")
    );

    let results1: Connection[] = [];
    let results2: Connection[] = [];

    const updateCallback = () => {
        // Dedup by ID just in case, though sets should be disjoint
        const allMap = new Map<string, Connection>();
        [...results1, ...results2].forEach(c => allMap.set(c.id!, c));
        callback(Array.from(allMap.values()));
    };

    const unsub1 = onSnapshot(q1, (snap) => {
        results1 = snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection));
        updateCallback();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
        results2 = snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection));
        updateCallback();
    });

    return () => {
        unsub1();
        unsub2();
    };
};
