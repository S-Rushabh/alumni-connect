
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { EventRecommendation } from '../types';

class EventRecommendationService {

    // Generate recommendations for a user
    async generateRecommendations(userId: string): Promise<EventRecommendation[]> {
        try {
            // Get user profile
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return [];

            const userData = userDoc.data();

            // Get all upcoming events
            const eventsQuery = query(
                collection(db, 'events'),
                // where('startTime', '>', Timestamp.now()), // Assuming 'startTime' field exists. If it's 'date', need to check schema. 'types.ts' says 'date'.
                // Let's assume 'date' and fetch all, filtering in memory for now to be safe against schema mismatches, or assume 'date' is a Timestamp.
                // orderBy('date', 'asc') // Requires index if filtering by date and ordering by date without composite index on everything else
            );

            const eventsSnapshot = await getDocs(eventsQuery);
            const now = new Date();
            const events = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter((e: any) => {
                // Robust check for date/startTime
                const eventDate = e.date ? e.date.toDate() : (e.startTime ? e.startTime.toDate() : null);
                return eventDate && eventDate > now;
            });

            // Get user's past event interactions
            const interactionsQuery = collection(
                db,
                'userEventInteractions',
                userId,
                'interactions'
            );
            const interactionsSnapshot = await getDocs(interactionsQuery);
            const interactions = new Map(
                interactionsSnapshot.docs.map(doc => [doc.id, doc.data()])
            );

            // Get user's connections

            // Simplify: Reciprocal connections might be stored. 
            // Assuming 'connections' collection has 'requesterId' and 'recipientId'.
            const sentConnections = await getDocs(query(collection(db, 'connections'), where('requesterId', '==', userId), where('status', '==', 'accepted')));
            const receivedConnections = await getDocs(query(collection(db, 'connections'), where('recipientId', '==', userId), where('status', '==', 'accepted')));

            const connections = [
                ...sentConnections.docs.map(d => d.data().recipientId),
                ...receivedConnections.docs.map(d => d.data().requesterId)
            ];

            // Calculate recommendation scores
            const recommendations: EventRecommendation[] = [];

            for (const event of events) {
                const score = await this.calculateEventScore(
                    event,
                    userData,
                    interactions,
                    connections
                );

                if (score.score > 0) {
                    recommendations.push(score);
                }
            }

            // Sort by score
            recommendations.sort((a, b) => b.score - a.score);

            // Save recommendations
            for (const rec of recommendations.slice(0, 20)) {
                await setDoc(
                    doc(db, 'eventRecommendations', userId, 'recommendations', rec.eventId),
                    {
                        ...rec,
                        generatedAt: Timestamp.now()
                    }
                );
            }

            return recommendations;

        } catch (error) {
            console.error('Error generating recommendations:', error);
            return [];
        }
    }

    // Calculate recommendation score for an event
    async calculateEventScore(
        event: any,
        userData: any,
        interactions: Map<string, any>,
        connections: string[]
    ): Promise<EventRecommendation> {
        let score = 0;
        const reasons: string[] = [];

        // Base score
        score += 10;

        // Interest match (tags/topics)
        if (userData.interests && event.tags) {
            const matchingInterests = userData.interests.filter((interest: string) =>
                event.tags.includes(interest)
            );

            if (matchingInterests.length > 0) {
                score += matchingInterests.length * 15;
                reasons.push(`Matches your interests: ${matchingInterests.join(', ')}`);
            }
        }

        // Department/batch match (Assuming metadata exists)
        if (event.targetAudience) {
            if (event.targetAudience.departments?.includes(userData.industry)) { // Mapping 'industry' to 'department' roughly
                score += 20;
                reasons.push('Relevant to your industry');
            }

            if (event.targetAudience.batches?.includes(userData.graduationYear)) {
                score += 15;
                reasons.push('Targeted for your class');
            }
        }

        // Location proximity
        const eventLocation = event.location;
        const userLocation = userData.location;

        if (!event.isVirtual && userLocation && eventLocation) {
            // Handle object vs string location
            const userCity = typeof userLocation === 'object' ? userLocation.city : (userLocation || '').split(',')[0];
            const eventCity = typeof eventLocation === 'object' ? eventLocation.city : (eventLocation || '').split(',')[0];

            if (userCity && eventCity && userCity === eventCity) {
                score += 25;
                reasons.push('In your city');
            }
        }

        // Virtual events get bonus for remote users (implicit)
        if (event.type === 'virtual' || event.isVirtual) {
            score += 10;
            reasons.push('Virtual - join from anywhere');
        }

        // Friends attending
        if (event.attendees) {
            const friendsAttending = event.attendees.filter((attendeeId: string) =>
                connections.includes(attendeeId)
            );

            if (friendsAttending.length > 0) {
                score += friendsAttending.length * 10;
                reasons.push(`${friendsAttending.length} of your connections are attending`);
            }
        }

        // Past behavior - similar events attended
        const similarEventsAttended = Array.from(interactions.values()).filter(
            (interaction: any) =>
                interaction.attended &&
                interaction.eventType === event.type
        );

        if (similarEventsAttended.length > 0) {
            score += 15;
            reasons.push(`You've enjoyed similar ${event.type} events`);
        }

        // Engagement level
        if (userData.gamification?.level > 3) {
            score += 5; // Active users get priority
        }

        // Time-based boost for soon-starting events
        const eventTime = event.date ? event.date.toDate().getTime() : (event.startTime ? event.startTime.toDate().getTime() : 0);
        const daysUntilEvent = Math.ceil(
            (eventTime - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilEvent <= 7 && daysUntilEvent >= 0) {
            score += 10;
            reasons.push('Starting soon');
        }

        return {
            eventId: event.id,
            score,
            reasons
        };
    }

    // Get user's recommendations
    async getUserRecommendations(userId: string, limitCount: number = 10): Promise<any[]> {
        try {
            const recommendationsQuery = query(
                collection(db, 'eventRecommendations', userId, 'recommendations'),
                orderBy('score', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(recommendationsQuery);

            // Get full event details
            const recommendations = await Promise.all(
                snapshot.docs.map(async (recDoc) => {
                    const rec = recDoc.data();
                    const eventDoc = await getDoc(doc(db, 'events', rec.eventId));

                    return {
                        ...rec,
                        event: eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } : null
                    };
                })
            );

            return recommendations.filter(rec => rec.event !== null);

        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    // Track event interaction
    async trackInteraction(
        userId: string,
        eventId: string,
        interactionType: 'viewed' | 'interested' | 'rsvped' | 'attended',
        rating?: number
    ): Promise<void> {
        try {
            const interactionRef = doc(
                db,
                'userEventInteractions',
                userId,
                'interactions',
                eventId
            );

            const interactionDoc = await getDoc(interactionRef);

            if (!interactionDoc.exists()) {
                await setDoc(interactionRef, {
                    [interactionType]: true,
                    ...(rating && { rating }),
                    lastUpdated: Timestamp.now()
                });
            } else {
                await setDoc(interactionRef, {
                    ...interactionDoc.data(),
                    [interactionType]: true,
                    ...(rating && { rating }),
                    lastUpdated: Timestamp.now()
                }, { merge: true });
            }

            // Regenerate recommendations after interaction
            if (interactionType === 'attended' || interactionType === 'rsvped') {
                await this.generateRecommendations(userId);
            }

        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    }
}

export const eventRecommendationService = new EventRecommendationService();
