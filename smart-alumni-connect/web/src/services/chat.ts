import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, arrayUnion, getDocs, where, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { ChatMessage, MessageReaction, UserProfile } from "../types";
import { getUserProfile } from "./user";

// Create or Get a Chat between two users
export const getOrCreateChat = async (currentUserUid: string, otherUserUid: string) => {
    const chatId = [currentUserUid, otherUserUid].sort().join('_');
    return chatId;
};

// Helper to update chat metadata
const updateChatMetadata = async (chatId: string, participants: string[], lastMessage: string) => {
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
        participants,
        lastMessage,
        lastUpdated: Timestamp.now(),
        // We use a map for quick lookups or an array for queries.
        // Array is better for "array-contains" queries.
        participantIds: participants
    }, { merge: true });
    console.log(`Updated chat metadata for ${chatId}`);
};

// Send Text Message
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
        senderId,
        text,
        type: 'text',
        timestamp: Timestamp.now(),
        readBy: [senderId] // Sender has read their own message
    });

    // Update chat metadata for recent connections
    const participants = chatId.split('_'); // Assuming chatId is uid1_uid2
    await updateChatMetadata(chatId, participants, text);
};

// Send Image Message
export const sendImageMessage = async (chatId: string, senderId: string, imageUrl: string, caption?: string) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
        senderId,
        text: caption || '',
        type: 'image',
        imageUrl,
        timestamp: Timestamp.now(),
        readBy: [senderId]
    });

    // Update chat metadata
    const participants = chatId.split('_');
    await updateChatMetadata(chatId, participants, '📷 Image');
};

// Send File Message
export const sendFileMessage = async (chatId: string, senderId: string, fileUrl: string, fileName: string, fileSize: number) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
        senderId,
        text: fileName,
        type: 'file',
        fileUrl,
        fileName,
        fileSize,
        timestamp: Timestamp.now(),
        readBy: [senderId]
    });

    // Update chat metadata
    const participants = chatId.split('_');
    await updateChatMetadata(chatId, participants, '📎 File');
};

// Subscribe to Messages
export const subscribeToChat = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatMessage));
        callback(messages);
    });
};

// Mark Message as Read
export const markMessageAsRead = async (chatId: string, messageId: string, userId: string) => {
    try {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        await updateDoc(messageRef, {
            readBy: arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error marking message as read:", error);
    }
};

// Mark All Messages as Read
export const markAllMessagesAsRead = async (chatId: string, userId: string) => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef);
        const snapshot = await getDocs(q);

        const updates = snapshot.docs.map(doc => {
            const messageRef = doc.ref;
            const data = doc.data();
            if (!data.readBy?.includes(userId)) {
                return updateDoc(messageRef, {
                    readBy: arrayUnion(userId)
                });
            }
            return Promise.resolve();
        });

        await Promise.all(updates);
    } catch (error) {
        console.error("Error marking all messages as read:", error);
    }
};

