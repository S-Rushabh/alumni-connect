
import React from 'react';
import Globe from '../components/Globe';
import { Crown, Sparkles, ChevronRight } from 'lucide-react';

interface Props {
    onStart: () => void;
}

const Landing: React.FC<Props> = ({ onStart }) => {
    return (
        <div className="relative min-h-screen bg-surface bg-dot-pattern flex flex-col items-center justify-center overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-oxford rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                <div className="inline-block px-5 py-2 mb-8 bg-oxford/5 rounded-full text-oxford text-sm font-semibold tracking-wider uppercase border border-oxford/10 flex items-center gap-2 mx-auto w-fit">
                    <Sparkles size={14} /> Elite Global Network <Sparkles size={14} />
                </div>

                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-[1.1] text-oxford">
                    Connect with the <br />
                    <span className="text-gradient">Global Pulse.</span>
                </h1>

                <p className="text-lg md:text-xl text-text-secondary mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                    The ultimate command center for modern alumni. Leverage AI-driven insights,
                    blockchain-verified success, and deep semantic discovery.
                </p>

                <button
                    onClick={onStart}
                    className="btn-oxford group relative px-10 py-5 text-sm uppercase tracking-[0.2em] font-bold rounded-xl overflow-hidden hover:scale-105 transition-all shadow-premium"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-oxford to-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">Enter the Network <ChevronRight size={16} /></span>
                </button>

                <div className="mt-20 relative w-full h-[450px]">
                    <Globe />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md">
                        <div className="glass p-6 rounded-2xl text-left shadow-card">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-gold"><Crown size={20} fill="currentColor" /></span>
                                <p className="text-xs font-bold text-oxford uppercase tracking-widest">Recent Achievement</p>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">Marcus Thorne (Class of '17) just secured $12M Series A for EcoStream in Berlin!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
