import axios from 'axios';

const API_URL = 'http://localhost:8000';

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

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview | null> => {
    try {
        const response = await axios.get<AnalyticsOverview>(`${API_URL}/analytics/overview`);
        return response.data;
    } catch (error) {
        console.error("Error fetching analytics overview:", error);
        return null;
    }
};

export const analyzeSkillGap = async (
    userSkills: string[],
    jobRequirements: string[],
    userConnections: number = 0
): Promise<SkillGapAnalysis | null> => {
    try {
        const response = await axios.post<SkillGapAnalysis>(`${API_URL}/analyze_skill_gap`, {
            user_skills: userSkills,
            job_requirements: jobRequirements,
            user_connections: userConnections
        });
        return response.data;
    } catch (error) {
        console.error("Error analyzing skill gap:", error);
        return null;
    }
};

export const getRecommendedAttendees = async (
    eventType: string,
    eventIndustry?: string,
    userSkills?: string[]
): Promise<AttendeeRecommendation | null> => {
    try {
        const response = await axios.post<AttendeeRecommendation>(`${API_URL}/recommend_attendees`, {
            event_type: eventType,
            event_industry: eventIndustry,
            user_skills: userSkills
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching recommended attendees:", error);
        return null;
    }
};
