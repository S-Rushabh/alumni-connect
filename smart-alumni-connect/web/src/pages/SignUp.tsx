

import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { registerWithEmailPassword } from '../services/auth';
import { AadhaarVerificationStep } from '../components/auth/AadhaarVerificationStep';

interface Props {
    onSignUpSuccess: (user: any) => void;
    onGoToLogin: () => void;
}

/**
 * 2-Step Sign Up Flow:
 * 1. Aadhaar Verification
 * 2. Registration Form
 */
const SignUp: React.FC<Props> = ({ onSignUpSuccess, onGoToLogin }) => {
    // START: Add state for flow control
    const [step, setStep] = useState<'verify' | 'register'>('verify');
    const [verifiedName, setVerifiedName] = useState('');
    // END

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
        email: '',
        password: '',
        confirmPassword: '',
        entityType: 'alumni' as 'alumni' | 'student' | 'teacher',
        mentorshipStatus: 'available',
        vibePulse: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // START: Handler for successful verification
    const handleVerificationSuccess = (data: { name: string }) => {
        setVerifiedName(data.name);
        setFormData(prev => ({ ...prev, name: data.name })); // Use verified name
        setStep('register');
    };
    // END

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match.');
            }
            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters.');
            }
            if (!formData.email) {
                throw new Error('Email is required.');
            }

            const profileData: Partial<UserProfile> = {
                displayName: formData.name, // Will be verified name
                role: formData.entityType,
                company: formData.company,
                graduationYear: parseInt(formData.gradYear),
                location: formData.location,
                industry: formData.industry,
                bio: formData.bio,
                headline: formData.role, // Use Professional Role as headline
                photoURL: formData.avatar || `https://picsum.photos/seed/${formData.name}/200/200`,
                skills: formData.skills.split(',').map(s => s.trim()),
                entityType: formData.entityType,
                mentorshipStatus: formData.mentorshipStatus as any,
                vibePulse: formData.vibePulse,
                careerPath: [
                    { id: 'start', title: 'Initialized', org: formData.entityType === 'student' ? 'Academic Program' : 'Professional Path', year: formData.gradYear },
                    { id: 'curr', title: formData.role, org: formData.company, year: 'Present' }
                ],
                // Add a flag for verification if you want
                // isVerified: true 
            };

            const user = await registerWithEmailPassword(formData.email, formData.password, profileData);
            onSignUpSuccess(user);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'entityType') {
            if (value === 'student') {
                setFormData(prev => ({ ...prev, entityType: 'student', mentorshipStatus: 'seeking' }));
            } else {
                setFormData(prev => ({ ...prev, entityType: value as any, mentorshipStatus: 'available' }));
            }
        }
    };

    return (
        <div className="min-h-screen bg-surface bg-dot-pattern flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-oxford/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/10 rounded-full blur-[120px]" />

            {/* STEP 1: VERIFICATION */}
            {step === 'verify' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
                    <div className="flex justify-end max-w-2xl mx-auto mb-4">
                        <button onClick={onGoToLogin} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                            Already have an account? Login
                        </button>
                    </div>
                    <AadhaarVerificationStep onVerified={handleVerificationSuccess} />
                </div>
            )}

            {/* STEP 2: REGISTRATION FORM */}
            {step === 'register' && (
                <div className="w-full max-w-4xl card-premium p-10 md:p-14 relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                        <div className="max-w-md">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Verified</span>
                            </div>
                            <h1 className="font-heading text-3xl md:text-4xl font-bold text-oxford tracking-tight mb-2 leading-tight">Complete Registration</h1>
                            <p className="text-text-secondary leading-relaxed text-sm">Welcome, <span className="font-bold text-slate-900">{verifiedName}</span>. Create your profile to join.</p>
                        </div>
                        <button
                            onClick={onGoToLogin}
                            className="text-xs font-bold text-oxford uppercase tracking-widest border-b-2 border-oxford/20 pb-1 hover:border-oxford transition-all"
                        >
                            Already a member? Login
                        </button>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-alert/5 border border-alert/10 rounded-2xl text-alert text-[10px] font-bold uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                        {/* Identity Info */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Identity Category</label>
                                <select name="entityType" value={formData.entityType} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all appearance-none text-sm font-semibold text-text-primary">
                                    <option value="student">Current Student</option>
                                    <option value="alumni">Graduate / Alumni</option>
                                    <option value="teacher">Faculty / Teacher</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-green-50/50 border-2 border-green-100 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm font-medium text-slate-700 cursor-not-allowed"
                                    placeholder="Alex Rivera"
                                    readOnly // Prevent changing name after verification
                                    title="Name verified via Aadhaar"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Email</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder="alex@alumni.edu" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Professional Role / Major</label>
                                <input required name="role" value={formData.role} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder={formData.entityType === 'student' ? "e.g. Computer Science Major" : "e.g. Senior Product Designer"} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">{formData.entityType === 'student' ? 'Institution' : 'Current Company'}</label>
                                <input required name="company" value={formData.company} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder={formData.entityType === 'student' ? "Tech Institute" : "Google"} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Grad Year</label>
                                    <input required type="number" name="gradYear" value={formData.gradYear} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder="2018" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Location</label>
                                    <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder="NY, USA" />
                                </div>
                            </div>
                        </div>

                        {/* Context & Auth Info */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Mentorship Status</label>
                                <select name="mentorshipStatus" value={formData.mentorshipStatus} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all appearance-none text-sm font-semibold text-oxford">
                                    <option value="available">Open to Mentor</option>
                                    <option value="seeking">Seeking Mentorship</option>
                                    <option value="none">Not Active</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Vibe / Interests</label>
                                <input name="vibePulse" value={formData.vibePulse} onChange={handleChange} className="w-full bg-gold/5 border-2 border-gold/20 focus:border-gold/40 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm italic" placeholder="e.g. Ambitious, tech-focused..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Industry</label>
                                <select required name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all appearance-none text-sm">
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
                                    <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Password</label>
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Confirm</label>
                                    <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Skills (comma separated)</label>
                                <input name="skills" value={formData.skills} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-3.5 focus:outline-none transition-all text-sm" placeholder="React, TypeScript, Figma" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2 pt-2">
                            <label className="text-[10px] font-bold text-oxford uppercase tracking-widest ml-1">Professional Bio</label>
                            <textarea required name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-surface-secondary border-2 border-transparent focus:border-oxford/10 rounded-2xl px-6 py-4 focus:outline-none transition-all min-h-[100px] text-sm" placeholder="Tell us about your professional journey..."></textarea>
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-oxford w-full py-5 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {loading ? 'Creating Profile...' : 'Join Network'}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SignUp;

