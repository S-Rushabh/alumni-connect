import axios from 'axios';

const API_URL = 'http://localhost:8000';

export interface MatchRequest {
    target_user_id: string;
    user_skills: string[];
}

export interface MentorMatch {
    uid: string;
    name: string;
    company: string;
    skills: string[];
    score: number;
}

export interface MatchResponse {
    user_id: string;
    matches: MentorMatch[];
}

export const getMentorRecommendations = async (userId: string, skills: string[]): Promise<MentorMatch[]> => {
    try {
        const response = await axios.post<MatchResponse>(`${API_URL}/recommend_mentors`, {
            target_user_id: userId,
            user_skills: skills
        });
        return response.data.matches;
    } catch (error) {
        console.error("Error fetching mentor recommendations:", error);
        return [];
    }
};

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const response = await axios.get(`${API_URL}/`);
        return response.status === 200;
    } catch (error) {
        return false;
    }
};
