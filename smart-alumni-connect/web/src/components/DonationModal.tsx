import React, { useState } from 'react';
import { X, Heart, Gift } from 'lucide-react';
import { processDonation } from '../services/user';
import { auth } from '../firebase';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState<number>(100);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleDonate = async () => {
        const finalAmount = customAmount ? parseInt(customAmount) : amount;
        if (!finalAmount || finalAmount <= 0) return;
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            await processDonation(auth.currentUser.uid, finalAmount);
            onSuccess();
            onClose();
            // Reset
            setAmount(100);
            setCustomAmount('');
        } catch (e) {
            console.error(e);
            alert("Failed to process donation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition"
                >
                    <X size={20} />
                </button>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4 text-emerald-100">
                            <Gift size={32} />
                        </div>
                        <h2 className="text-2xl font-bold">Invest in the Future</h2>
                        <p className="text-emerald-100 text-sm mt-2 max-w-xs">Your contribution powers scholarships, mentorship programs, and alumni events.</p>
                    </div>
                </div>

                <div className="p-8">
                    <label className="block text-slate-700 font-bold text-sm mb-4">Select Amount</label>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[25, 50, 100, 250, 500].map((val) => (
                            <button
                                key={val}
                                onClick={() => { setAmount(val); setCustomAmount(''); }}
                                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${amount === val && !customAmount
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-100 hover:border-emerald-200 text-slate-600'
                                    }`}
                            >
                                ${val}
                            </button>
                        ))}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                placeholder="Other"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className={`w-full h-full pl-7 pr-3 rounded-xl border-2 font-bold text-sm outline-none transition-colors ${customAmount ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'
                                    }`}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center gap-3 border border-slate-100">
                        <Heart className="text-rose-500 fill-rose-500" size={20} />
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 font-medium">You are supporting</p>
                            <p className="text-sm font-bold text-slate-900">General Alumni Fund</p>
                        </div>
                        <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600">Change</span>
                    </div>

                    <button
                        onClick={handleDonate}
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? 'Processing...' : `Donate $${customAmount || amount}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
