import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { ChatMessage } from "../types";

// Create or Get a Chat between two users
export const getOrCreateChat = async (currentUserUid: string, otherUserUid: string) => {
    // Simpler approach for hackathon: Just check if a chat exists
    // In reality, this requires compound queries or specific ID logic
    // For now, we will just create a new chat for demo simplicity or fetch one if we knew the ID
    // Real implementation would look up a chat with participants == [A, B]
    // Ideally, use a deterministic ID: sort([uid1, uid2]).join('_')

    const chatId = [currentUserUid, otherUserUid].sort().join('_');
    return chatId;
};

// Send Message
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
        senderId,
        text,
        timestamp: Timestamp.now()
    });
};

// Subscribe to Messages
export const subscribeToChat = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as any)) as ChatMessage[];
        callback(messages);
    });
};
