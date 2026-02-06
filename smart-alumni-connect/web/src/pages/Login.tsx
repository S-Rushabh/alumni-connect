
import React, { useState } from 'react';
import { loginWithEmailPassword } from '../services/auth';

interface Props {
    onLoginSuccess: (user?: any) => void;
    onGoToSignUp: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess, onGoToSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!email || !password) {
                throw new Error("Please enter both email and password.");
            }
            await loginWithEmailPassword(email, password);
            onLoginSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface bg-dot-pattern flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-oxford/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md card-premium p-10 md:p-14 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-oxford rounded-2xl mx-auto mb-6 shadow-premium flex items-center justify-center text-gold text-3xl font-heading font-bold">A</div>
                    <h1 className="font-heading text-3xl font-bold text-oxford tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Access Your Alumni Network</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-4 focus:outline-none transition-all text-text-primary placeholder:text-text-muted"
                            placeholder="e.g. alum@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-4 focus:outline-none transition-all text-text-primary placeholder:text-text-muted"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-alert text-[10px] font-bold text-center uppercase tracking-widest bg-alert/5 py-2 rounded-lg border border-alert/10">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-oxford w-full py-5 uppercase tracking-[0.2em] text-xs mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Access Network'}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-text-muted text-xs font-bold mb-4">New to the network?</p>
                    <button
                        onClick={onGoToSignUp}
                        className="text-oxford font-bold uppercase tracking-widest text-[10px] hover:text-gold transition-colors"
                    >
                        Create Your Profile ↗
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
