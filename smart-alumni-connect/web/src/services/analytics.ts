import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAllUsers } from "./user";
import type { UserProfile } from "../types";

export interface AnalyticsOverview {
    total_users: number;
    active_this_week: number;
    growth_percentage: number;
    weekly_activity: number[];
    top_locations: Array<{ city: string; count: number }>;
    graduation_distribution: Record<string, number>;
    donation_prediction: number;
    recommended_campaign_target: {
        class_year: number;
        sector: string;
    };
}

export interface SkillGapAnalysis {
    missing_skills: string[];
    matching_skills: string[];
    skill_match_percentage: number;
    referral_probability: number;
    recommendation: string;
}

export interface RecommendedAttendee {
    uid: string;
    name: string;
    avatar: string | null;
    role: string;
    company: string;
}

export interface AttendeeRecommendation {
    recommended_attendees: RecommendedAttendee[];
    total_interested: number;
    match_reason: string;
}

// Helper to normalize city names
const normalizeCity = (location?: string): string => {
    if (!location) return 'Unknown';
    // Simple heuristic: take the first part of "City, Country"
    const city = location.split(',')[0].trim();
    return city || 'Unknown';
};

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview | null> => {
    try {
        // 1. Fetch all users for aggregations
        const users = await getAllUsers();
        const total_users = users.length;

        // 2. Fetch presence for active users calculation
        const presenceRef = collection(db, 'user_presence');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const activeQuery = query(presenceRef, where('lastSeen', '>=', Timestamp.fromDate(oneWeekAgo)));
        const activeSnapshot = await getDocs(activeQuery);
        const active_this_week = activeSnapshot.size;

        // 3. Calculate Locations
        const locationCounts: Record<string, number> = {};
        users.forEach(user => {
            const city = normalizeCity(user.location);
            if (city !== 'Unknown') {
                locationCounts[city] = (locationCounts[city] || 0) + 1;
            }
        });

        const top_locations = Object.entries(locationCounts)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        // 4. Graduation Distribution
        const graduation_distribution: Record<string, number> = {};
        users.forEach(user => {
            if (user.graduationYear) {
                const year = user.graduationYear.toString();
                graduation_distribution[year] = (graduation_distribution[year] || 0) + 1;
            }
        });

        // 5. Donation Prediction (Heuristic logic)
        // Assume 5% of alumni donate avg $500
        const alumniCount = users.filter(u => u.role === 'alumni').length;
        const donation_prediction = Math.round((alumniCount * 0.05 * 500) / 1000) / 10; // in Millions, e.g. 0.5M

        // 6. Recommended Target (Largest grouping)
        let maxGradCount = 0;
        let maxGradYear = 2020;
        Object.entries(graduation_distribution).forEach(([year, count]) => {
            if (count > maxGradCount) {
                maxGradCount = count;
                maxGradYear = parseInt(year);
            }
        });

        // Most common industry
        const industryCounts: Record<string, number> = {};
        users.forEach(user => {
            if (user.industry) {
                industryCounts[user.industry] = (industryCounts[user.industry] || 0) + 1;
            }
        });
        const topIndustry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Technology';

        // 7. Mock growth/activity for now (hard to calculate without historical snapshots)
        // We could store daily snapshots or just return static small growth
        const growth_percentage = 12.5;
        const weekly_activity = [10, 25, 40, 30, 60, 80, 50]; // Mock curve

        return {
            total_users,
            active_this_week,
            growth_percentage,
            weekly_activity,
            top_locations,
            graduation_distribution,
            donation_prediction, // stored as number (e.g. 2.4 for $2.4M) implies formatting needs check
            // API returned number. analytics.tsx formats it: ${analytics.donation_prediction || 2.4}M
            // So if I return 0.5, it shows $0.5M. Correct.
            recommended_campaign_target: {
                class_year: maxGradYear,
                sector: topIndustry
            }
        };

    } catch (error) {
        console.error("Error calculating analytics:", error);
        return null;
    }
};

export const analyzeSkillGap = async (
    userSkills: string[],
    jobRequirements: string[],
    userConnections: number = 0
): Promise<SkillGapAnalysis | null> => {
    // Client-side implementation
    try {
        const userSkillsLower = userSkills.map(s => s.toLowerCase());
        const missing_skills = jobRequirements.filter(req => !userSkillsLower.includes(req.toLowerCase()));
        const matching_skills = jobRequirements.filter(req => userSkillsLower.includes(req.toLowerCase()));

        const matchRatio = jobRequirements.length > 0 ? matching_skills.length / jobRequirements.length : 0.5;
        const skill_match_percentage = Math.round(matchRatio * 100);

        const networkBonus = Math.min(userConnections * 2, 30);
        const referral_probability = Math.min(Math.round(skill_match_percentage * 0.7 + networkBonus), 95);

        let recommendation = "Consider Upskilling";
        if (referral_probability > 70) recommendation = "Strong Match";
        else if (referral_probability > 50) recommendation = "Good Potential";

        return {
            missing_skills,
            matching_skills,
            skill_match_percentage,
            referral_probability,
            recommendation
        };

    } catch (error) {
        console.error("Error analyzing skill gap:", error);
        return null;
    }
};

export const getRecommendedAttendees = async (
    eventType: string,
    eventIndustry?: string
): Promise<AttendeeRecommendation | null> => {
    try {
        const users = await getAllUsers();

        // Filter users
        let candidates = users.filter(u => u.role !== 'student'); // Prefer alumni for attendees generally? Or anyone.

        if (eventIndustry) {
            const industryMatches = candidates.filter(u => u.industry?.toLowerCase().includes(eventIndustry.toLowerCase()));
            if (industryMatches.length > 0) candidates = industryMatches;
        }

        // Rank by relevance (simple random shuffle for now or skill match)
        // Implementing simple shuffle
        const shuffled = candidates.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5).map(u => ({
            uid: u.uid,
            name: u.displayName || 'Alumni Member',
            avatar: u.photoURL || null,
            role: u.role,
            company: u.company || 'N/A'
        }));

        return {
            recommended_attendees: selected,
            total_interested: Math.floor(candidates.length * 0.4) + selected.length, // Mock interest
            match_reason: `Based on ${eventIndustry || eventType} alignment`
        };

    } catch (error) {
        console.error("Error getting recommended attendees:", error);
        return null;
    }
};
