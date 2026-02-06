
import React, { useState } from 'react';
import { Alum } from '../types';

interface Props {
  onLoginSuccess: (user: Alum) => void;
  onGoToSignUp: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess, onGoToSignUp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Divyam' && password === 'Pass123') {
      // Create a default alum object for the logged-in user
      const loggedInUser: Alum = {
        id: 'user-divyam',
        name: "Divyam",
        role: "Senior Engineering Lead",
        company: "Innovation Labs",
        gradYear: 2020,
        bio: "Passionate about full-stack architectures and elite UI/UX design. Building the next generation of networking platforms.",
        avatar: "https://picsum.photos/seed/divyam/200/200",
        skills: ['React', 'TypeScript', 'Node.js', 'System Architecture'],
        location: "Delhi, IN",
        industry: "Technology",
        careerPath: []
      };
      onLoginSuccess(loggedInUser);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[100px] opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-50 rounded-full blur-[100px] opacity-60" />
      
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 md:p-14 border border-gray-100 shadow-[0_30px_80px_rgba(0,0,0,0.05)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl mx-auto mb-6 shadow-lg shadow-indigo-100 flex items-center justify-center text-white text-3xl font-black italic">A</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Identify Yourself to Access the Node</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-4 focus:outline-none transition-all text-slate-900 shadow-inner placeholder:text-slate-300"
              placeholder="e.g. Divyam"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-4 focus:outline-none transition-all text-slate-900 shadow-inner placeholder:text-slate-300"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-slate-950 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-indigo-600 transition-all hover:scale-[1.02] active:scale-95 mt-4"
          >
            Decrypt Access
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-xs font-bold mb-4">New to the network?</p>
          <button 
            onClick={onGoToSignUp}
            className="text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:text-indigo-700 transition-colors"
          >
            Create Your Identity Node ↗
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
