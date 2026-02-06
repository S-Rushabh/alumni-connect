
import React, { useEffect, useState } from 'react';
import { generateDailyBriefing } from '../services/geminiService';
import { Page, Alum } from '../types';
import { MOCK_ALUMNI } from '../constants';

interface Props {
  onNavigate: (page: Page) => void;
  onStartFlashMatch: (alum: Alum) => void;
}

const Dashboard: React.FC<Props> = ({ onNavigate, onStartFlashMatch }) => {
  const [briefing, setBriefing] = useState<string>('Analyzing your network data...');
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);

  useEffect(() => {
    const fetchBriefing = async () => {
      // Check if API key is present in the environment
      const hasKey = !!process.env.API_KEY;
      setIsApiConnected(hasKey);

      const text = await generateDailyBriefing({ 
        name: 'Alex', 
        industry: 'Product Design', 
        interest: 'Fintech and AI' 
      });
      setBriefing(text || '');
      setIsBriefingLoading(false);
    };
    fetchBriefing();
  }, []);

  const handleFlashMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      const randomAlum = MOCK_ALUMNI[Math.floor(Math.random() * MOCK_ALUMNI.length)];
      onStartFlashMatch(randomAlum);
      setIsMatching(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-slate-900 tracking-tighter">Good morning, Alex.</h1>
          <p className="text-slate-500 font-medium">Your personal node in the global alumni matrix is active.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Pulse Status</span>
            <span className="text-emerald-600 flex items-center gap-2 font-black text-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              HIGHLY ACTIVE
            </span>
          </div>
          <div className="bg-slate-900 px-5 py-3 rounded-2xl border border-white/5 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest block mb-1">Neural Link</span>
            <span className={`${isApiConnected ? 'text-indigo-400' : 'text-amber-400'} flex items-center gap-2 font-black text-sm uppercase`}>
              {isApiConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Daily Briefing Card */}
      <section className="bg-white rounded-[2.5rem] p-10 md:p-12 border border-slate-100 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none pointer-events-none">
          <span className="text-[12rem] font-black">AI</span>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">✨</div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Daily Briefing</h2>
            <span className="ml-auto px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase border border-indigo-100 tracking-widest">
              Verified Synthesis
            </span>
          </div>

          {isBriefingLoading ? (
            <div className="space-y-6 max-w-2xl">
              <div className="h-4 bg-slate-50 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-50 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-slate-50 rounded-full w-5/6 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-6 text-slate-600 leading-relaxed text-lg font-light max-w-4xl whitespace-pre-wrap">
              {briefing}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Flash Networking */}
        <div className="bg-white rounded-[2rem] p-8 border border-indigo-100 hover:border-indigo-300 transition-all flex flex-col justify-between min-h-[300px] shadow-sm group relative overflow-hidden">
          {isMatching && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-indigo-600 font-black text-xl tracking-tighter uppercase">Scanning Pulse...</p>
              <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">Syncing with active 'Design' nodes</p>
            </div>
          )}
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-3 text-slate-900 tracking-tight">Flash Match</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Instantly bridge to a verified alum for a high-intensity 5-minute spark chat.</p>
          </div>
          <button 
            disabled={isMatching}
            className="relative z-10 w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-100"
            onClick={handleFlashMatch}
          >
            <span>⚡</span> Connect Node
          </button>
        </div>

        {/* Rapid Stats */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 min-h-[300px] flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-2xl font-black mb-1 text-slate-900 tracking-tight">Global Reach</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Growth Velocity: +12%</p>
          </div>
          <div className="flex-1 flex items-end gap-3 h-32 py-6">
            {[30, 60, 40, 85, 55, 75, 100].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-slate-50 to-indigo-500/20 rounded-xl transition-all duration-1000 group hover:from-indigo-100 hover:to-indigo-500 cursor-help" 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">12 peer nodes initialized this week</p>
        </div>

        {/* Action Center */}
        <div className="bg-slate-950 rounded-[2rem] p-8 border border-white/5 min-h-[300px] shadow-2xl">
          <h3 className="text-xl font-black mb-6 text-white tracking-tight uppercase">Action Center</h3>
          <ul className="space-y-3">
            {[
              { label: 'Verify Certification', icon: '🎓', page: Page.Profile },
              { label: 'Mentorship Request', icon: '🤝', page: Page.MentorshipMatch },
              { label: 'Career Interests', icon: '💼', page: Page.Jobs }
            ].map((task, i) => (
              <li 
                key={i} 
                className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-white/10"
                onClick={() => onNavigate(task.page)}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{task.icon}</span>
                <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors uppercase tracking-widest">{task.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
