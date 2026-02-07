
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { gamificationService } from './gamification';
import type { ShadowingOpportunity, ShadowingBooking } from '../types';

class ShadowingService {

    // Create shadowing opportunity
    async createOpportunity(opportunity: ShadowingOpportunity): Promise<string> {
        try {
            const opportunityRef = doc(collection(db, 'shadowingOpportunities'));

            await setDoc(opportunityRef, {
                ...opportunity,
                bookedSlots: 0,
                createdAt: Timestamp.now()
            });

            // Award points to alumni for offering shadowing
            await gamificationService.awardPoints(
                opportunity.alumniId,
                'createShadowingOpportunity',
                'Created a shadowing opportunity'
            );

            return opportunityRef.id;

        } catch (error) {
            console.error('Error creating shadowing opportunity:', error);
            throw error;
        }
    }

    // Get all available opportunities
    async getAvailableOpportunities(filters?: {
        industry?: string;
        isVirtual?: boolean;
    }): Promise<ShadowingOpportunity[]> {
        try {
            let opportunitiesQuery = query(
                collection(db, 'shadowingOpportunities'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(opportunitiesQuery);

            let opportunities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ShadowingOpportunity));

            // Filter in JavaScript for simplicity
            if (filters?.industry) {
                opportunities = opportunities.filter(
                    opp => opp.industry === filters.industry
                );
            }

            if (filters?.isVirtual !== undefined) {
                opportunities = opportunities.filter(
                    opp => opp.isVirtual === filters.isVirtual
                );
            }

            // Filter out fully booked opportunities
            opportunities = opportunities.filter(
                opp => opp.bookedSlots < opp.maxSlots
            );

            return opportunities;

        } catch (error) {
            console.error('Error getting opportunities:', error);
            return [];
        }
    }

    // Book a shadowing slot
    async bookShadowing(booking: Omit<ShadowingBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            // Check if opportunity still has slots
            const opportunityDoc = await getDoc(
                doc(db, 'shadowingOpportunities', booking.opportunityId)
            );

            if (!opportunityDoc.exists()) {
                throw new Error('Opportunity not found');
            }

            const opportunity = opportunityDoc.data() as ShadowingOpportunity;

            if (opportunity.bookedSlots >= opportunity.maxSlots) {
                throw new Error('No slots available');
            }

            // Create booking
            const bookingRef = doc(collection(db, 'shadowingBookings'));

            await setDoc(bookingRef, {
                ...booking,
                status: 'pending',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            // Increment booked slots
            await updateDoc(
                doc(db, 'shadowingOpportunities', booking.opportunityId),
                {
                    bookedSlots: increment(1)
                }
            );

            // Award points to student
            await gamificationService.awardPoints(
                booking.studentId,
                'bookShadowing',
                'Booked a shadowing session'
            );

            return bookingRef.id;

        } catch (error) {
            console.error('Error booking shadowing:', error);
            throw error;
        }
    }

    // Confirm a booking (alumni confirms)
    async confirmBooking(bookingId: string): Promise<void> {
        try {
            const bookingRef = doc(db, 'shadowingBookings', bookingId);

            await updateDoc(bookingRef, {
                status: 'confirmed',
                updatedAt: Timestamp.now()
            });

        } catch (error) {
            console.error('Error confirming booking:', error);
            throw error;
        }
    }

    // Complete shadowing session
    async completeShadowing(bookingId: string): Promise<void> {
        try {
            const bookingRef = doc(db, 'shadowingBookings', bookingId);
            const bookingDoc = await getDoc(bookingRef);

            if (!bookingDoc.exists()) {
                throw new Error('Booking not found');
            }

            const booking = bookingDoc.data() as ShadowingBooking;

            await updateDoc(bookingRef, {
                status: 'completed',
                updatedAt: Timestamp.now()
            });

            // Award points to both alumni and student
            await gamificationService.awardPoints(
                booking.alumniId,
                'completeShadowing',
                'Completed a shadowing session'
            );

            await gamificationService.awardPoints(
                booking.studentId,
                'attendShadowing',
                'Attended a shadowing session'
            );

        } catch (error) {
            console.error('Error completing shadowing:', error);
            throw error;
        }
    }

    // Add feedback
    async addFeedback(
        bookingId: string,
        userType: 'student' | 'alumni',
        rating: number,
        comment: string
    ): Promise<void> {
        try {
            const bookingRef = doc(db, 'shadowingBookings', bookingId);
            const bookingDoc = await getDoc(bookingRef);

            if (!bookingDoc.exists()) {
                throw new Error('Booking not found');
            }

            const currentFeedback = bookingDoc.data().feedback || {};

            const updatedFeedback = {
                ...currentFeedback,
                ...(userType === 'student'
                    ? { studentRating: rating, studentComment: comment }
                    : { alumniRating: rating, alumniComment: comment }
                )
            };

            await updateDoc(bookingRef, {
                feedback: updatedFeedback,
                updatedAt: Timestamp.now()
            });

            // Award points for providing feedback
            const userId = userType === 'student'
                ? bookingDoc.data().studentId
                : bookingDoc.data().alumniId;

            await gamificationService.awardPoints(
                userId,
                'provideFeedback',
                'Provided shadowing feedback'
            );

        } catch (error) {
            console.error('Error adding feedback:', error);
            throw error;
        }
    }

    // Get user's bookings
    async getUserBookings(userId: string, userType: 'student' | 'alumni'): Promise<ShadowingBooking[]> {
        try {
            const field = userType === 'student' ? 'studentId' : 'alumniId';

            const bookingsQuery = query(
                collection(db, 'shadowingBookings'),
                where(field, '==', userId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(bookingsQuery);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ShadowingBooking));

        } catch (error) {
            console.error('Error getting user bookings:', error);
            return [];
        }
    }
}

export const shadowingService = new ShadowingService();
