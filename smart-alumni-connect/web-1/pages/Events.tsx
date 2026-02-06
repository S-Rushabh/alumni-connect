
import React, { useState } from 'react';
import { MOCK_EVENTS } from '../constants';

const Events: React.FC = () => {
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
  const [isRegistering, setIsRegistering] = useState<string | null>(null);

  const handleRSVP = (id: string) => {
    setIsRegistering(id);
    setTimeout(() => {
      setRsvpedIds(prev => new Set([...prev, id]));
      setIsRegistering(null);
    }, 1000);
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community</h1>
          <p className="text-slate-500">Events that turn classmates into colleagues.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MOCK_EVENTS.map(event => (
          <div key={event.id} className="relative group">
            <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-[40px] opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="relative bg-white rounded-3xl p-8 border border-gray-100 h-full flex flex-col shadow-sm group-hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {event.type}
                </span>
                <span className="text-slate-400 font-bold text-sm">{event.date}</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</h2>
              <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed">{event.description}</p>
              
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl mb-6">
                <h3 className="text-[10px] font-bold text-indigo-600 uppercase mb-3 tracking-widest">AI Smart Seats</h3>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${i+10}/40/40`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700">+12</div>
                </div>
              </div>

              <button 
                onClick={() => !rsvpedIds.has(event.id) && handleRSVP(event.id)}
                disabled={isRegistering === event.id}
                className={`w-full font-bold py-3 rounded-xl transition-all shadow-lg ${
                  rsvpedIds.has(event.id) 
                    ? 'bg-emerald-500 text-white cursor-default' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isRegistering === event.id ? 'Registering...' : rsvpedIds.has(event.id) ? '✓ Registered' : 'RSVP Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
