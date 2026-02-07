
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { gamificationService } from '../../services/gamification';
import { Card } from '../common/Card';

interface BadgeGridProps {
    currentUser: any;
}

export function BadgeGrid({ currentUser }: BadgeGridProps) {
    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [userBadges, setUserBadges] = useState<string[]>([]);

    useEffect(() => {
        loadBadges();
        if (currentUser?.uid) loadUserBadges();
    }, [currentUser]);

    const loadBadges = async () => {
        const badgesSnapshot = await getDocs(collection(db, 'badges'));
        const badges = badgesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setAllBadges(badges);
    };

    const loadUserBadges = async () => {
        const data = await gamificationService.getUserGamification(currentUser.uid);
        if (data) setUserBadges(data.badges || []);
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            {allBadges.map(badge => {
                const isEarned = userBadges.includes(badge.id);

                return (
                    <Card
                        key={badge.id}
                        className={`p-4 text-center transition-all duration-300 group ${isEarned
                            ? 'bg-white border-indigo-100 shadow-md hover:shadow-xl hover:-translate-y-1 relative overflow-hidden'
                            : 'bg-slate-50 border-slate-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                            }`}
                    >
                        {isEarned && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                        )}
                        <div className="text-4xl mb-3 transform transition-transform group-hover:scale-110 duration-300">{badge.icon}</div>
                        <h4 className="font-bold text-slate-900 text-sm">{badge.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{badge.description}</p>
                        <p className={`text-[10px] font-black mt-2 uppercase tracking-wide ${isEarned ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {badge.points} pts
                        </p>
                    </Card>
                );
            })}
        </div>
    );
}
