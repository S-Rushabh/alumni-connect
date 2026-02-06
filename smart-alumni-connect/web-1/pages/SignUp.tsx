
import React, { useState } from 'react';
import { Alum, EntityType } from '../types';

interface Props {
  onSignUpSuccess: (user: Alum) => void;
  onGoToLogin: () => void;
}

const SignUp: React.FC<Props> = ({ onSignUpSuccess, onGoToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    gradYear: '2024',
    location: '',
    industry: '',
    bio: '',
    avatar: '',
    skills: '',
    password: '',
    confirmPassword: '',
    entityType: 'alumni' as EntityType,
    mentorshipStatus: 'available',
    vibePulse: ''
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const newUser: Alum = {
      id: `user-${Date.now()}`,
      name: formData.name,
      role: formData.role,
      company: formData.company,
      gradYear: parseInt(formData.gradYear),
      location: formData.location,
      industry: formData.industry,
      bio: formData.bio,
      avatar: formData.avatar || `https://picsum.photos/seed/${formData.name}/200/200`,
      skills: formData.skills.split(',').map(s => s.trim()),
      entityType: formData.entityType,
      mentorshipStatus: formData.mentorshipStatus as any,
      vibePulse: formData.vibePulse,
      careerPath: [
        { id: 'start', title: 'Initialized', org: formData.entityType === 'student' ? 'Academic Program' : 'Professional Path', year: formData.gradYear },
        { id: 'curr', title: formData.role, org: formData.company, year: 'Present' }
      ]
    };
    
    onSignUpSuccess(newUser);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-adjust mentorship status defaults based on entity type
    if (name === 'entityType') {
      if (value === 'student') {
        setFormData(prev => ({ ...prev, entityType: 'student' as EntityType, mentorshipStatus: 'seeking' }));
      } else {
        setFormData(prev => ({ ...prev, entityType: value as EntityType, mentorshipStatus: 'available' }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px] opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-50 rounded-full blur-[100px] opacity-60" />

      <div className="w-full max-w-4xl bg-white rounded-[4rem] p-10 md:p-16 border border-gray-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 leading-none text-gradient">Initialize Legacy Node</h1>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">Broadcast your professional existence to the elite global alumni network. All data is structured for high-performance indexing.</p>
          </div>
          <button 
            onClick={onGoToLogin}
            className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 pb-1 hover:border-indigo-600 transition-all"
          >
            Existing Entity? Login
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {/* Identity Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Identity Category</label>
              <select name="entityType" value={formData.entityType} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner appearance-none text-sm font-bold text-slate-900">
                <option value="student">Current Student</option>
                <option value="alumni">Graduate / Alumni</option>
                <option value="teacher">Faculty / Teacher</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Full Name</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder="Alex Rivera" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Professional Role / Major</label>
              <input required name="role" value={formData.role} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder={formData.entityType === 'student' ? "e.g. Computer Science Major" : "e.g. Senior Product Designer"} />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">{formData.entityType === 'student' ? 'Institution' : 'Current Company'}</label>
              <input required name="company" value={formData.company} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder={formData.entityType === 'student' ? "Tech Institute" : "Uniswap Labs"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Grad Year</label>
                <input required type="number" name="gradYear" value={formData.gradYear} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder="2018" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Location</label>
                <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder="NY, USA" />
              </div>
            </div>
          </div>

          {/* Context & Auth Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Mentorship Pulse</label>
              <select name="mentorshipStatus" value={formData.mentorshipStatus} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner appearance-none text-sm font-bold text-indigo-600">
                <option value="available">Open to Mentor</option>
                <option value="seeking">Seeking Mentorship</option>
                <option value="none">Not Active</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Lightning Match Vibe (Text Seed)</label>
              <input name="vibePulse" value={formData.vibePulse} onChange={handleChange} className="w-full bg-indigo-50/50 border-2 border-indigo-100 focus:border-indigo-500/20 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm italic" placeholder="e.g. Ambitious, tech-focused, looking for design growth..." />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Industry Vertical</label>
              <select required name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner appearance-none text-sm">
                <option value="">Select Industry</option>
                <option value="Tech">Technology / Software</option>
                <option value="Design">Design / Creative</option>
                <option value="Finance">Finance / Fintech</option>
                <option value="Green Tech">Green Tech / Energy</option>
                <option value="Medicine">Medicine / Biotech</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Access Key</label>
                <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Confirm Key</label>
                <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder="••••••••" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Expertise Tags</label>
              <input name="skills" value={formData.skills} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all shadow-inner text-sm" placeholder="React, TypeScript, Figma" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2 pt-2">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Professional Narrative (Bio)</label>
            <textarea required name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500/10 rounded-[2rem] px-8 py-5 focus:outline-none transition-all shadow-inner min-h-[100px] text-sm" placeholder="Explain your professional arc and elite impact..."></textarea>
          </div>

          <div className="md:col-span-2 pt-6">
            <button 
              type="submit"
              className="w-full bg-slate-950 text-white font-black py-6 rounded-[2.5rem] uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-indigo-600 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-4 group"
            >
              🚀 Initialize Entity Node
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
