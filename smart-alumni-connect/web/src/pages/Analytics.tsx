import React, { useEffect, useState } from 'react';
import { getAnalyticsOverview, type AnalyticsOverview } from '../services/analytics';
import { AlumniHeatMap } from '../components/analytics/HeatMap';
import { DonationCalendarHeatmap } from '../components/analytics/DonationCalendarHeatmap';
import { Leaderboard } from '../components/gamification/Leaderboard';
import { Network, TrendingUp, Users, DollarSign, Activity, Globe, Award, Share2, Heart } from 'lucide-react';
import { DonationModal } from '../components/DonationModal';
import { seedDonationData } from '../services/user';

// --- Components ---

const StatCard: React.FC<{
    label: string;
    value: string | number;
    subtext?: string;
    icon: React.ReactNode;
    color: 'indigo' | 'emerald' | 'blue' | 'purple';
}> = ({ label, value, subtext, icon, color }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    return (
        <div className={`card-premium p-6 group relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
            {/* Background Accent */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${colorClasses[color].replace('text-', 'bg-')}`} />

            <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]} bg-white/50 backdrop-blur-sm shadow-sm`}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
                    {subtext && <span className="text-xs text-slate-400 font-medium mt-1">{subtext}</span>}
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

const Analytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'1M' | '6M' | '1Y'>('1Y');
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true); // Show loading state on range change
            const data = await getAnalyticsOverview(timeRange);
            setAnalytics(data);
            setIsLoading(false);
        };
        fetchAnalytics();
    }, [timeRange]);

    const handleSeedData = async () => {
        if (confirm("This will overwrite/seed donation data for random users. Continue?")) {
            await seedDonationData();
            alert("Seeding complete! Refreshing analytics...");
            const data = await getAnalyticsOverview(timeRange);
            setAnalytics(data);
        }
    };

    // --- Export Logic ---
    const handleExport = () => {
        if (!analytics) return;

        const headers = ["Metric", "Value"];
        const rows = [
            ["Active Nodes", analytics.total_users],
            ["Active This Week", analytics.active_this_week],
            ["Growth %", `${analytics.growth_percentage}%`],
            ["Donation Prediction", `$${analytics.donation_prediction}M`],
            ["Top Industry", analytics.recommended_campaign_target.sector],
            ["Target Class", analytics.recommended_campaign_target.class_year],
            ["", ""],
            ["Top Locations", ""],
            ...analytics.top_locations.map(l => [l.city, l.count]),
            ["", ""],
            ["Industry Distribution", ""],
            ...analytics.industry_distribution.map(i => [i.sector, i.count])
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `analytics_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <DonationModal
                isOpen={isDonationModalOpen}
                onClose={() => setIsDonationModalOpen(false)}
                onSuccess={() => {
                    alert("Thank you for your donation!");
                    getAnalyticsOverview(timeRange).then(setAnalytics);
                }}
            />

            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Activity size={20} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Intelligence</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">Predictive network analytics & operational metrics</p>
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    <button
                        onClick={handleSeedData}
                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition h-10"
                    >
                        Seed Donations
                    </button>

                    <button
                        onClick={async () => {
                            if (confirm("Generate 100 dummy users? This might take a few seconds.")) {
                                await import('../services/seeder').then(m => m.seedUsers(100));
                                alert("Users seeded! Refresh the page to see changes.");
                            }
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition h-10"
                    >
                        Seed Users
                    </button>

                    <button
                        onClick={() => setIsDonationModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-200 flex items-center gap-2 h-10"
                    >
                        <Heart size={14} className="fill-white" />
                        Donate
                    </button>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 flex items-center gap-2 h-10"
                    >
                        <Share2 size={14} />
                        Export
                    </button>

                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm h-10">
                        {(['1M', '6M', '1Y'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === t
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-gray-50'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Active Nodes"
                    value={analytics?.total_users || 0}
                    subtext="+12% from last month"
                    icon={<Users size={20} />}
                    color="indigo"
                />
                <StatCard
                    label="Global Reach"
                    value={Object.keys(analytics?.top_locations || {}).length}
                    subtext="Cities activated"
                    icon={<Globe size={20} />}
                    color="blue"
                />
                <StatCard
                    label="Endowment Yield"
                    value={`$${analytics?.donation_prediction || 0}M`}
                    subtext="AI Predicted Pipeline"
                    icon={<DollarSign size={20} />}
                    color="emerald"
                />
                <StatCard
                    label="Prime Sector"
                    value={analytics?.recommended_campaign_target?.sector || 'N/A'}
                    subtext="Highest density vertical"
                    icon={<Award size={20} />}
                    color="purple"
                />
            </div>

            {/* Main Viz Grid - Maps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Global Map - Network Topology */}
                <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h3 className="text-white font-bold text-xl flex items-center gap-2">
                                <Network className="text-indigo-400" size={20} />
                                Network Topology
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">Real-time alumni distribution & active signaling connectivity.</p>
                        </div>
                        <button className="text-xs text-indigo-300 font-bold border border-indigo-300/30 px-3 py-1 rounded-full hover:bg-indigo-300/10 transition">
                            Expand View
                        </button>
                    </div>

                    <div className="relative w-full rounded-2xl border border-white/5 overflow-hidden">
                        <AlumniHeatMap type="distribution" />
                    </div>
                </div>

                {/* Capital Velocity Map (Now Contribution Graph) */}
                <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h3 className="text-white font-bold text-xl flex items-center gap-2">
                                <TrendingUp className="text-emerald-400" size={20} />
                                Donation Velocity
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">Daily contribution density over the last year.</p>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-white">${analytics?.donation_prediction || 0}M</span>
                            <span className="text-xs font-bold text-emerald-400 mb-1.5">+8.4%</span>
                        </div>
                    </div>

                    <div className="relative w-full rounded-2xl border border-white/5 bg-slate-900/50 p-4 overflow-hidden">
                        {/* Calendar Heatmap */}
                        <DonationCalendarHeatmap data={analytics?.dailyDonations || []} />
                    </div>
                </div>

            </div>

            {/* Bottom Row Charts & Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">

                {/* Growth Velocity Chart */}
                <div className="card-premium p-6 relative overflow-hidden lg:col-span-1 flex flex-col h-full">
                    <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2 mb-4">
                        <Activity className="text-blue-500" size={16} />
                        Growth Velocity
                    </h3>
                    <div className="flex-1 w-full min-h-[160px]">
                        <svg viewBox="0 0 500 200" className="w-full h-full text-blue-500">
                            <defs>
                                <linearGradient id="gradientGrowth" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {analytics?.weekly_activity && analytics.weekly_activity.length > 0 ? (
                                <>
                                    <path
                                        d={`M0,200 ${analytics.weekly_activity.map((val, i) => `L${(i / (analytics.weekly_activity.length - 1)) * 500},${200 - (val * 2)}`).join(' ')} L500,200 Z`}
                                        fill="url(#gradientGrowth)"
                                    />
                                    <path
                                        d={`M0,200 ${analytics.weekly_activity.map((val, i) => `L${(i / (analytics.weekly_activity.length - 1)) * 500},${200 - (val * 2)}`).join(' ')}`}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </>
                            ) : null}
                        </svg>
                    </div>
                </div>

                {/* Sector Dominance */}
                <div className="card-premium p-6 relative overflow-hidden lg:col-span-1 flex flex-col h-full justify-center">
                    <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2 mb-4">
                        <Award className="text-purple-500" size={16} />
                        Sector Dominance
                    </h3>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <foreignObject width="100" height="100">
                                    <div
                                        className="w-full h-full rounded-full"
                                        style={{
                                            background: `conic-gradient(
                                                #6366f1 0% ${analytics?.industry_distribution?.[0] ? (analytics.industry_distribution[0].count / (analytics.total_users || 1) * 100) : 0}%,
                                                #8b5cf6 0% ${analytics?.industry_distribution?.[1] ? (analytics.industry_distribution[1].count / (analytics.total_users || 1) * 100 + (analytics.industry_distribution[0].count / (analytics.total_users || 1) * 100)) : 0}%,
                                                #ec4899 0% 100%
                                            )`
                                        }}
                                    />
                                </foreignObject>
                                <circle cx="50" cy="50" r="30" fill="white" />
                            </svg>
                        </div>
                        <div className="flex-1 space-y-1">
                            {analytics?.industry_distribution?.slice(0, 3).map((sector, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 truncate max-w-[80px]">{sector.sector}</span>
                                    <span className="text-xs font-bold text-slate-900">{sector.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="lg:col-span-1 h-full">
                    <Leaderboard />
                </div>
            </div>

        </div>
    );
};

export default Analytics;
