export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'student' | 'alumni' | 'admin' | 'teacher'; // Added teacher
    bio?: string;
    skills?: string[];
    graduationYear?: number;
    // Extended fields for web-1 compatibility
    company?: string;
    location?: string;
    industry?: string;
    mentorshipStatus?: 'available' | 'seeking' | 'none';
    vibePulse?: string;
    careerPath?: any[]; // Simplified for now
    entityType?: 'student' | 'alumni' | 'teacher';

    points?: number;
    badges?: string[];
    verification?: {
        isVerified: boolean;
        certificateHash?: string; // Simulated Blockchain Hash
        issuedAt?: any;
    };
    gamification?: {
        points: number;
        badges: string[];
    };
}

export interface Job {
    id?: string;
    title: string;
    company: string;
    location: string;
    description: string;
    requirements?: string[];
    postedBy: string; // User UID
    postedByName?: string; // Denormalized for easy display
    createdAt: any; // Firestore Timestamp
    applicants?: string[]; // Array of User UIDs
    // web-1 fields
    referralProb?: number;
    missingSkills?: string[];
}

export interface Event {
    id?: string;
    title: string;
    date: any; // Firestore Timestamp or string
    location?: string; // Optional in web-1? No, web-1 has no location prop in interface but maybe used?
    // web-1 event interface: { id, title, date, type, description }
    type?: 'virtual' | 'physical';
    description: string;
    organizer?: string;
    attendees?: string[]; // Array of User UIDs
}

export interface ChatMessage {
    id?: string;
    senderId: string;
    text: string;
    timestamp: any;
}

export interface Chat {
    id?: string;
    participants: string[]; // [uid1, uid2]
    lastMessage?: string;
    updatedAt?: any;
}

// --- Web-1 Types for UI Integration ---

export enum Page {
    Landing = 'landing',
    Login = 'login',
    SignUp = 'signup',
    Dashboard = 'dashboard',
    Directory = 'directory',
    Profile = 'profile',
    Jobs = 'jobs',
    Events = 'events',
    Networking = 'networking',
    Analytics = 'analytics'
}

export type EntityType = 'student' | 'alumni' | 'teacher';

export interface CareerNode {
    id: string;
    title: string;
    org: string;
    year: string;
}

export interface Alum {
    id: string;
    name: string;
    role: string;
    company: string;
    company_logo?: string; // Added to match some UI usages likely
    location: string;
    gradYear: number;
    industry: string;
    skills: string[];
    bio: string;
    avatar: string;
    careerPath: CareerNode[];
    entityType?: EntityType;
    mentorshipStatus?: 'available' | 'seeking' | 'none';
    vibePulse?: string;
    email?: string; // Added for compatibility
}

// Extend existing Job/Event interfaces to support both legacy and new UI
// Note: In a real refactor we would merge these properties fully.
export interface JobExtended extends Job {
    referralProb?: number;
    missingSkills?: string[];
}
// For now, we are just adding the new fields to the main interface via intersection or optional props
// Let's modify the original interfaces above instead of creating new ones to avoid conflicts.

