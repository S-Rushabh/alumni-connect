import { useEffect, useState } from 'react';
import { gamificationService } from '../../services/gamification';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface PointsDisplayProps {
    currentUser: any;
}

export function PointsDisplay({ currentUser }: PointsDisplayProps) {
    const [gamificationData, setGamificationData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.uid) {
            loadGamificationData();
        }
    }, [currentUser]);

    const loadGamificationData = async () => {
        try {
            const data = await gamificationService.getUserGamification(currentUser.uid);
            setGamificationData(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-24 bg-slate-100 rounded-xl"></div>;
    if (!gamificationData) return null;

    const { totalPoints, level, currentTier } = gamificationData;

    return (
        <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalPoints?.toLocaleString()}</h3>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Points</p>
                </div>
                <div className="text-right">
                    <Badge variant="default" className="text-sm px-4 py-1.5 bg-indigo-600">
                        Level {level}
                    </Badge>
                    <p className="text-xs text-indigo-600 font-bold mt-1 uppercase tracking-widest">{currentTier}</p>
                </div>
            </div>
        </Card>
    );
}
