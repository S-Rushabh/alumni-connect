
import React, { useEffect, useState } from 'react';
import { generateDailyBriefing } from '../services/geminiService';
import { Page, type UserProfile } from '../types';
import { getAllUsers } from '../services/user';
import { checkBackendHealth, getMentorRecommendations } from '../services/backend';
import { getAnalyticsOverview, type AnalyticsOverview } from '../services/analytics';

interface Props {
    onNavigate: (page: any) => void;
    onStartFlashMatch?: (alum: UserProfile) => void;
    currentUser?: UserProfile | null;
}

const Dashboard: React.FC<Props> = ({ onNavigate, onStartFlashMatch, currentUser }) => {
    const [briefing, setBriefing] = useState<string>('Analyzing your network data...');
    const [isBriefingLoading, setIsBriefingLoading] = useState(true);
    const [isMatching, setIsMatching] = useState(false);
    const [isApiConnected, setIsApiConnected] = useState(false);
    const [randomAlumni, setRandomAlumni] = useState<UserProfile[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

    useEffect(() => {
        const initDashboard = async () => {
            const isBackendUp = await checkBackendHealth();
            setIsApiConnected(isBackendUp);

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

            const users = await getAllUsers();
            setRandomAlumni(users);

            // Fetch real analytics data
            const analyticsData = await getAnalyticsOverview();
            if (analyticsData) {
                setAnalytics(analyticsData);
            }
        };
        initDashboard();
    }, []);

    const handleFlashMatch = async () => {
        setIsMatching(true);
        const recommendations = await getMentorRecommendations("current_user_id", ["React", "Python"]);

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
                const randomAlum = randomAlumni[Math.floor(Math.random() * randomAlumni.length)];
                if (onStartFlashMatch) onStartFlashMatch(randomAlum);
            } else {
                alert("No alumni found to match with!");
            }
        }
        setIsMatching(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2 text-oxford tracking-tight">Good morning.</h1>
                    <p className="text-text-secondary font-medium">Your personal node in the global alumni matrix is active.</p>
                </div>
                <div className="card-premium px-5 py-3 flex flex-col justify-center">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Pulse Status</span>
                    <span className={`${isApiConnected ? 'text-success' : 'text-amber-500'} flex items-center gap-2 font-bold text-sm`}>
                        <span className={`w-2 h-2 ${isApiConnected ? 'bg-success' : 'bg-amber-500'} rounded-full animate-pulse`} />
                        {isApiConnected ? 'CONNECTED' : 'CONNECTING...'}
                    </span>
                </div>
            </header>

            {/* Daily Briefing Card */}
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

                {/* Rapid Stats */}
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
                            { label: 'Verify Certification', icon: '🎓', page: Page.Profile },
                            { label: 'Network Connections', icon: '🤝', page: Page.Networking },
                            { label: 'Career Interests', icon: '💼', page: Page.Jobs }
                        ].map((task, i) => (
                            <li
                                key={i}
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-gold/20"
                                onClick={() => onNavigate(task.page)}
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">{task.icon}</span>
                                <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{task.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
