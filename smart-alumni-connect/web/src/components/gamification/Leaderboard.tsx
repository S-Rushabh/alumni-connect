
import { useState, useEffect } from 'react';
import { gamificationService } from '../../services/gamification';
import { Card } from '../common/Card';

export function Leaderboard() {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [type, setType] = useState<'overall' | 'byBatch'>('overall');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, [type]);

    const loadLeaderboard = async () => {
        setLoading(true);
        const data = await gamificationService.getLeaderboard(type, undefined, 3);
        setLeaders(data);
        setLoading(false);
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">🏆 Top Performers</h2>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="text-xs font-bold uppercase tracking-wider bg-slate-100 border-none rounded-lg px-3 py-2 text-slate-600 focus:ring-0 cursor-pointer"
                >
                    <option value="overall">All Time</option>
                    {/* <option value="byBatch">By Batch</option> */}
                </select>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {leaders.map((leader, index) => (
                        <div
                            key={leader.userId}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`text-lg font-black w-6 text-center ${index === 0 ? 'text-yellow-500 text-2xl' : index === 1 ? 'text-slate-400 text-xl' : index === 2 ? 'text-amber-700 text-xl' : 'text-slate-400'}`}>
                                    {index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : `${index + 1}`}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                    {leader.photoURL ? (
                                        <img src={leader.photoURL} alt={leader.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">{leader.displayName?.[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{leader.displayName}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                                        {leader.company || 'Alumni'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-indigo-600 text-sm">
                                    {(leader.points || leader.gamification?.totalPoints || 0).toLocaleString()}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">pts</p>
                            </div>
                        </div>
                    ))}
                    {leaders.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No data available</p>}
                </div>
            )}
        </Card>
    );
}
