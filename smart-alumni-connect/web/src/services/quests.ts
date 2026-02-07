import {
    collection,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    increment,
    getDocs,
    query,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Quest, UserQuest, UserProfile } from '../types';

export const QUESTS: Quest[] = [
    // 1. Profile Completion Quests
    {
        id: 'complete_profile',
        title: 'Complete Your Profile',
        description: 'Add your bio, skills, and industry info.',
        points: 50,
        type: 'profile',
        criteria: { type: 'profile_completion' },
        icon: '👤'
    },
    {
        id: 'upload_avatar',
        title: 'Show Your Face',
        description: 'Upload a profile picture.',
        points: 25,
        type: 'profile',
        criteria: { type: 'custom', field: 'photoURL' },
        icon: '📸'
    },

    // 2. Social Quests
    {
        id: 'first_chat',
        title: 'Break the Ice',
        description: 'Start your first conversation with an alumni or student.',
        points: 40,
        type: 'social',
        criteria: { type: 'connection_count', target: 1 },
        icon: '💬'
    },
    {
        id: 'active_networker',
        title: 'Network Builder',
        description: 'Connect with 5 people.',
        points: 100,
        type: 'social',
        criteria: { type: 'connection_count', target: 5 },
        icon: '🤝'
    },

    // 3. Exploration Quests
    {
        id: 'explorer_analytics',
        title: 'Data Enjoyer',
        description: 'Visit the Analytics page to see platform insights.',
        points: 20,
        type: 'exploration',
        criteria: { type: 'page_visit', pageId: 'analytics' },
        icon: '📊'
    },
    {
        id: 'explorer_jobs',
        title: 'Career Hunter',
        description: 'Visit the Jobs board.',
        points: 20,
        type: 'exploration',
        criteria: { type: 'page_visit', pageId: 'jobs' },
        icon: '💼'
    }
];

export const questService = {
    // Get all available quests
    getQuests: async (): Promise<Quest[]> => {
        return QUESTS;
    },

    // Get user's progress on all quests
    getUserQuests: async (userId: string): Promise<UserQuest[]> => {
        const q = query(collection(db, 'users', userId, 'quests'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserQuest);
    },

    // Check and update quest progress
    checkQuest: async (userId: string, questId: string, progressValue: number) => {
        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) return;

        const userQuestRef = doc(db, 'users', userId, 'quests', questId);
        const userQuestSnap = await getDoc(userQuestRef);

        let currentStatus: UserQuest = userQuestSnap.exists()
            ? userQuestSnap.data() as UserQuest
            : {
                questId,
                userId,
                status: 'active',
                progress: 0,
                claimed: false
            };

        if (currentStatus.status === 'completed') return; // Already done

        // Update progress
        let newProgress = progressValue;

        // Check completion
        let isCompleted = false;
        if (quest.criteria.target) {
            if (newProgress >= quest.criteria.target) {
                isCompleted = true;
                newProgress = quest.criteria.target;
            }
        } else {
            // For boolean tasks (like visiting a page), passing 1 means done
            if (newProgress >= 1) isCompleted = true;
        }

        const updates: Partial<UserQuest> = {
            progress: newProgress,
            status: isCompleted ? 'completed' : 'active',
        };

        if (isCompleted && (currentStatus.status as string) !== 'completed') {
            updates.completedAt = Timestamp.now();
            await questService.awardPoints(userId, quest.points);
        }

        await setDoc(userQuestRef, { ...currentStatus, ...updates }, { merge: true });
    },

    // Award points to user
    awardPoints: async (userId: string, points: number) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            "gamification.points": increment(points),
            totalPoints: increment(points) // Supporting both structures if needed
        });
    },

    // Check specific triggers
    trackPageVisit: async (userId: string, pageId: string) => {
        const quests = QUESTS.filter(q => q.type === 'exploration' && q.criteria.pageId === pageId);
        for (const quest of quests) {
            await questService.checkQuest(userId, quest.id, 1);
        }
    },

    checkProfileCompletion: async (userId: string, profile: UserProfile) => {
        // 1. Avatar Quest
        if (profile.photoURL) {
            await questService.checkQuest(userId, 'upload_avatar', 1);
        }

        // 2. Complete Profile Quest
        let score = 0;
        if (profile.bio) score++;
        if (profile.skills && profile.skills.length > 0) score++;
        if (profile.industry) score++;

        // Requires 3 items
        if (score >= 3) {
            await questService.checkQuest(userId, 'complete_profile', 1);
        }
    }
};
