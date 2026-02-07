import { useState, useEffect } from 'react';
import { challengeService } from '../../services/challenges';
import { Card } from '../common/Card';

interface ChallengesListProps {
    currentUser: any;
}

export function ChallengesList({ currentUser }: ChallengesListProps) {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [userChallenges, setUserChallenges] = useState<any[]>([]);

    useEffect(() => {
        loadChallenges();
    }, [currentUser]);

    const loadChallenges = async () => {
        const activeChallenges = await challengeService.getActiveChallenges();
        setChallenges(activeChallenges);

        if (currentUser?.uid) {
            const userProgress = await challengeService.getUserChallenges(currentUser.uid);
            setUserChallenges(userProgress);
        }
    };

    const handleJoinChallenge = async (challengeId: string) => {
        if (!currentUser?.uid) return;

        await challengeService.joinChallenge(currentUser.uid, challengeId);
        await loadChallenges();
    };

    const getChallengeProgress = (challengeId: string) => {
        return userChallenges.find(uc => uc.challengeId === challengeId);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🎯</span> Active Challenges
            </h2>

            {challenges.length === 0 && (
                <p className="text-slate-400 text-sm">No active challenges available right now.</p>
            )}

            {challenges.map(challenge => {
                const progress = getChallengeProgress(challenge.id);
                const isJoined = !!progress;
                const progressPercent = isJoined
                    ? Math.min((progress.progress / challenge.criteria.target) * 100, 100)
                    : 0;

                return (
                    <Card key={challenge.id} className="p-5 border-l-4 border-l-indigo-500 overflow-hidden relative">
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="flex items-start gap-4">
                                <span className="text-3xl bg-slate-50 p-2 rounded-xl">{challenge.icon}</span>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">{challenge.title}</h3>
                                    <p className="text-slate-500 text-xs mt-1">{challenge.description}</p>
                                    <p className="text-xs mt-2 inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">
                                        +{challenge.reward} pts
                                    </p>
                                </div>
                            </div>

                            {!isJoined && (
                                <button
                                    onClick={() => handleJoinChallenge(challenge.id)}
                                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors uppercase tracking-wider"
                                >
                                    Join
                                </button>
                            )}
                        </div>

                        {isJoined && (
                            <div className="relative z-10">
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                                    <span>Progress: {progress.progress} / {challenge.criteria.target}</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                                </div>

                                {progress.status === 'completed' && (
                                    <p className="text-green-600 font-bold text-xs mt-2 flex items-center gap-1">
                                        ✅ Challenge Completed!
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
