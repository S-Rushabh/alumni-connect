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
    headline?: string; // e.g. "Senior Software Engineer" or "CS Student"
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
        level?: number;
        rank?: number;
        currentTier?: string;
    };
    // Donation fields
    totalDonations?: number;
    lastDonationDate?: any; // Firestore Timestamp
    donationHistory?: { date: any; amount: number; }[]; // Added for calendar heatmap
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
    // New fields for enhanced Opportunity page
    jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
    applyUrl?: string;
}

export interface Event {
    id?: string;
    title: string;
    date: any; // Firestore Timestamp or string
    location?: string;
    type?: 'virtual' | 'physical';
    description: string;
    organizer?: string; // User UID
    organizerName?: string;
    attendees?: string[]; // Array of User UIDs
    attendeeDetails?: EventAttendee[]; // Denormalized for display
    createdAt?: any;
    category?: string; // 'Networking', 'Career', 'Social', 'Workshop', 'Conference'
    capacity?: number; // Max attendees (optional)
    imageUrl?: string; // Event banner image
    tags?: string[]; // Searchable tags
    isRecurring?: boolean;
    recurringPattern?: 'weekly' | 'monthly';
    feedbackEnabled?: boolean;
}

export interface EventAttendee {
    uid: string;
    name: string;
    photoURL?: string;
    role?: string;
    company?: string;
    rsvpedAt?: any; // Timestamp
}

export interface EventFeedback {
    id?: string;
    eventId: string;
    userId: string;
    userName: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: any;
}

// Networking & Connections
export interface Connection {
    id?: string;
    requesterId: string;
    requesterName: string;
    requesterPhoto?: string;
    requesterRole?: string;
    requesterCompany?: string;
    recipientId: string;
    recipientName: string;
    recipientPhoto?: string;
    recipientRole?: string;
    recipientCompany?: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string; // Optional intro message
    createdAt: any;
    respondedAt?: any;
}

export interface UserPresence {
    uid: string;
    status: 'online' | 'offline' | 'away';
    lastSeen: any;
}

export interface MessageReaction {
    id?: string;
    userId: string;
    userName: string;
    reaction: string; // emoji
    createdAt: any;
}

export interface NetworkingStats {
    totalConnections: number;
    messagesSent: number;
    messagesReceived: number;
    responseRate: number; // percentage
    connectionGrowth: { date: string; count: number }[];
    mostActiveConnections: { uid: string; name: string; messageCount: number }[];
}

export interface ChatMessage {
    id?: string;
    senderId: string;
    text: string;
    timestamp: any;
    // Enhanced fields
    type?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    readBy?: string[]; // Array of user IDs who read the message
    reactions?: { [emoji: string]: string[] }; // Reaction users
}

export interface Chat {
    id?: string;
    participants: string[]; // [uid1, uid2]
    lastMessage?: string;
    updatedAt?: any;
}

// --- Web-1 Types for UI Integration ---

export const Page = {
    Landing: 'landing',
    Login: 'login',
    SignUp: 'signup',
    Dashboard: 'dashboard',
    Directory: 'directory',
    Profile: 'profile',
    Jobs: 'jobs',
    Events: 'events',
    Networking: 'networking',
    Analytics: 'analytics'
} as const;

export type Page = typeof Page[keyof typeof Page];

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

// --- Job Application and Referral Types ---

export interface JobApplication {
    id?: string;
    jobId: string;
    jobTitle: string;
    jobCompany: string;
    applicantUid: string;
    applicantName: string;
    applicantEmail: string;
    phoneNumber: string;
    resumeUrl?: string;
    coverLetter: string;
    createdAt: any; // Firestore Timestamp
    status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

export interface ReferralRequest {
    id?: string;
    jobId: string;
    jobTitle: string;
    jobCompany: string;
    requesterId: string;
    requesterName: string;
    referrerId: string; // Job poster or alumni who can refer
    referrerName: string;
    message?: string;
    createdAt: any; // Firestore Timestamp
    status: 'pending' | 'accepted' | 'rejected';
}

// --- Gamification Types ---

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'profile' | 'networking' | 'mentorship' | 'donation' | 'events' | 'achievement' | 'engagement';
    criteria: any;
    points: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'uncommon';
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    points: number;
    type: 'profile' | 'social' | 'exploration' | 'daily';
    criteria: {
        type: 'profile_completion' | 'message_count' | 'connection_count' | 'page_visit' | 'custom';
        target?: number;
        field?: string; // For profile fields
        pageId?: string; // For exploration
    };
    icon: string;
}

export interface UserQuest {
    questId: string;
    userId: string;
    status: 'active' | 'completed';
    progress: number;
    completedAt?: any; // Timestamp
    claimed: boolean;
}

export interface PointTransaction {
    userId: string;
    action: string;
    points: number;
    description: string;
    timestamp: any;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: any;
    streakHistory: any[];
}

// --- Challenge Types ---

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly' | 'special';
    criteria: { action: string; target: number };
    reward: number;
    startDate: any;
    endDate: any;
    icon: string;
}

export interface UserChallengeProgress {
    challengeId: string;
    progress: number;
    status: 'active' | 'completed' | 'failed';
    startedAt: any;
    completedAt?: any;
}

// --- Shadowing Types ---

export interface ShadowingOpportunity {
    id?: string;
    alumniId: string;
    company: string;
    position: string;
    industry: string;
    description: string;
    availableDates: any[]; // Timestamps
    maxSlots: number;
    bookedSlots: number;
    requirements: string[];
    location: {
        city: string;
        address?: string;
    };
    isVirtual: boolean;
    createdAt?: any;
}

export interface ShadowingBooking {
    id?: string;
    opportunityId: string;
    alumniId: string;
    studentId: string;
    selectedDate: any;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    feedback?: {
        studentRating: number;
        studentComment: string;
        alumniRating: number;
        alumniComment: string;
    };
    createdAt?: any;
    updatedAt?: any;
}

// --- Heatmap Types ---

export interface LocationData {
    city: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    alumniCount: number;
    avgEngagement: number;
    avgSuccessScore: number;
    totalDonations?: number; // Added
    topIndustries: string[];
}

// --- Event Recommendation Types ---

export interface EventRecommendation {
    eventId: string;
    score: number;
    reasons: string[];
    event?: Event; // Hydrated event
}
