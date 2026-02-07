
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { gamificationService } from './gamification';
import type { Challenge, UserChallengeProgress } from '../types';

class ChallengeService {

    // Create a new challenge
    async createChallenge(challenge: Omit<Challenge, 'id'>): Promise<string> {
        try {
            const challengeRef = doc(collection(db, 'challenges'));
            await setDoc(challengeRef, {
                ...challenge,
                createdAt: Timestamp.now()
            });

            return challengeRef.id;

        } catch (error) {
            console.error('Error creating challenge:', error);
            throw error;
        }
    }

    // Get active challenges
    async getActiveChallenges(): Promise<Challenge[]> {
        try {
            const now = Timestamp.now();

            const challengesQuery = query(
                collection(db, 'challenges'),
                where('startDate', '<=', now),
                where('endDate', '>=', now)
            );

            const snapshot = await getDocs(challengesQuery);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Challenge));

        } catch (error) {
            console.error('Error getting active challenges:', error);
            return [];
        }
    }

    // Join a challenge
    async joinChallenge(userId: string, challengeId: string): Promise<void> {
        try {
            const userChallengeRef = doc(db, 'users', userId, 'challenges', challengeId); // Note: User guide used top-level 'userChallenges' but nested in users is often better for security rules. User guide used 'userChallenges/{userId}/challenges/{challengeId}'. Let's stick to user guide pattern if it's cleaner, but for security, usually /users/{id}/challenges is better. I'll use /users/{id}/challenges

            await setDoc(userChallengeRef, {
                challengeId,
                progress: 0,
                status: 'active',
                startedAt: Timestamp.now()
            });

        } catch (error) {
            console.error('Error joining challenge:', error);
            throw error;
        }
    }

    // Update challenge progress
    async updateProgress(
        userId: string,
        challengeId: string,
        progressIncrement: number
    ): Promise<void> {
        try {
            // Corrected path to match joinChallenge
            const userChallengeRef = doc(db, 'users', userId, 'challenges', challengeId);
            const userChallengeDoc = await getDoc(userChallengeRef);

            if (!userChallengeDoc.exists()) {
                console.error('User has not joined this challenge');
                return;
            }

            const currentProgress = userChallengeDoc.data().progress || 0;
            const newProgress = currentProgress + progressIncrement;

            // Get challenge details to check completion
            const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
            const challenge = challengeDoc.data() as Challenge;

            const isCompleted = newProgress >= challenge.criteria.target;

            await updateDoc(userChallengeRef, {
                progress: newProgress,
                status: isCompleted ? 'completed' : 'active',
                ...(isCompleted && { completedAt: Timestamp.now() })
            });

            // Award points if completed
            if (isCompleted && userChallengeDoc.data().status !== 'completed') {
                await gamificationService.awardPoints(
                    userId,
                    'challengeCompleted',
                    `Completed challenge: ${challenge.title}`
                );

                // Award challenge reward
                await gamificationService.awardPoints(
                    userId,
                    'challengeReward',
                    `Challenge reward: ${challenge.reward} points`
                );
            }

        } catch (error) {
            console.error('Error updating challenge progress:', error);
        }
    }

    // Get user's challenges
    async getUserChallenges(userId: string): Promise<UserChallengeProgress[]> {
        try {
            // Corrected path
            const userChallengesQuery = collection(db, 'users', userId, 'challenges');
            const snapshot = await getDocs(userChallengesQuery);

            return snapshot.docs.map(doc => ({
                challengeId: doc.id,
                ...doc.data()
            } as UserChallengeProgress));

        } catch (error) {
            console.error('Error getting user challenges:', error);
            return [];
        }
    }
}

export const challengeService = new ChallengeService();
