
import { useState, useEffect } from 'react';
import { streakService } from '../../services/streak';

interface StreakDisplayProps {
    currentUser: any;
}

export function StreakDisplay({ currentUser }: StreakDisplayProps) {
    const [streakData, setStreakData] = useState<any>(null);

    useEffect(() => {
        if (currentUser?.uid) {
            loadStreakData();
        }
    }, [currentUser]);

    const loadStreakData = async () => {
        const data = await streakService.getStreakData(currentUser.uid);
        setStreakData(data);
    };

    if (!streakData) return null;

    return (
        <div className="bg-gradient-to-r from-orange-400 to-rose-500 text-white p-6 rounded-[2rem] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                <span className="text-9xl">🔥</span>
            </div>
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-4xl animate-pulse">🔥</span>
                        <h3 className="text-4xl font-black tracking-tighter">{streakData.currentStreak}</h3>
                    </div>
                    <p className="text-white/90 font-bold uppercase tracking-widest text-xs">Day Streak</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full">
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Best: {streakData.longestStreak} days</span>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold">Keep it going!</p>
                    <p className="text-xs text-white/70 mt-1">Log in daily to maintain</p>
                </div>
            </div>
        </div>
    );
}
