
import React, { useState, useEffect } from 'react';
import { enhanceBio } from '../services/geminiService';
import { questService } from '../services/quests';
import type { UserProfile } from '../types';
import { updateUserProfile } from '../services/user';
import { QuestList } from '../components/gamification/QuestList';
import { BadgeGrid } from '../components/gamification/BadgeGrid';
import { ChallengesList } from '../components/gamification/ChallengesList';

interface Props {
    alum?: UserProfile | null; // Viewed user (Directory)
    selfUser?: UserProfile | null; // Logged in user (My Profile)
    onStartChat?: (alum: UserProfile) => void;
}

const Profile: React.FC<Props> = ({ alum, selfUser, onStartChat }) => {
    // Determine who we are viewing. 
    // If 'alum' is passed, we are viewing someone else.
    // If 'alum' is null but 'selfUser' exists, we are viewing ourselves.
    const isSelf = !alum && !!selfUser;
    const targetUser = alum || selfUser;

    const [currentAlum, setCurrentAlum] = useState<UserProfile>(targetUser || {
        uid: 'placeholder',
        email: null,
        displayName: "User Not Found",
        headline: "Senior Engineer",
        role: "alumni",
        company: "Unknown",
        graduationYear: 2000,
        bio: "",
        photoURL: "https://picsum.photos/seed/user/200/200",
        skills: [],
        location: "Global",
        industry: "General",
        careerPath: []
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: "",
        headline: "",
        role: "alumni" as UserProfile['role'],
        company: "",
        location: "",
        industry: "",
        graduationYear: 2000,
        mentorshipStatus: "available" as UserProfile['mentorshipStatus'],
        vibePulse: "",
        skills: "",
        bio: ""
    });

    const [bio, setBio] = useState(targetUser?.bio || "");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);

    useEffect(() => {
        if (targetUser) {
            setCurrentAlum({
                ...targetUser,
                headline: targetUser.headline || targetUser.role // Fallback to role if headline missing
            });
            setBio(targetUser.bio || "");
            setEditForm({
                displayName: targetUser.displayName || "",
                headline: targetUser.headline || targetUser.role || "",
                role: targetUser.role || "alumni",
                company: targetUser.company || "",
                location: targetUser.location || "",
                industry: targetUser.industry || "",
                graduationYear: targetUser.graduationYear || 2000,
                mentorshipStatus: targetUser.mentorshipStatus || "available",
                vibePulse: targetUser.vibePulse || "",
                skills: (targetUser.skills || []).join(", "),
                bio: targetUser.bio || ""
            });
        }
    }, [alum, selfUser]);

    const handleEnhance = async () => {
        if (!isSelf) return;
        setIsEnhancing(true);
        const newBio = await enhanceBio(editForm.bio);
        if (newBio) {
            setEditForm(prev => ({ ...prev, bio: newBio }));
            setBio(newBio); // Update display as well
        }
        setIsEnhancing(false);
    };

    const handleEditClick = () => {
        setEditForm({
            displayName: currentAlum.displayName || "",
            headline: currentAlum.headline || "",
            role: currentAlum.role || "alumni",
            company: currentAlum.company || "",
            location: currentAlum.location || "",
            industry: currentAlum.industry || "",
            graduationYear: currentAlum.graduationYear || 2000,
            mentorshipStatus: currentAlum.mentorshipStatus || "available",
            vibePulse: currentAlum.vibePulse || "",
            skills: (currentAlum.skills || []).join(", "),
            bio: currentAlum.bio || ""
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSelf && selfUser?.uid) {
            try {
                const updates: Partial<UserProfile> = {
                    displayName: editForm.displayName,
                    headline: editForm.headline,
                    role: editForm.role,
                    company: editForm.company,
                    location: editForm.location,
                    industry: editForm.industry,
                    graduationYear: Number(editForm.graduationYear),
                    mentorshipStatus: editForm.mentorshipStatus,
                    vibePulse: editForm.vibePulse,
                    skills: editForm.skills.split(',').map(s => s.trim()).filter(s => s),
                    bio: editForm.bio
                };

                await updateUserProfile(selfUser.uid, updates);

                // Quest Trigger - Merge current user data with updates to valid full profile
                await questService.checkProfileCompletion(selfUser.uid, { ...selfUser, ...updates } as UserProfile);

                // Update local state to reflect changes immediately
                setCurrentAlum((prev: UserProfile) => ({ ...prev, ...updates }));
                setBio(updates.bio || "");
                setIsEditing(false);
                alert("Profile updated successfully!");
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Failed to update profile.");
            }
        };
    };

    const handleVerify = (type: string) => {
        setVerifying(type);
        setTimeout(() => {
            setVerifying(null);
        }, 2000);
    };

    if (!currentAlum) return <div>Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700 pb-24 md:pt-6">

            {/* 1. GAMER HERO SECTION */}
            <section className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[3rem] opacity-70 blur-xl transition-all"></div>
                <div className="relative bg-white rounded-[2.5rem] p-6 md:p-12 overflow-hidden border border-slate-100 shadow-xl">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-100/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        {/* Avatar & Rank */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
                                <img
                                    src={currentAlum.photoURL || "https://picsum.photos/seed/user/200/200"}
                                    className="w-full h-full rounded-[1.7rem] object-cover border-4 border-white"
                                    alt="Profile"
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-white text-slate-900 px-4 py-1.5 rounded-full border border-slate-100 shadow-xl flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Lvl</span>
                                <span className="text-xl font-black">{currentAlum.gamification?.level || 1}</span>
                            </div>
                        </div>

                        {/* Info & Stats */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2">
                                    {currentAlum.displayName}
                                </h1>
                                <p className="text-indigo-600 font-bold uppercase tracking-widest text-sm flex items-center justify-center md:justify-start gap-3">
                                    <span>{currentAlum.headline || "Alumni Member"}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <span>{currentAlum.location || "Global"}</span>
                                </p>
                            </div>

                            {/* Stats Row */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Score</p>
                                    <p className="text-2xl font-black text-slate-900">{currentAlum.gamification?.points?.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Rank</p>
                                    <p className="text-2xl font-black text-emerald-600">#{currentAlum.gamification?.rank || '---'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Status</p>
                                    <p className="text-2xl font-black text-amber-500">Active</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="flex flex-col gap-3 min-w-[160px]">
                            {isSelf ? (
                                <button onClick={handleEditClick} className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:scale-105 transition-transform shadow-lg uppercase tracking-wider text-xs">
                                    Edit Card
                                </button>
                            ) : (
                                <button onClick={() => onStartChat && onStartChat(currentAlum)} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider text-xs">
                                    Challenge
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT: QUESTS (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Active Quests */}
                    {isSelf && selfUser?.uid && <QuestList userId={selfUser.uid} />}
                    {isSelf && <ChallengesList currentUser={currentAlum} />}
                    {!isSelf && (
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
                            <p className="text-slate-400 text-sm">Quests are private.</p>
                        </div>
                    )}
                </div>

                {/* MIDDLE: INFO & FEED (6 cols) */}
                <div className="lg:col-span-6 space-y-8">
                    {/* Bio Card */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-900 text-xl tracking-tight">Narrative</h3>
                            {isSelf && (
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing}
                                    className="text-xs font-bold text-indigo-600 uppercase tracking-wider hover:underline flex items-center gap-1 disabled:opacity-50"
                                >
                                    {isEnhancing ? 'Synthesizing...' : '✨ AI Enhance'}
                                </button>
                            )}
                        </div>
                        <p className="text-slate-600 leading-relaxed text-lg font-light whitespace-pre-line">
                            {bio}
                        </p>
                    </div>

                    {/* Tech Chips (Skills) */}
                    <div className="bg-white rounded-[2rem] p-8 relative overflow-hidden border border-slate-100 shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-[50px]"></div>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight mb-6 relative z-10">Tech Stack & Expertise</h3>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {(currentAlum.skills || []).map(skill => (
                                <span key={skill} className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-bold tracking-wide cursor-default shadow-sm">
                                    {skill}
                                </span>
                            ))}
                            {(!currentAlum.skills || currentAlum.skills.length === 0) && (
                                <p className="text-slate-400 text-sm italic">No skills tagged yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Career Architecture Summary */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-900 text-xl tracking-tight mb-6">Current Focus</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                                {currentAlum.company?.charAt(0) || "C"}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{currentAlum.company || "Working Independently"}</h4>
                                <p className="text-sm text-slate-500">{currentAlum.headline || currentAlum.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: BADGES & VAULT (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase mb-1 px-1">Badges</h3>
                    <BadgeGrid currentUser={currentAlum} />

                    {/* Vault Access Small */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase mb-4">Credentials</h3>
                        <div className="space-y-3">
                            {['Degree', 'Mentor', 'Investor'].map((id) => (
                                <div key={id} onClick={() => handleVerify(id)} className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 cursor-pointer transition-all ${verifying === id ? 'bg-green-50 border-green-200' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                    <span className="text-lg">{verifying === id ? '✅' : '🛡️'}</span>
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${verifying === id ? 'text-green-700' : 'text-slate-700'}`}>{id}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                            {verifying === id ? 'Verified on-chain' : 'Click to Verify'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* EDIT PROFILE MODAL */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsEditing(false)}>
                    <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-3xl font-black text-slate-950 tracking-tighter mb-8">Edit Gamertag Card</h2>

                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Graduation Year</label>
                                    <input
                                        type="number"
                                        value={editForm.graduationYear}
                                        onChange={e => setEditForm({ ...editForm, graduationYear: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Headline / Class</label>
                                    <input
                                        type="text"
                                        value={editForm.headline}
                                        onChange={e => setEditForm({ ...editForm, headline: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Guild / Company</label>
                                    <input
                                        type="text"
                                        value={editForm.company}
                                        onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Base (Location)</label>
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sector</label>
                                    <select
                                        value={editForm.industry}
                                        onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                                    >
                                        <option value="">Select Industry</option>
                                        <option value="Tech">Technology / Software</option>
                                        <option value="Design">Design / Creative</option>
                                        <option value="Finance">Finance / Fintech</option>
                                        <option value="Green Tech">Green Tech / Energy</option>
                                        <option value="Medicine">Medicine / Biotech</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Class Type</label>
                                    <select
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                                    >
                                        <option value="alumni">Alumni</option>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mentorship</label>
                                    <select
                                        value={editForm.mentorshipStatus}
                                        onChange={e => setEditForm({ ...editForm, mentorshipStatus: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                                    >
                                        <option value="available">Open to Mentor</option>
                                        <option value="seeking">Seeking Mentorship</option>
                                        <option value="none">Not Active</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Interests</label>
                                    <input
                                        type="text"
                                        value={editForm.vibePulse}
                                        onChange={e => setEditForm({ ...editForm, vibePulse: e.target.value })}
                                        placeholder="e.g. AI, Crypto, Sustainability"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tech Stack (Skills)</label>
                                    <input
                                        type="text"
                                        value={editForm.skills}
                                        onChange={e => setEditForm({ ...editForm, skills: e.target.value })}
                                        placeholder="React, Leadership, Public Speaking..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Player Narrative (Bio)</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                {/* Quests */}
                                {isSelf && selfUser?.uid && <QuestList userId={selfUser.uid} />}
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-slate-950 text-white font-bold py-4 rounded-xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs"
                                >
                                    Save Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-8 bg-slate-100 text-slate-500 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;
