

import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

import type { ShadowingOpportunity } from '../../types';

interface ShadowingOpportunityCardProps {
    opportunity: ShadowingOpportunity;
    onBook: (opportunityId: string) => void;
}

export function ShadowingOpportunityCard({
    opportunity,
    onBook
}: ShadowingOpportunityCardProps) {
    const slotsAvailable = opportunity.maxSlots - opportunity.bookedSlots;

    return (
        <Card className="p-6 hover:shadow-lg transition-all group border-l-4 border-l-teal-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{opportunity.position}</h3>
                    <p className="text-slate-600 font-medium text-sm">{opportunity.company}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                            {opportunity.industry}
                        </Badge>
                    </div>
                </div>

                <div className="text-right">
                    {opportunity.isVirtual ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            🌐 Virtual
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-500 border-slate-200">
                            📍 {opportunity.location?.city}
                        </Badge>
                    )}
                </div>
            </div>

            <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                {opportunity.description}
            </p>

            <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                <div className="flex flex-wrap gap-2">
                    {opportunity.requirements.map((req: string, index: number) => (
                        <span
                            key={index}
                            className="text-[10px] font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-600"
                        >
                            {req}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div>
                    <p className="text-xs font-bold text-slate-700">
                        {slotsAvailable} slot{slotsAvailable !== 1 ? 's' : ''} available
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {opportunity.availableDates?.length || 0} date options
                    </p>
                </div>

                <button
                    onClick={() => opportunity.id && onBook(opportunity.id)}
                    disabled={slotsAvailable === 0 || !opportunity.id}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${slotsAvailable === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-teal-600 hover:scale-105 shadow-lg'
                        }`}
                >
                    {slotsAvailable === 0 ? 'Full' : 'Book Slot'}
                </button>
            </div>
        </Card>
    );
}
