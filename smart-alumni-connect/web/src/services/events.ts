import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { Event } from "../types";

export const createEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
        const eventsRef = collection(db, 'events');
        await addDoc(eventsRef, {
            ...eventData,
            date: Timestamp.fromDate(new Date(eventData.date)), // Ensure date is Timestamp
            attendees: []
        });
        console.log("Event created successfully!");
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
};

export const getEvents = async (): Promise<Event[]> => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
};
