
import React, { useEffect, useState } from 'react';
import { getJobs, postJob } from '../services/jobs';
import { analyzeSkillGap, type SkillGapAnalysis } from '../services/analytics';
import type { Job, UserProfile } from '../types';

interface Props {
    onAskReferral?: (alum: any) => void;
    currentUser?: UserProfile | null;
}

const Jobs: React.FC<Props> = ({ onAskReferral, currentUser }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [newJob, setNewJob] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        missingSkills: [] as string[]
    });
    const [skillAnalysis, setSkillAnalysis] = useState<Record<string, SkillGapAnalysis>>({});
    const [analyzingJobs, setAnalyzingJobs] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchJobs = async () => {
            const fetched = await getJobs();
            setJobs(fetched);

            // Analyze skill gap for each job based on current user's skills
            if (currentUser?.skills && currentUser.skills.length > 0) {
                fetched.forEach(async (job) => {
                    if (job.id) {
                        setAnalyzingJobs(prev => new Set([...prev, job.id!]));

                        // Use job requirements or generate from description keywords
                        const jobRequirements = job.requirements || extractSkillsFromDescription(job.description);

                        const analysis = await analyzeSkillGap(
                            currentUser.skills || [],
                            jobRequirements,
                            10 // Assume some network connections
                        );

                        if (analysis) {
                            setSkillAnalysis(prev => ({
                                ...prev,
                                [job.id!]: analysis
                            }));
                        }

                        setAnalyzingJobs(prev => {
                            const next = new Set(prev);
                            next.delete(job.id!);
                            return next;
                        });
                    }
                });
            }
        };
        fetchJobs();
    }, [currentUser]);

    // Extract potential skill keywords from job description
    const extractSkillsFromDescription = (description: string): string[] => {
        const commonSkills = ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 'SQL', 'Machine Learning', 'TypeScript', 'Java', 'Leadership', 'Communication'];
        const descLower = description.toLowerCase();
        return commonSkills.filter(skill => descLower.includes(skill.toLowerCase()));
    };

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        try {
            await postJob({
                title: newJob.title,
                company: newJob.company,
                location: newJob.location,
                description: newJob.description,
                missingSkills: [],
                postedBy: currentUser.uid
            }, currentUser.displayName || 'Alumni');

            alert("Job Posted!");
            setIsPosting(false);
            const fetched = await getJobs();
            setJobs(fetched);
        } catch (err) {
            alert("Failed to post job.");
        }
    };

    const getAnalysisForJob = (jobId: string | undefined) => {
        if (!jobId) return null;
        return skillAnalysis[jobId] || null;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-oxford">Opportunity</h1>
                    <p className="text-text-secondary">Jobs matched to your unique network connections.</p>
                </div>
                <div className="flex gap-3">
                    <button className="card-premium px-4 py-2 text-sm font-semibold text-text-secondary hover:text-oxford transition-colors">Saved</button>
                    <button
                        onClick={() => setIsPosting(!isPosting)}
                        className="btn-oxford px-6 py-2 text-sm">
                        {isPosting ? 'Cancel' : 'Post a Job'}
                    </button>
                </div>
            </div>

            {isPosting && (
                <form onSubmit={handlePostJob} className="card-premium p-6 border-gold/20 space-y-4 mb-8">
                    <h2 className="text-xl font-bold text-oxford">Post a New Opportunity</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Job Title" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} required />
                        <input placeholder="Company" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} required />
                        <input placeholder="Location" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} required />
                    </div>
                    <textarea placeholder="Description" className="bg-surface-secondary rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} required />
                    <button type="submit" className="btn-oxford px-6 py-3">Submit Job</button>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.length > 0 ? jobs.map(job => {
                    const analysis = getAnalysisForJob(job.id);
                    const isAnalyzing = job.id ? analyzingJobs.has(job.id) : false;
                    const referralProb = analysis?.referral_probability || job.referralProb || 50;
                    const missingSkills = analysis?.missing_skills || job.missingSkills || [];

                    return (
                        <div key={job.id} className="card-premium p-8 hover:border-gold/30 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-1 text-oxford">{job.title}</h2>
                                    <p className="text-gold font-semibold">{job.company}</p>
                                    <p className="text-sm text-text-muted mt-1 font-medium">📍 {job.location}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-text-muted uppercase font-bold mb-1 tracking-wider">
                                        {analysis ? 'AI Match Score' : 'Referral Prob'}
                                    </div>
                                    {isAnalyzing ? (
                                        <div className="w-8 h-8 border-2 border-oxford border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : (
                                        <div className={`text-2xl font-bold ${referralProb > 70 ? 'text-success' : referralProb > 50 ? 'text-warning' : 'text-alert'}`}>
                                            {referralProb}%
                                        </div>
                                    )}
                                    {analysis && (
                                        <p className="text-[8px] text-text-muted uppercase mt-1">
                                            {analysis.recommendation}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <p className="text-text-secondary text-sm mb-6 line-clamp-2 leading-relaxed">{job.description}</p>

                            <div className="space-y-4 mb-6">
                                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    {analysis ? 'AI Skill Gap Analysis' : 'Skill Gap Analysis'}
                                </h3>
                                {isAnalyzing ? (
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-xl" />
                                        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-xl" />
                                    </div>
                                ) : missingSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {missingSkills.map(skill => (
                                            <div key={skill} className="flex items-center gap-2 bg-alert/5 border border-alert/10 text-alert px-3 py-1.5 rounded-xl text-xs font-medium">
                                                <span className="opacity-70">⚠️</span> Missing {skill}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-success font-medium">✓ All skills matched!</p>
                                )}
                                {analysis?.matching_skills && analysis.matching_skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {analysis.matching_skills.slice(0, 3).map(skill => (
                                            <div key={skill} className="flex items-center gap-2 bg-success/5 border border-success/10 text-success px-3 py-1.5 rounded-xl text-xs font-medium">
                                                <span className="opacity-70">✓</span> {skill}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-oxford font-medium italic">
                                    Posted by {job.postedByName || 'Alumni Network'}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => alert(`Redirecting to application portal for ${job.title} at ${job.company}`)}
                                    className="btn-oxford flex-1 py-3"
                                >
                                    Apply Now
                                </button>
                                <button
                                    onClick={() => onAskReferral && onAskReferral(null)}
                                    className="px-6 card-premium hover:border-gold/30 text-oxford font-semibold transition-colors"
                                >
                                    Ask for Referral
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-12 text-center text-text-muted">No jobs posted yet. Be the first to post!</div>
                )}
            </div>
        </div>
    );
};

export default Jobs;

