
import React from 'react';
import Globe from '../components/Globe';

interface Props {
  onStart: () => void;
}

const Landing: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-400 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div className="inline-block px-4 py-1.5 mb-6 bg-indigo-50 rounded-full text-indigo-600 text-sm font-semibold tracking-wider uppercase border border-indigo-100">
          Elite Global Network
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight leading-none text-slate-900">
          Connect with the <br />
          <span className="text-gradient">Global Pulse.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          The ultimate command center for modern alumni. Leverage AI-driven insights, 
          blockchain-verified success, and deep semantic discovery.
        </p>

        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-slate-900 text-white font-bold rounded-xl overflow-hidden hover:scale-105 transition-all shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 group-hover:text-white transition-colors">Enter the Network</span>
        </button>

        <div className="mt-20 relative w-full h-[500px]">
          <Globe />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 text-left shadow-2xl">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Recent Achievement</p>
              <p className="text-sm text-slate-700">Marcus Thorne (Class of '17) just secured $12M Series A for EcoStream in Berlin! 🚀</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
