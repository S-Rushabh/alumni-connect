
import { useState, useEffect } from 'react';
import { eventRecommendationService } from '../../services/eventRecommendations';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

interface EventRecommendationsProps {
    currentUser: any;
}

export function EventRecommendations({ currentUser }: EventRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.uid) {
            loadRecommendations();
        }
    }, [currentUser]);

    const loadRecommendations = async () => {
        setLoading(true);
        // Generate fresh recommendations
        await eventRecommendationService.generateRecommendations(currentUser.uid);
        // Fetch them
        const data = await eventRecommendationService.getUserRecommendations(currentUser.uid);
        setRecommendations(data);
        setLoading(false);
    };

    if (loading) return null;
    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>✨</span> Recommended for You
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map(rec => {
                    const event = rec.event;
                    if (!event) return null;

                    return (
                        <Card key={rec.eventId} className="group hover:shadow-xl transition-all border-l-4 border-l-indigo-500 overflow-hidden relative">
                            {/* Background Glow */}
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

                            <div className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                                        {rec.score > 80 ? '🔥 Highly Recommended' : '✨ Recommended'}
                                    </Badge>
                                    <span className="text-xs font-bold text-slate-400">Match {Math.round(rec.score)}%</span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {event.title}
                                </h3>

                                <div className="space-y-2 text-sm text-slate-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">📅</span>
                                        <span>{new Date(event.date.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">📍</span>
                                        <span>{event.location || (event.type === 'virtual' ? 'Virtual' : 'TBD')}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Why this event?</p>
                                    <ul className="text-xs text-slate-600 list-disc list-inside">
                                        {rec.reasons.slice(0, 2).map((reason: string, i: number) => (
                                            <li key={i}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>

                                <button className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all">
                                    View Details
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