// Add Message Reaction
export const addMessageReaction = async (chatId: string, messageId: string, userId: string, userName: string, reaction: string) => {
    try {
        const reactionsRef = collection(db, 'chats', chatId, 'messages', messageId, 'reactions');

        // Check if user already reacted with this emoji
        const q = query(reactionsRef, where("userId", "==", userId), where("reaction", "==", reaction));
        const existing = await getDocs(q);

        if (!existing.empty) {
            return; // Already reacted with this emoji
        }

        await addDoc(reactionsRef, {
            userId,
            userName,
            reaction,
            createdAt: Timestamp.now()
        });

        // Update reaction count on message
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        const reactionKey = `reactions.${reaction}`;
        await updateDoc(messageRef, {
            [reactionKey]: arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error adding reaction:", error);
    }
};

// Remove Message Reaction
export const removeMessageReaction = async (chatId: string, messageId: string, userId: string, reaction: string) => {
    try {
        const reactionsRef = collection(db, 'chats', chatId, 'messages', messageId, 'reactions');
        const q = query(reactionsRef, where("userId", "==", userId), where("reaction", "==", reaction));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
    } catch (error) {
        console.error("Error removing reaction:", error);
    }
};

// Get Message Reactions
export const getMessageReactions = async (chatId: string, messageId: string): Promise<MessageReaction[]> => {
    try {
        const reactionsRef = collection(db, 'chats', chatId, 'messages', messageId, 'reactions');
        const snapshot = await getDocs(reactionsRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MessageReaction));
    } catch (error) {
        console.error("Error getting reactions:", error);
        return [];
    }
};

// Set Typing Status
export const setTypingStatus = async (chatId: string, userId: string, isTyping: boolean) => {
    try {
        const typingRef = doc(db, 'chats', chatId, 'typing', userId);

        if (isTyping) {
            await setDoc(typingRef, {
                userId,
                timestamp: Timestamp.now()
            });
        } else {
            await deleteDoc(typingRef);
        }
    } catch (error) {
        console.error("Error setting typing status:", error);
    }
};

// Subscribe to Typing Status
export const subscribeToTypingStatus = (chatId: string, otherUserId: string, callback: (isTyping: boolean) => void) => {
    const typingRef = doc(db, 'chats', chatId, 'typing', otherUserId);

    return onSnapshot(typingRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            const timestamp = data.timestamp.toDate();
            const now = new Date();
            const diffSeconds = (now.getTime() - timestamp.getTime()) / 1000;

            // Consider typing if updated within last 3 seconds
            callback(diffSeconds < 3);
        } else {
            callback(false);
        }
    });
};

// Search Messages
export const searchMessages = async (chatId: string, searchQuery: string): Promise<ChatMessage[]> => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const snapshot = await getDocs(messagesRef);

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatMessage));

        // Client-side filtering (Firestore doesn't support full-text search)
        const query = searchQuery.toLowerCase();
        return messages.filter(msg =>
            msg.text?.toLowerCase().includes(query) ||
            msg.fileName?.toLowerCase().includes(query)
        );
    } catch (error) {
        console.error("Error searching messages:", error);
        return [];
    }
};

// Delete Message
export const deleteMessage = async (chatId: string, messageId: string) => {
    try {
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        await deleteDoc(messageRef);
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};

/**
 * Get recent connections based on chat history.
 * @param userId The current user's ID
 * @param limitCount Number of recent connections to return
 */
// Update return type to include timestamp
export const getRecentConnections = async (userId: string, limitCount: number = 3): Promise<{ user: UserProfile, lastMessageTime: any }[]> => {
    try {
        const chatsRef = collection(db, 'chats');

        // Query chats where user is a participant. 
        // We avoid using orderBy('lastUpdated') here to prevent "Missing Index" errors 
        // if the composite index hasn't been created in Firebase Console.
        const q = query(
            chatsRef,
            where('participantIds', 'array-contains', userId)
        );

        const snapshot = await getDocs(q);

        // Sort manually by lastUpdated (descending)
        const sortedDocs = snapshot.docs.sort((a, b) => {
            const dataA = a.data();
            const dataB = b.data();
            const timeA = dataA.lastUpdated?.toMillis ? dataA.lastUpdated.toMillis() : (dataA.lastUpdated || 0);
            const timeB = dataB.lastUpdated?.toMillis ? dataB.lastUpdated.toMillis() : (dataB.lastUpdated || 0);
            return timeB - timeA;
        });

        // Extract other user IDs and timestamps in order
        const orderedItems: { uid: string, lastUpdated: any }[] = [];
        sortedDocs.forEach(doc => {
            const data = doc.data();
            const otherUserId = data.participantIds.find((pid: string) => pid !== userId);
            if (otherUserId && !orderedItems.find(i => i.uid === otherUserId)) {
                orderedItems.push({ uid: otherUserId, lastUpdated: data.lastUpdated });
            }
        });

        const finalItems = orderedItems.slice(0, limitCount);

        const results: { user: UserProfile, lastMessageTime: any }[] = [];
        for (const item of finalItems) {
            const userProfile = await getUserProfile(item.uid);
            if (userProfile) {
                results.push({ user: userProfile, lastMessageTime: item.lastUpdated });
            }
        }

        return results;
    } catch (error) {
        console.error("Error fetching recent connections:", error);
        return [];
    }
};

