
export type EntityType = 'student' | 'alumni' | 'teacher';

export interface Alum {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  gradYear: number;
  industry: string;
  skills: string[];
  bio: string;
  avatar: string;
  careerPath: CareerNode[];
  entityType?: EntityType;
  mentorshipStatus?: 'available' | 'seeking' | 'none';
  vibePulse?: string; // Pre-filled vibe text for the matching engine
}

export interface CareerNode {
  id: string;
  title: string;
  org: string;
  year: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  referralProb: number;
  missingSkills: string[];
  description: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  type: 'virtual' | 'physical';
  description: string;
}

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
  Analytics = 'analytics',
  MentorshipMatch = 'mentorship'
}
