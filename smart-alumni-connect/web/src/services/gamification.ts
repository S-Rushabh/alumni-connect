
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    increment,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Badge, PointTransaction } from '../types';

interface UserGamification {
    totalPoints: number;
    level: number;
    currentTier: string;
    badges: string[];
    lastUpdated: any;
}

class GamificationService {

    // Award points for an action
    async awardPoints(
        userId: string,
        action: string,
        description?: string
    ): Promise<number> {
        try {
            // Get points configuration
            const configDoc = await getDoc(doc(db, 'pointsConfig', 'actions'));
            // Fallback config if not found
            const pointsConfig = configDoc.exists() ? configDoc.data() : {
                actions: {
                    completeProfile: 100,
                    connectWithAlumni: 50,
                    attendEvent: 75,
                    dailyLogin: 10,
                    weeklyStreak: 50,
                    monthlyStreak: 200,
                    challengeCompleted: 100,
                    challengeReward: 50,
                    createShadowingOpportunity: 150,
                    bookShadowing: 50,
                    completeShadowing: 100,
                    attendShadowing: 100,
                    provideFeedback: 30
                }
            };

            if (!pointsConfig || !pointsConfig.actions[action]) {
                console.warn(`Action ${action} not found in points config, defaulting to 10`);
            }
            const points = pointsConfig?.actions?.[action] || 10;

            // Update user's total points
            const userGamificationRef = doc(db, 'users', userId, 'gamification', 'stats');
            const userGamificationDoc = await getDoc(userGamificationRef);

            if (!userGamificationDoc.exists()) {
                // Initialize gamification for new user
                await setDoc(userGamificationRef, {
                    totalPoints: points,
                    level: 1,
                    currentTier: 'Bronze',
                    badges: [],
                    lastUpdated: Timestamp.now()
                });
            } else {
                // Update existing points
                await updateDoc(userGamificationRef, {
                    totalPoints: increment(points),
                    lastUpdated: Timestamp.now()
                });
            }

            // --- SYNC with Main User Document (for efficient querying) ---
            const userRef = doc(db, 'users', userId);
            // We need to use dot notation for nested field update to not overwrite entire gamification object
            await updateDoc(userRef, {
                'gamification.points': increment(points),
                'points': increment(points) // Sync legacy/top-level field too
            });

            // Record points transaction
            await addDoc(collection(db, 'users', userId, 'pointsHistory'), {
                action,
                points,
                description: description || `Earned ${points} points for ${action}`,
                timestamp: Timestamp.now()
            });

            // Check for level up
            await this.checkLevelUp(userId);

            // Check for new badges
            await this.checkBadges(userId);

            return points;

        } catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }

    // Check and update user level
    async checkLevelUp(userId: string): Promise<void> {
        try {
            const userGamificationRef = doc(db, 'users', userId, 'gamification', 'stats');
            const userGamificationDoc = await getDoc(userGamificationRef);

            if (!userGamificationDoc.exists()) return;

            const userData = userGamificationDoc.data() as UserGamification;
            const totalPoints = userData.totalPoints;

            // Get levels config
            const configDoc = await getDoc(doc(db, 'pointsConfig', 'actions'));
            const levels = configDoc.data()?.levels || [
                { level: 1, name: 'Bronze', minPoints: 0, maxPoints: 499, color: '#CD7F32' },
                { level: 2, name: 'Silver', minPoints: 500, maxPoints: 1499, color: '#C0C0C0' },
                { level: 3, name: 'Gold', minPoints: 1500, maxPoints: 2999, color: '#FFD700' },
                { level: 4, name: 'Platinum', minPoints: 3000, maxPoints: 5999, color: '#E5E4E2' },
                { level: 5, name: 'Diamond', minPoints: 6000, maxPoints: Infinity, color: '#B9F2FF' },
            ];

            // Find current level
            const currentLevel = levels.find((level: any) =>
                totalPoints >= level.minPoints && totalPoints <= level.maxPoints
            );

            if (currentLevel && currentLevel.level !== userData.level) {
                await updateDoc(userGamificationRef, {
                    level: currentLevel.level,
                    currentTier: currentLevel.name
                });

                console.log(`🎉 User ${userId} leveled up to ${currentLevel.name}!`);
            }

        } catch (error) {
            console.error('Error checking level up:', error);
        }
    }

    // Check and award badges
    async checkBadges(userId: string): Promise<void> {
        try {
            // Get user's current badges
            const userGamificationRef = doc(db, 'users', userId, 'gamification', 'stats');
            const userGamificationDoc = await getDoc(userGamificationRef);

            if (!userGamificationDoc.exists()) return;

            const userData = userGamificationDoc.data() as UserGamification;
            const currentBadges = userData.badges || [];

            // Get all badges
            const badgesSnapshot = await getDocs(collection(db, 'badges'));
            const allBadges = badgesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Badge[];

            // Get user stats for badge criteria checking
            const userStats = await this.getUserStats(userId);

            // Check each badge
            for (const badge of allBadges) {
                // Skip if user already has this badge
                if (currentBadges.includes(badge.id)) continue;

                // Check if user meets criteria
                if (this.meetsCriteria(badge.criteria, userStats)) {
                    // Award badge
                    await updateDoc(userGamificationRef, {
                        badges: [...currentBadges, badge.id]
                    });

                    // Award badge points
                    await this.awardPoints(userId, 'badgeEarned', `Earned badge: ${badge.name}`);

                    console.log(`🏅 User ${userId} earned badge: ${badge.name}!`);
                }
            }

        } catch (error) {
            console.error('Error checking badges:', error);
        }
    }

