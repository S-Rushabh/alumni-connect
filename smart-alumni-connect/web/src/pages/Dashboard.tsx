
import React, { useEffect, useState } from 'react';
import { generateDailyBriefing } from '../services/geminiService';
import { Page, type UserProfile, type Event, type Job } from '../types';
import { getAllUsers } from '../services/user';
import { checkBackendHealth, getMentorRecommendations } from '../services/backend';
import { getAnalyticsOverview, type AnalyticsOverview } from '../services/analytics';
import { getEvents } from '../services/events';
import { getJobs } from '../services/jobs';
import { getRecentConnections } from '../services/chat';

interface Props {
    onNavigate: (page: any) => void;
    onStartFlashMatch?: (alum: UserProfile) => void;
    onStartChat?: (alum: UserProfile) => void;
    currentUser?: UserProfile | null;
}

const Dashboard: React.FC<Props> = ({ onNavigate, onStartFlashMatch, onStartChat, currentUser }) => {
    const [briefing, setBriefing] = useState<string>('Analyzing your network data...');
    const [isBriefingLoading, setIsBriefingLoading] = useState(true);
    const [isMatching, setIsMatching] = useState(false);
    const [isApiConnected, setIsApiConnected] = useState(false);
    const [randomAlumni, setRandomAlumni] = useState<UserProfile[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
    const [recentEvents, setRecentEvents] = useState<Event[]>([]);
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);
    const [recentConnections, setRecentConnections] = useState<UserProfile[]>([]);

    useEffect(() => {
        const initDashboard = async () => {
            // Check backend health
            const isBackendUp = await checkBackendHealth();
            setIsApiConnected(isBackendUp);

            // Generate AI briefing
            const text = await generateDailyBriefing({
                name: currentUser?.displayName || 'Alumni',
                industry: currentUser?.industry || 'Technology',
                interest: 'Innovation & Career Growth',
                skills: currentUser?.skills,
                role: currentUser?.role,
                company: currentUser?.company
            });
            setBriefing(text || '');
            setIsBriefingLoading(false);

            // Fetch all users for random fallback
            const users = await getAllUsers();
            setRandomAlumni(users);

            // Get 3 recent connections from actual chat history
            const chatConnections = await getRecentConnections(currentUser?.uid || '');
            let recentConns = chatConnections.map(c => c.user);

            // Fallback to random users if no recent connections (for new users)
            if (recentConns.length === 0) {
                const otherUsers = users.filter(u => u.uid !== currentUser?.uid);
                recentConns = otherUsers.slice(0, 3);
            }
            setRecentConnections(recentConns);

            // Fetch real analytics data
            const analyticsData = await getAnalyticsOverview();
            if (analyticsData) {
                setAnalytics(analyticsData);
            }

            // Fetch recent events
            const events = await getEvents();
            setRecentEvents(events.slice(0, 2));

            // Fetch recent jobs
            const jobs = await getJobs();
            setRecentJobs(jobs.slice(0, 2));
        };
        initDashboard();
    }, [currentUser]);

    const handleFlashMatch = async () => {
        setIsMatching(true);
        const userSkills = currentUser?.skills || ["React", "Python"];
        const recommendations = await getMentorRecommendations(currentUser?.uid || "current_user_id", userSkills);

        if (recommendations.length > 0) {
            const match = recommendations[0];
            const matchedProfile: UserProfile = {
                uid: match.uid,
                displayName: match.name,
                email: null,
                photoURL: null,
                role: 'alumni',
                company: match.company,
                skills: match.skills,
                bio: `Matched with ${match.score}% compatibility score based on AI analysis.`,
            } as UserProfile;

            if (onStartFlashMatch) onStartFlashMatch(matchedProfile);
        } else {
            if (randomAlumni.length > 0) {
                const otherAlumni = randomAlumni.filter(u => u.uid !== currentUser?.uid);
                if (otherAlumni.length > 0) {
                    const randomAlum = otherAlumni[Math.floor(Math.random() * otherAlumni.length)];
                    if (onStartFlashMatch) onStartFlashMatch(randomAlum);
                }
            } else {
                alert("No alumni found to match with!");
            }
        }
        setIsMatching(false);
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2 text-oxford tracking-tight">
                        {getGreeting()}, {currentUser?.displayName?.split(' ')[0] || 'Alumni'}.
                    </h1>
                    <p className="text-text-secondary font-medium">Your personal node in the global alumni matrix is active.</p>
                </div>
                <div className="flex gap-4">
                    <div className="card-premium px-5 py-3 flex flex-col justify-center">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Pulse Status</span>
                        <span className={`${isApiConnected ? 'text-success' : 'text-amber-500'} flex items-center gap-2 font-bold text-sm`}>
                            <span className={`w-2 h-2 ${isApiConnected ? 'bg-success' : 'bg-amber-500'} rounded-full animate-pulse`} />
                            {isApiConnected ? 'CONNECTED' : 'CONNECTING...'}
                        </span>
                    </div>
                    <div className="card-premium px-5 py-3 flex flex-col justify-center">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Your Tier</span>
                        <span className="text-gold flex items-center gap-2 font-bold text-sm">
                            <span>👑</span> {currentUser?.vibePulse || 'Elite'}
                        </span>
                    </div>
                </div>
            </header>

            {/* AI Daily Briefing Card */}
            <section className="card-premium p-10 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none pointer-events-none">
                    <span className="text-[10rem] font-heading font-bold text-oxford">AI</span>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-oxford rounded-xl flex items-center justify-center text-gold text-xl">✨</div>
                        <h2 className="text-xl font-bold text-oxford tracking-tight">AI Daily Briefing</h2>
                        <span className="ml-auto px-3 py-1 bg-oxford/5 rounded-full text-[10px] font-bold text-oxford uppercase border border-oxford/10 tracking-widest">
                            Today's Trends
                        </span>
                    </div>

                    {isBriefingLoading ? (
                        <div className="space-y-4 max-w-2xl">
                            <div className="h-4 bg-surface-secondary rounded-full w-3/4 animate-pulse" />
                            <div className="h-4 bg-surface-secondary rounded-full w-full animate-pulse" />
                        </div>
                    ) : (
                        <div className="text-text-secondary leading-relaxed text-lg max-w-4xl">
                            {briefing}
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Network Size', value: analytics?.total_users || randomAlumni.length, icon: '👥', change: `+${analytics?.growth_percentage || 12}%` },
                    { label: 'Active Events', value: recentEvents.length || 4, icon: '📅', change: 'This week' },
                    { label: 'Job Postings', value: recentJobs.length || 5, icon: '💼', change: 'Available' },
                    { label: 'Connections', value: recentConnections.length || 3, icon: '🤝', change: 'Recent' },
                ].map((stat, i) => (
                    <div key={i} className="card-premium p-5 hover:border-gold/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{stat.icon}</span>
                            <span className="text-[10px] font-bold text-success uppercase">{stat.change}</span>
                        </div>
                        <p className="text-3xl font-bold text-oxford">{stat.value}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Flash Networking */}
                <div className="card-premium p-8 hover:border-gold/30 transition-all flex flex-col justify-between min-h-[280px] group relative overflow-hidden">
                    {isMatching && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                            <div className="w-14 h-14 border-4 border-oxford border-t-transparent rounded-full animate-spin mb-6" />
                            <p className="text-oxford font-bold text-lg tracking-tight uppercase">Scanning Pulse...</p>
                            <p className="text-xs text-text-muted mt-2 font-medium">Syncing with active nodes</p>
                        </div>
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-gold text-2xl">⚡</span>
                            <h3 className="text-xl font-bold text-oxford tracking-tight">Flash Match</h3>
                        </div>
                        <p className="text-text-secondary leading-relaxed">Instantly connect with a verified alum for a high-intensity 5-minute spark chat.</p>
                    </div>
                    <button
                        disabled={isMatching}
                        className="btn-oxford relative z-10 w-full py-4 uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3"
                        onClick={handleFlashMatch}
                    >
                        Connect Node
                    </button>
                </div>

                {/* Global Reach Stats */}
                <div className="card-premium p-8 min-h-[280px] flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-oxford tracking-tight">Global Reach</h3>
                        <p className="text-text-muted text-xs font-bold uppercase tracking-widest">
                            Growth Velocity: +{analytics?.growth_percentage || 12}%
                        </p>
                    </div>
                    <div className="flex-1 flex items-end gap-2 h-28 py-4">
                        {(analytics?.weekly_activity || [30, 60, 40, 85, 55, 75, 100]).map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-surface-secondary to-oxford/20 rounded-lg transition-all duration-500 hover:from-gold/20 hover:to-oxford cursor-help"
                                style={{ height: `${h}%` }}
                                title={`Day ${i + 1}: ${h}% activity`}
                            />
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        {analytics?.total_users || randomAlumni.length} verified nodes active
                    </p>
                </div>

                {/* Action Center */}
                <div className="bg-oxford rounded-2xl p-8 min-h-[280px] shadow-premium">
                    <h3 className="text-lg font-bold mb-5 text-white tracking-tight uppercase flex items-center gap-2">
                        <span className="text-gold">👑</span> Action Center
                    </h3>
                    <ul className="space-y-2">
                        {[
                            { label: 'Verify Certification', icon: '🎓', page: Page.Profile, desc: 'Complete your profile' },
                            { label: 'Network Connections', icon: '🤝', page: Page.Networking, desc: `${recentConnections.length} online now` },
                            { label: 'Career Interests', icon: '💼', page: Page.Jobs, desc: `${recentJobs.length} new opportunities` }
                        ].map((task, i) => (
                            <li
                                key={i}
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-gold/20"
                                onClick={() => onNavigate(task.page)}
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">{task.icon}</span>
                                <div className="flex-1">
                                    <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors block">{task.label}</span>
                                    <span className="text-[10px] text-white/40">{task.desc}</span>
                                </div>
                                <span className="text-white/30 group-hover:text-gold transition-colors">→</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Recent Activity & Upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Connections */}
                <div className="card-premium p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-oxford tracking-tight">Recent Connections</h3>
                        <button onClick={() => onNavigate(Page.Directory)} className="text-xs font-bold text-gold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentConnections.length > 0 ? recentConnections.map((user, i) => (
                            <div key={user.uid || i} className="flex items-center gap-4 p-3 bg-surface-secondary/50 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer" onClick={() => {
                                if (onStartChat) {
                                    onStartChat(user);
                                } else {
                                    onNavigate(Page.Directory);
                                }
                            }}>
                                <div className="w-12 h-12 rounded-xl bg-oxford text-gold flex items-center justify-center font-bold text-lg">
                                    {getInitials(user.displayName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-oxford truncate">{user.displayName}</p>
                                    <p className="text-xs text-text-muted truncate">{user.role} at {user.company || 'Alumni Network'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-success uppercase">Active</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-text-muted text-sm">No recent connections yet.</p>
                        )}
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="card-premium p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-oxford tracking-tight">Upcoming Events</h3>
                        <button onClick={() => onNavigate(Page.Events)} className="text-xs font-bold text-gold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentEvents.length > 0 ? recentEvents.map((event, i) => (
                            <div key={event.id || i} className="flex items-center gap-4 p-3 bg-surface-secondary/50 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer" onClick={() => onNavigate(Page.Events)}>
                                <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold text-xl">
                                    📅
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-oxford truncate">{event.title}</p>
                                    <p className="text-xs text-text-muted truncate">
                                        {typeof event.date === 'string' ? event.date : new Date(event.date?.seconds * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-oxford/5 text-oxford text-[10px] font-bold uppercase rounded-full border border-oxford/10">
                                    {event.type || 'Virtual'}
                                </span>
                            </div>
                        )) : (
                            <p className="text-text-muted text-sm">No upcoming events.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-oxford/5 rounded-2xl p-6 border border-oxford/10">
                <div className="flex flex-wrap gap-4 justify-center">
                    {[
                        { label: 'Browse Directory', icon: '📖', page: Page.Directory },
                        { label: 'Post a Job', icon: '💼', page: Page.Jobs },
                        { label: 'View Analytics', icon: '📊', page: Page.Analytics },
                        { label: 'Start Networking', icon: '💬', page: Page.Networking },
                    ].map((action, i) => (
                        <button
                            key={i}
                            onClick={() => onNavigate(action.page)}
                            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl font-bold text-oxford hover:bg-oxford hover:text-white transition-all shadow-sm hover:shadow-lg text-sm"
                        >
                            <span>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

