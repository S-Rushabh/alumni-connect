
import React, { useState, useEffect } from 'react';
import { enhanceBio } from '../services/geminiService';
import { Alum } from '../types';

interface Props {
  alum?: Alum | null;
  selfUser?: Alum | null;
  onStartChat?: (alum: Alum) => void;
}

const Profile: React.FC<Props> = ({ alum, selfUser, onStartChat }) => {
  const isSelf = !alum;
  const [currentAlum, setCurrentAlum] = useState<any>(alum || selfUser || {
    id: 'placeholder',
    name: "User Not Found",
    role: "Senior Engineer",
    company: "Unknown",
    gradYear: 2000,
    bio: "",
    avatar: "https://picsum.photos/seed/user/200/200",
    skills: [],
    location: "Global",
    industry: "General",
    impact: { mentorshipHours: 0, referrals: 0, pulseLevel: 'New' }
  });
  const [bio, setBio] = useState(currentAlum.bio);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    const targetAlum = alum || selfUser;
    if (targetAlum) {
      setCurrentAlum(targetAlum);
      setBio(targetAlum.bio);
    }
  }, [alum, selfUser]);

  const handleEnhance = async () => {
    if (!isSelf) return;
    setIsEnhancing(true);
    const newBio = await enhanceBio(bio);
    if (newBio) setBio(newBio);
    setIsEnhancing(false);
  };

  const handleVerify = (type: string) => {
    setVerifying(type);
    setTimeout(() => {
      setVerifying(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700 pb-24 md:pt-6">
      
      {/* 1. ELITE HERO SECTION */}
      <section className="relative">
        <div className="h-56 md:h-72 lg:h-80 rounded-[2.5rem] md:rounded-[4rem] bg-slate-950 overflow-hidden relative border border-white/10 shadow-xl z-0">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#4f46e5_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#db2777_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950" />
          </div>
          
          {/* Status Header Area - Top Right Stack for Location & Node Status */}
          <div className="absolute top-6 md:top-10 right-6 md:right-10 flex flex-col items-end gap-3 z-20">
             {/* Location Tag */}
             <div className="px-4 py-2 glass rounded-2xl text-[9px] md:text-[10px] font-bold text-white uppercase tracking-[0.2em] border border-white/20 shadow-lg whitespace-nowrap backdrop-blur-md">
               📍 {currentAlum.location}
             </div>
             
             {/* Node Status Tag - Positioned exactly below location */}
             <div className="px-5 py-2 bg-[#f0fdf4] rounded-full text-[9px] md:text-[10px] font-black text-[#166534] uppercase tracking-[0.2em] border border-[#dcfce7] flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-right-4 duration-500">
                <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse" />
                NODE STATUS: ACTIVE
             </div>
          </div>
        </div>

        <div className="px-4 md:px-14 -mt-16 md:-mt-24 lg:-mt-32 flex flex-col lg:flex-row items-center lg:items-end gap-6 md:gap-10 relative z-10">
          <div className="relative flex-shrink-0">
            <div className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 rounded-[3.5rem] md:rounded-[4.5rem] bg-slate-900 p-1.5 md:p-2 shadow-[0_30px_60px_rgba(0,0,0,0.5)] ring-4 ring-white relative overflow-hidden group hover:scale-105 transition-all duration-700 ease-in-out">
              <img 
                src={currentAlum.avatar} 
                className="w-full h-full rounded-[3.2rem] md:rounded-[4.2rem] object-cover" 
                alt={currentAlum.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity" />
            </div>
            <div className="absolute bottom-1 right-1 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center border-[6px] md:border-[8px] border-white shadow-2xl ring-1 ring-slate-100 group-hover:rotate-12 transition-transform">
              <span className="text-white text-2xl md:text-3xl font-black italic">✓</span>
            </div>
          </div>

          <div className="flex-1 pb-4 md:pb-12 text-center lg:text-left min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8 mb-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gradient tracking-tighter drop-shadow-sm truncate leading-none">
                {currentAlum.name}
              </h1>
              {/* Alumni Year Tag - Restored to its identifier position next to Name */}
              <span className="inline-flex items-center self-center lg:self-auto px-5 py-2 rounded-2xl bg-slate-950 text-white text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] border border-white/10 shadow-xl">
                Alumni {currentAlum.gradYear}
              </span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 text-slate-500 text-xl md:text-3xl font-light tracking-tighter">
              <span className="text-slate-950 font-black">{currentAlum.role}</span>
              <span className="hidden lg:inline text-slate-200 mx-3 text-3xl font-thin opacity-50">/</span>
              <span className="text-indigo-600 font-black uppercase text-lg md:text-2xl tracking-tight">{currentAlum.company}</span>
            </div>
          </div>
          
          <div className="pb-6 md:pb-14 flex flex-col items-center lg:items-end gap-3 md:gap-4 w-full md:w-auto">
            {/* Action buttons with no status tag clutter */}
            {!isSelf && onStartChat && (
              <button 
                onClick={() => onStartChat(currentAlum)}
                className="w-full md:w-auto px-8 md:px-14 py-4 md:py-6 bg-slate-950 text-white font-black rounded-3xl hover:bg-indigo-600 hover:scale-105 transition-all shadow-xl active:scale-95 text-xs md:text-sm uppercase tracking-widest"
              >
                Engage
              </button>
            )}
            {isSelf && (
              <button className="w-full md:w-auto px-8 md:px-14 py-4 md:py-6 bg-white border border-slate-200 text-slate-900 font-black rounded-3xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-xs md:text-sm uppercase tracking-widest">
                Edit Legacy
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD IMPACT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {[
          { label: 'Mentorship Hours', value: currentAlum.impact?.mentorshipHours || '120+', icon: '🤝', color: 'from-blue-500/10 to-indigo-500/10', text: 'text-blue-600', sub: 'Elite Contributor' },
          { label: 'Network Reach', value: currentAlum.impact?.referrals || '10+', icon: '💼', color: 'from-purple-500/10 to-pink-500/10', text: 'text-purple-600', sub: 'Verified Authority' },
          { label: 'Network Pulse', value: currentAlum.impact?.pulseLevel || 'Elite', icon: '⚡', color: 'from-amber-500/10 to-orange-500/10', text: 'text-orange-600', sub: 'High Tier Node' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-700 cursor-default relative overflow-hidden shadow-sm">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 md:mb-3">{stat.label}</p>
              <p className={`text-3xl md:text-5xl font-black ${stat.text} tracking-tighter mb-1 md:mb-2`}>{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{stat.sub}</p>
            </div>
            <span className="text-4xl md:text-6xl grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 relative z-10">{stat.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
          
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 md:mb-16">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter leading-none">Professional Narrative</h2>
                <div className="h-1.5 md:h-2 w-20 md:w-24 bg-indigo-600 rounded-full shadow-lg" />
              </div>
              {isSelf && (
                <button 
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  className="group/btn relative px-8 py-3 md:px-10 md:py-4 bg-slate-950 text-white rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all disabled:opacity-50 shadow-xl w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isEnhancing ? 'Synthesizing...' : '✨ Elevate Bio'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
            {isSelf ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-50/40 border-2 border-transparent focus:border-indigo-500/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-slate-800 min-h-[160px] md:min-h-[200px] focus:outline-none transition-all text-lg md:text-2xl leading-relaxed font-light tracking-tight"
                placeholder="Draft your professional legacy..."
              />
            ) : (
              <p className="text-slate-700 text-xl md:text-3xl leading-relaxed font-light relative z-10 tracking-tight italic">{bio}</p>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 border border-slate-100 shadow-sm overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter leading-none mb-12">Career Architecture</h2>
            <div className="space-y-16 md:space-y-24 relative">
              <div className="absolute left-[27px] md:left-[35px] top-6 bottom-6 w-1 md:w-1.5 bg-slate-50 rounded-full" />
              <div className="relative flex gap-8 md:gap-14 group">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2.5rem] bg-slate-950 flex items-center justify-center text-white z-10 shadow-xl"><span className="text-xl md:text-3xl font-black">◈</span></div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6 mb-2 md:mb-4">
                    <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">{currentAlum.role}</h3>
                    <div className="flex items-center gap-3 md:gap-5">
                      <span className="text-[9px] md:text-[11px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1.5 md:px-6 md:py-2.5 rounded-full border border-indigo-100 tracking-widest">Primary</span>
                      <span className="text-[10px] md:text-sm font-bold text-slate-400">NOW</span>
                    </div>
                  </div>
                  <p className="text-lg md:text-2xl text-indigo-600 font-black mb-4 md:mb-8 tracking-tighter uppercase">{currentAlum.company}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8 md:space-y-12">
          <div className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden group/vault">
            <h2 className="text-[10px] md:text-[12px] font-black text-white/40 uppercase tracking-[0.5em] mb-10 md:mb-14 flex items-center gap-4">Vault Access</h2>
            <div className="space-y-6 md:space-y-8">
              {['Degree', 'Mentor', 'Investor'].map((id, i) => (
                <div key={i} onClick={() => handleVerify(id)} className={`p-5 md:p-7 rounded-[2rem] md:rounded-[3rem] bg-white/[0.03] border border-white/5 flex items-center gap-4 md:gap-6 cursor-pointer hover:bg-white/[0.07] transition-all duration-700 ${verifying === id ? 'animate-pulse scale-105' : ''}`}>
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-2xl md:text-4xl text-indigo-400">🛡️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">{id} Verified</p>
                    <p className="text-[8px] md:text-[10px] text-white/20 truncate font-mono">Polygon ID: 0x71C...492a</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border border-slate-100 shadow-sm">
            <h2 className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Expertise</h2>
            <div className="flex flex-wrap gap-3 md:gap-5">
              {(currentAlum.skills || []).map((skill: string) => (
                <div key={skill} className="px-5 py-3 md:px-7 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 border border-slate-100 text-[11px] md:text-[13px] font-black text-slate-800 hover:bg-slate-950 hover:text-white hover:scale-105 transition-all cursor-default shadow-sm">{skill}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
