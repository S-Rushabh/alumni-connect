import { useState, useEffect } from 'react';
import { questService, QUESTS } from '../../services/quests';
import type { UserQuest } from '../../types';
import { Card } from '../common/Card';
import { CheckCircle, Circle } from 'lucide-react';

interface QuestListProps {
    userId: string;
}

export function QuestList({ userId }: QuestListProps) {
    const [userQuests, setUserQuests] = useState<UserQuest[]>([]);

    useEffect(() => {
        loadQuests();
    }, [userId]);

    const loadQuests = async () => {
        const data = await questService.getUserQuests(userId);
        setUserQuests(data);
    };

    const getQuestStatus = (questId: string) => {
        return userQuests.find(uq => uq.questId === questId);
    };

    return (
        <Card className="p-6 border border-slate-100 shadow-sm relative overflow-hidden">

            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6">
                <span>📜</span> Active Quests
            </h2>

            <div className="space-y-4">
                {QUESTS.map(quest => {
                    const userQuest = getQuestStatus(quest.id);
                    const isCompleted = userQuest?.status === 'completed';
                    const progress = userQuest?.progress || 0;
                    const target = quest.criteria.target || 1;
                    const percent = Math.min((progress / target) * 100, 100);

                    return (
                        <div key={quest.id} className={`p-4 rounded-xl border transition-all duration-300 ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-md'}`}>
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`p-3 rounded-xl text-2xl shadow-sm flex-shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {quest.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className={`font-bold text-sm leading-tight ${isCompleted ? 'text-emerald-900' : 'text-slate-900'}`}>
                                            {quest.title}
                                        </h3>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                                                +{quest.points} pts
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start justify-between gap-2 mt-1">
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                            {quest.description}
                                        </p>
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-slate-200 flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                            {progress} / {target}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
