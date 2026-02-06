import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, updateDoc, arrayUnion, arrayRemove, where, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Event, EventFeedback, EventAttendee } from "../types";

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'attendees'>, organizerUid: string, organizerName: string) => {
    try {
        const eventsRef = collection(db, 'events');
        const eventDoc = {
            ...eventData,
            date: eventData.date instanceof Date ? Timestamp.fromDate(eventData.date) :
                typeof eventData.date === 'string' ? Timestamp.fromDate(new Date(eventData.date)) :
                    eventData.date,
            organizer: organizerUid,
            organizerName: organizerName,
            attendees: [],
            createdAt: Timestamp.now()
        };

        const docRef = await addDoc(eventsRef, eventDoc);
        console.log("Event created successfully with ID:", docRef.id);
        return docRef.id;
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
        return [];
    }
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
    try {
        const eventsRef = collection(db, 'events');
        const now = Timestamp.now();
        const q = query(eventsRef, where("date", ">=", now), orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
    }
};

export const getPastEvents = async (): Promise<Event[]> => {
    try {
        const eventsRef = collection(db, 'events');
        const now = Timestamp.now();
        const q = query(eventsRef, where("date", "<", now), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
    } catch (error) {
        console.error("Error fetching past events:", error);
        return [];
    }
};

export const getEventsByCategory = async (category: string): Promise<Event[]> => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where("category", "==", category), orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Event));
    } catch (error) {
        console.error("Error fetching events by category:", error);
        return [];
    }
};

// RSVP Functions
export const rsvpToEvent = async (eventId: string, userId: string, userName: string, userPhoto?: string, userRole?: string, userCompany?: string) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
            throw new Error("Event not found");
        }

        const eventData = eventSnap.data() as Event;

        // Check capacity
        if (eventData.capacity && eventData.attendees && eventData.attendees.length >= eventData.capacity) {
            throw new Error("Event is at full capacity");
        }

        // Check if already RSVP'd
        if (eventData.attendees?.includes(userId)) {
            throw new Error("Already RSVP'd to this event");
        }

        await updateDoc(eventRef, {
            attendees: arrayUnion(userId)
        });

        // Also store detailed attendee info in a subcollection for easy retrieval
        const attendeeRef = collection(db, 'events', eventId, 'attendee_details');
        await addDoc(attendeeRef, {
            uid: userId,
            name: userName,
            photoURL: userPhoto,
            role: userRole,
            company: userCompany,
            rsvpedAt: Timestamp.now()
        });

        console.log("RSVP successful");
    } catch (error) {
        console.error("Error RSVPing to event:", error);
        throw error;
    }
};

export const cancelRSVP = async (eventId: string, userId: string) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
            attendees: arrayRemove(userId)
        });

        // Remove from attendee_details subcollection
        const attendeeRef = collection(db, 'events', eventId, 'attendee_details');
        const q = query(attendeeRef, where("uid", "==", userId));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (docSnap) => {
            await deleteDoc(docSnap.ref);
        });

        console.log("RSVP cancelled");
    } catch (error) {
        console.error("Error cancelling RSVP:", error);
        throw error;
    }
};

export const checkUserRSVP = async (eventId: string, userId: string): Promise<boolean> => {
    try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) return false;

        const eventData = eventSnap.data() as Event;
        return eventData.attendees?.includes(userId) || false;
    } catch (error) {
        console.error("Error checking RSVP:", error);
        return false;
    }
};

export const getEventAttendees = async (eventId: string): Promise<EventAttendee[]> => {
    try {
        const attendeeRef = collection(db, 'events', eventId, 'attendee_details');
        const querySnapshot = await getDocs(attendeeRef);

        return querySnapshot.docs.map(doc => doc.data() as EventAttendee);
    } catch (error) {
        console.error("Error fetching event attendees:", error);
        return [];
    }
};

// Event Management
export const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
        const eventRef = doc(db, 'events', eventId);

        // Convert date if needed
        if (updates.date) {
            updates.date = updates.date instanceof Date ? Timestamp.fromDate(updates.date) :
                typeof updates.date === 'string' ? Timestamp.fromDate(new Date(updates.date)) :
                    updates.date;
        }

        await updateDoc(eventRef, updates);
        console.log("Event updated successfully");
    } catch (error) {
        console.error("Error updating event:", error);
        throw error;
    }
};

export const deleteEvent = async (eventId: string) => {
    try {
        const eventRef = doc(db, 'events', eventId);
        await deleteDoc(eventRef);
        console.log("Event deleted successfully");
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
};

// Feedback Functions
export const submitEventFeedback = async (feedbackData: Omit<EventFeedback, 'id' | 'createdAt'>) => {
    try {
        const feedbackRef = collection(db, 'event_feedback');
        await addDoc(feedbackRef, {
            ...feedbackData,
            createdAt: Timestamp.now()
        });
        console.log("Feedback submitted successfully");
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw error;
    }
};

export const getEventFeedback = async (eventId: string): Promise<EventFeedback[]> => {
    try {
        const feedbackRef = collection(db, 'event_feedback');
        const q = query(feedbackRef, where("eventId", "==", eventId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as EventFeedback));
    } catch (error) {
        console.error("Error fetching event feedback:", error);
        return [];
    }
};

export const getAverageRating = async (eventId: string): Promise<number> => {
    try {
        const feedback = await getEventFeedback(eventId);
        if (feedback.length === 0) return 0;

        const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
        return sum / feedback.length;
    } catch (error) {
        console.error("Error calculating average rating:", error);
        return 0;
    }
};
