
import React, { useState } from 'react';

const VirtualTour: React.FC = () => {
  const [activeTag, setActiveTag] = useState<number | null>(null);

  const memoryTags = [
    { id: 1, x: '80%', y: '30%', label: 'Back Row', prompt: "Remember the view from the back row? Click here to relive the perspective of a silent observer turned industry leader." },
    { id: 2, x: '45%', y: '65%', label: 'Power Hub', prompt: "Hover to see the evolution of the 'low battery' panic—from searching for a lone wall socket to integrated desktop power." },
    { id: 3, x: '25%', y: '45%', label: 'Smart Screen', prompt: "Click here to recall the scratch of chalk; now a canvas for real-time global collaboration." },
    { id: 4, x: '70%', y: '50%', label: 'Horizon View', prompt: "A portal to the same campus skyline you watched during late-night grinds. Click to see how the horizon has changed." }
  ];

  const assets = [
    'Smart Screen Interface - 4K Active',
    'Integrated Desktop AC Power Nodes',
    'Acoustic Ceiling Diffusers',
    'Tiered Amphitheater Ergonomics',
    'Fiber-Ready Network Drops'
  ];

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Campus Vision</h1>
          <p className="text-slate-500 font-medium">Community Virtual Tour & Spatial Reconstruction.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Engine: Online</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Tour Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="relative bg-slate-900 rounded-[3rem] aspect-video overflow-hidden group shadow-2xl border border-white/5">
            {/* Base Image (Simulated Campus Image) */}
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
              alt="Campus Classroom"
            />
            
            {/* Hotspots */}
            {memoryTags.map(tag => (
              <div 
                key={tag.id}
                style={{ top: tag.y, left: tag.x }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                onMouseEnter={() => setActiveTag(tag.id)}
                onMouseLeave={() => setActiveTag(null)}
              >
                <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-2 border-white flex items-center justify-center shadow-xl hover:scale-125 transition-all">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                </button>
                {activeTag === tag.id && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 z-30 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-2 tracking-widest">{tag.label}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{tag.prompt}</p>
                  </div>
                )}
              </div>
            ))}

            {/* AI Narration Overlay */}
            <div className="absolute bottom-8 left-8 right-8 bg-slate-950/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 z-10">
              <p className="text-white text-lg font-light italic leading-relaxed tracking-tight">
                "Welcome back to the seats where your legacy began, now transformed into a high-tech launchpad for the next generation. Gone are the tangles of extension cords... the spirit of curiosity remains."
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">Spatial Reconstruction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 text-sm leading-relaxed">
              <p>
                The classroom is designed as a <strong className="text-slate-900">Modern Tiered Amphitheater</strong>. 
                The layout follows a semi-circular, multi-level arrangement that prioritizes sightlines to the front instructional zone.
              </p>
              <p>
                Integrated power modules are visible at every second seat station. The space utilizes high-lumen LED panel grids 
                and features a signature "Glass Wall" with motorized solar blinds for natural light control.
              </p>
            </div>
          </div>
        </div>

        {/* Specs Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-950 rounded-[3rem] p-10 border border-white/5 shadow-2xl">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-10 flex items-center gap-3">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              Detected Assets
            </h2>
            <div className="space-y-4">
              {assets.map((asset, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.07] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    📡
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">{asset}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 pt-10 border-t border-white/5">
              <p className="text-[9px] text-white/20 font-mono text-center tracking-widest">SYSTEM HASH: 0x82A..F21</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />
             <h3 className="text-sm font-black text-slate-900 mb-4 tracking-tighter">Legacy Contrast</h3>
             <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Chalkboards</span>
                  <span className="text-red-400">Removed</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Integrated Power</span>
                  <span className="text-emerald-400">Added</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Fiber Optic Mesh</span>
                  <span className="text-emerald-400">Operational</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTour;