    // Get user statistics for badge checking
    async getUserStats(userId: string): Promise<any> {
        try {
            // Get user profile
            const userDoc = await getDoc(doc(db, 'users', userId));
            const userData = userDoc.data();

            // Get connections count
            const connectionsSnapshot = await getDocs(
                query(
                    collection(db, 'connections'),
                    where('userId', '==', userId),
                    where('status', '==', 'accepted')
                )
            );

            // Get events attended
            // Ideally this should use a collectionGroup query or index, but for now simple query
            // For hackathon, assuming eventAttendees collection exists or stored on event
            // Using workaround if collection doesn't exist
            let eventsCount = 0;
            try {
                const eventsSnapshot = await getDocs(
                    query(
                        collection(db, 'eventAttendees'),
                        where('userId', '==', userId),
                        where('attended', '==', true)
                    )
                );
                eventsCount = eventsSnapshot.size;
            } catch (e) {
                // console.warn("eventAttendees collection might not exist yet");
            }


            // Get donations
            let donationsCount = 0;
            try {
                const donationsSnapshot = await getDocs(
                    query(
                        collection(db, 'donations'),
                        where('donorId', '==', userId)
                    )
                );
                donationsCount = donationsSnapshot.size;
            } catch (e) { }

            return {
                profileCompletion: this.calculateProfileCompletion(userData),
                connections: connectionsSnapshot.size, // Note: This query might be wrong if 'connections' stores requesterId/recipientId
                eventsAttended: eventsCount,
                donations: donationsCount,
            };

        } catch (error) {
            console.error('Error getting user stats:', error);
            return {};
        }
    }

    // Check if user meets badge criteria
    meetsCriteria(criteria: any, userStats: any): boolean {
        if (!criteria) return false;
        for (const [key, value] of Object.entries(criteria)) {
            if (key === 'leaderboardRank') continue;

            if ((userStats[key] || 0) < (value as number)) {
                return false;
            }
        }
        return true;
    }

    // Calculate profile completion percentage
    calculateProfileCompletion(userData: any): number {
        if (!userData) return 0;

        const fields = [
            'displayName',
            'email',
            'graduationYear',
            'role',
            'company',
            'headline',
            'location',
            'bio',
            'photoURL'
        ];

        const completedFields = fields.filter(field =>
            userData[field] && userData[field] !== ''
        ).length;

        return Math.round((completedFields / fields.length) * 100);
    }

    // Get leaderboard
    async getLeaderboard(
        type: 'overall' | 'byBatch' | 'byDepartment' | 'byCity',
        _filterValue?: string,
        limitCount: number = 10
    ): Promise<any[]> {
        try {
            if (type === 'overall') {
                // Fetch users directly. In a real app with millions of users, this needs a specific index:
                // users.orderBy('gamification.points', 'desc')
                // For now, fetching a batch and sorting client-side or using the requested field logic.

                const q = query(collection(db, 'users'), limit(50));
                const snapshot = await getDocs(q);

                const users = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // User requested to display points strictly from the document root, not gamification field
                    const points = data.points || 0;

                    return {
                        userId: doc.id,
                        ...data,
                        points: points, // Explicitly return top-level points
                        gamification: {
                            totalPoints: points, // Keep for backward compatibility if needed
                            ...data.gamification
                        }
                    };
                });

                return users
                    .sort((a: any, b: any) => b.gamification.totalPoints - a.gamification.totalPoints)
                    .slice(0, limitCount)
                    .map((u: any, i: number) => ({ rank: i + 1, ...u }));
            }

            return [];

        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    // Get user's gamification data
    async getUserGamification(userId: string): Promise<UserGamification | null> {
        try {
            const userGamificationRef = doc(db, 'users', userId, 'gamification', 'stats');
            const userGamificationDoc = await getDoc(userGamificationRef);

            if (!userGamificationDoc.exists()) {
                return null;
            }

            return userGamificationDoc.data() as UserGamification;

        } catch (error) {
            console.error('Error getting user gamification:', error);
            return null;
        }
    }

    // Get user's points history
    async getPointsHistory(userId: string, limitCount: number = 20): Promise<PointTransaction[]> {
        try {
            const historyQuery = query(
                collection(db, 'users', userId, 'pointsHistory'),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(historyQuery);

            return snapshot.docs.map(doc => ({
                userId,
                ...doc.data()
            } as PointTransaction));

        } catch (error) {
            console.error('Error getting points history:', error);
            return [];
        }
    }
}

export const gamificationService = new GamificationService();
