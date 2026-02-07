
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { gamificationService } from './gamification';
import type { StreakData } from '../types';

class StreakService {

    async trackLogin(userId: string): Promise<void> {
        try {
            const streakRef = doc(db, 'users', userId, 'streaks', 'login');
            const streakDoc = await getDoc(streakRef);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!streakDoc.exists()) {
                // First login ever
                await setDoc(streakRef, {
                    currentStreak: 1,
                    longestStreak: 1,
                    lastLoginDate: Timestamp.fromDate(today),
                    streakHistory: [today]
                });

                await gamificationService.awardPoints(userId, 'dailyLogin', 'First login!');
                return;
            }

            const streakData = streakDoc.data() as StreakData;
            const lastLogin = streakData.lastLoginDate.toDate();
            lastLogin.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Already logged in today
                return;
            }

            if (daysDiff === 1) {
                // Consecutive day - extend streak
                const newStreak = streakData.currentStreak + 1;

                await updateDoc(streakRef, {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, streakData.longestStreak),
                    lastLoginDate: Timestamp.fromDate(today),
                    streakHistory: [...streakData.streakHistory, today]
                });

                // Award streak bonuses
                await gamificationService.awardPoints(userId, 'dailyLogin', `Day ${newStreak} streak!`);

                // Special milestone bonuses
                if (newStreak === 7) {
                    await gamificationService.awardPoints(userId, 'weeklyStreak', '7-day streak!');
                } else if (newStreak === 30) {
                    await gamificationService.awardPoints(userId, 'monthlyStreak', '30-day streak!');
                }

            } else {
                // Streak broken - reset
                await updateDoc(streakRef, {
                    currentStreak: 1,
                    lastLoginDate: Timestamp.fromDate(today),
                    streakHistory: [today]
                });

                await gamificationService.awardPoints(userId, 'dailyLogin', 'Streak reset, but you\'re back!');
            }

        } catch (error) {
            console.error('Error tracking login streak:', error);
        }
    }

    async getStreakData(userId: string): Promise<StreakData | null> {
        try {
            const streakRef = doc(db, 'users', userId, 'streaks', 'login');
            const streakDoc = await getDoc(streakRef);

            if (!streakDoc.exists()) {
                return null;
            }

            return streakDoc.data() as StreakData;

        } catch (error) {
            console.error('Error getting streak data:', error);
            return null;
        }
    }
}

export const streakService = new StreakService();
