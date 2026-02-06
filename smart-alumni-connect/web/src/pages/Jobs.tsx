
import React, { useEffect, useState, useMemo } from 'react';
import { getJobs, postJob, submitJobApplication, getJobApplications, submitReferralRequest, checkExistingReferralRequest } from '../services/jobs';
import { analyzeSkillGap, type SkillGapAnalysis } from '../services/analytics';
import type { Job, UserProfile, JobApplication } from '../types';

interface Props {
    onAskReferral?: (alum: any) => void;
    currentUser?: UserProfile | null;
}

type LocationFilter = 'all' | 'remote' | 'onsite' | 'hybrid';
type MatchFilter = 'all' | 'high' | 'medium' | 'low';
type SortOption = 'match' | 'recent' | 'company';

const Jobs: React.FC<Props> = ({ onAskReferral, currentUser }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [newJob, setNewJob] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        jobType: 'Full-time',
        applyUrl: '',
        requirements: ''
    });
    const [skillAnalysis, setSkillAnalysis] = useState<Record<string, SkillGapAnalysis>>({});
    const [analyzingJobs, setAnalyzingJobs] = useState<Set<string>>(new Set());
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
    const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('match');
    const [showFilters, setShowFilters] = useState(false);
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    // Application modal states
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [applicationForm, setApplicationForm] = useState({
        phoneNumber: '',
        resumeUrl: '',
        coverLetter: ''
    });
    const [submittingApplication, setSubmittingApplication] = useState(false);

    // Referral states
    const [referralRequests, setReferralRequests] = useState<Set<string>>(new Set());
    const [submittingReferral, setSubmittingReferral] = useState(false);

    // Applications viewer states
    const [showApplicationsModal, setShowApplicationsModal] = useState(false);
    const [viewingApplicationsFor, setViewingApplicationsFor] = useState<Job | null>(null);
    const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            const fetched = await getJobs();
            setJobs(fetched);
            setLoading(false);

            // Analyze skill gap for each job based on current user's skills
            if (currentUser?.skills && currentUser.skills.length > 0) {
                // Batch add all valid job IDs to analyzing set first to prevent flickering/race conditions
                const jobIdsToAnalyze = fetched.filter(j => j.id).map(j => j.id!);
                setAnalyzingJobs(new Set(jobIdsToAnalyze));

                // Use Promise.allSettled to handle all analyses with timeout
                const analysisPromises = fetched.map(async (job) => {
                    if (!job.id) return;

                    try {
                        // Use job requirements or generate from description keywords
                        const jobRequirements = job.requirements || extractSkillsFromDescription(job.description);

                        // Add timeout to prevent stuck loading
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Analysis timeout')), 10000)
                        );

                        const analysisPromise = analyzeSkillGap(
                            currentUser.skills || [],
                            jobRequirements,
                            10 // Assume some network connections
                        );

                        const analysis = await Promise.race([analysisPromise, timeoutPromise]) as SkillGapAnalysis | null;

                        if (analysis) {
                            setSkillAnalysis(prev => ({
                                ...prev,
                                [job.id!]: analysis
                            }));
                        }
                    } catch (err) {
                        console.error("Error analyzing job:", job.id, err);
                        // Set a default analysis on error to prevent stuck loading
                        setSkillAnalysis(prev => ({
                            ...prev,
                            [job.id!]: {
                                missing_skills: [],
                                matching_skills: [],
                                skill_match_percentage: 50,
                                referral_probability: 50,
                                recommendation: 'Unable to analyze'
                            }
                        }));
                    } finally {
                        // Guaranteed cleanup
                        setAnalyzingJobs(prev => {
                            const next = new Set(prev);
                            next.delete(job.id!);
                            return next;
                        });
                    }
                });

                // Wait for all analyses to complete
                await Promise.allSettled(analysisPromises);
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
                postedBy: currentUser.uid,
                jobType: newJob.jobType as 'Full-time' | 'Part-time' | 'Contract' | 'Internship',
                applyUrl: newJob.applyUrl || undefined,
                requirements: newJob.requirements.split(',').map(s => s.trim()).filter(Boolean)
            }, currentUser.displayName || 'Alumni');

            alert("Job Posted!");
            setIsPosting(false);
            setNewJob({ title: '', company: '', location: '', description: '', jobType: 'Full-time', applyUrl: '', requirements: '' });
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

    const toggleSaveJob = (jobId: string) => {
        setSavedJobs(prev => {
            const next = new Set(prev);
            if (next.has(jobId)) {
                next.delete(jobId);
            } else {
                next.add(jobId);
            }
            return next;
        });
    };

    const handleApplyNow = (job: Job) => {
        setSelectedJob(job);
        setShowApplicationModal(true);
        // Reset form
        setApplicationForm({
            phoneNumber: '',
            resumeUrl: '',
            coverLetter: ''
        });
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedJob) return;

        setSubmittingApplication(true);
        try {
            await submitJobApplication({
                jobId: selectedJob.id!,
                jobTitle: selectedJob.title,
                jobCompany: selectedJob.company,
                applicantUid: currentUser.uid,
                applicantName: currentUser.displayName || 'Anonymous',
                applicantEmail: currentUser.email || '',
                phoneNumber: applicationForm.phoneNumber,
                resumeUrl: applicationForm.resumeUrl,
                coverLetter: applicationForm.coverLetter
            });

            alert('Application submitted successfully! 🎉');
            setShowApplicationModal(false);
            setSelectedJob(null);
        } catch (err) {
            console.error('Error submitting application:', err);
            alert('Failed to submit application. Please try again.');
        } finally {
            setSubmittingApplication(false);
        }
    };

    const handleAskReferral = async (job: Job) => {
        if (!currentUser || !job.id) return;

        // Check if already requested
        const alreadyRequested = await checkExistingReferralRequest(job.id, currentUser.uid);
        if (alreadyRequested) {
            alert('You have already requested a referral for this job.');
            return;
        }

        setSubmittingReferral(true);
        try {
            await submitReferralRequest({
                jobId: job.id,
                jobTitle: job.title,
                jobCompany: job.company,
                requesterId: currentUser.uid,
                requesterName: currentUser.displayName || 'Anonymous',
                referrerId: job.postedBy,
                referrerName: job.postedByName || 'Alumni',
                message: `Hi, I'm interested in the ${job.title} position at ${job.company}. Could you provide a referral?`
            });

            setReferralRequests(prev => new Set(prev).add(job.id!));
            alert('Referral request sent successfully! 🤝');
        } catch (err) {
            console.error('Error submitting referral request:', err);
            alert('Failed to send referral request. Please try again.');
        } finally {
            setSubmittingReferral(false);
        }
    };

    const handleViewApplications = async (job: Job) => {
        if (!job.id) return;
        setViewingApplicationsFor(job);
        setShowApplicationsModal(true);

        try {
            const applications = await getJobApplications(job.id);
            setJobApplications(applications);
        } catch (err) {
            console.error('Error fetching applications:', err);
            alert('Failed to load applications.');
        }
    };

    const getLocationCategory = (location: string): LocationFilter => {
        const lower = location.toLowerCase();
        if (lower.includes('remote')) return 'remote';
        if (lower.includes('hybrid')) return 'hybrid';
        return 'onsite';
    };

    const getMatchCategory = (prob: number): MatchFilter => {
        if (prob >= 70) return 'high';
        if (prob >= 50) return 'medium';
        return 'low';
    };

    // Stats
    const stats = useMemo(() => ({
        total: jobs.length,
        highMatch: jobs.filter(j => {
            const analysis = getAnalysisForJob(j.id);
            const prob = analysis?.referral_probability || j.referralProb || 50;
            return prob >= 70;
        }).length,
        remote: jobs.filter(j => getLocationCategory(j.location) === 'remote').length,
        saved: savedJobs.size,
    }), [jobs, skillAnalysis, savedJobs]);

    // Filtered and sorted jobs
    const filteredJobs = useMemo(() => {
        let result = [...jobs];

        // Show saved only
        if (showSavedOnly) {
            result = result.filter(j => j.id && savedJobs.has(j.id));
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(j =>
                j.title.toLowerCase().includes(query) ||
                j.company.toLowerCase().includes(query) ||
                j.description.toLowerCase().includes(query) ||
                j.location.toLowerCase().includes(query)
            );
        }

        // Location filter
        if (locationFilter !== 'all') {
            result = result.filter(j => getLocationCategory(j.location) === locationFilter);
        }

        // Match filter
        if (matchFilter !== 'all') {
            result = result.filter(j => {
                const analysis = getAnalysisForJob(j.id);
                const prob = analysis?.referral_probability || j.referralProb || 50;
                return getMatchCategory(prob) === matchFilter;
            });
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'match':
                    const probA = getAnalysisForJob(a.id)?.referral_probability || a.referralProb || 50;
                    const probB = getAnalysisForJob(b.id)?.referral_probability || b.referralProb || 50;
                    return probB - probA;
                case 'company':
                    return a.company.localeCompare(b.company);
                case 'recent':
                default:
                    return 0;
            }
        });

        return result;
    }, [jobs, searchQuery, locationFilter, matchFilter, sortBy, showSavedOnly, savedJobs, skillAnalysis]);

    const getJobTypeBadge = (type?: string) => {
        switch (type?.toLowerCase()) {
            case 'full-time': return { text: 'Full-time', color: 'bg-success/10 text-success border-success/20' };
            case 'part-time': return { text: 'Part-time', color: 'bg-gold/10 text-gold border-gold/20' };
            case 'contract': return { text: 'Contract', color: 'bg-oxford/10 text-oxford border-oxford/20' };
            case 'internship': return { text: 'Internship', color: 'bg-alert/10 text-alert border-alert/20' };
            default: return { text: type || 'Full-time', color: 'bg-surface-secondary text-text-muted border-surface-tertiary' };
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-oxford border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-muted">Loading opportunities...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-oxford">Opportunity</h1>
                    <p className="text-text-secondary">Jobs matched to your unique network and skills.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                        className={`card-premium px-4 py-2 text-sm font-semibold transition-colors ${showSavedOnly ? 'bg-gold/10 text-gold border-gold/30' : 'text-text-secondary hover:text-oxford'}`}
                    >
                        ⭐ Saved ({savedJobs.size})
                    </button>
                    <button
                        onClick={() => setIsPosting(!isPosting)}
                        className="btn-oxford px-6 py-2 text-sm">
                        {isPosting ? 'Cancel' : '+ Post Job'}
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-4">
                {[
                    { label: 'Total Jobs', value: stats.total, icon: '💼' },
                    { label: 'High Match', value: stats.highMatch, icon: '🎯' },
                    { label: 'Remote', value: stats.remote, icon: '🏠' },
                    { label: 'Saved', value: stats.saved, icon: '⭐' },
                ].map((stat, i) => (
                    <div key={i} className="card-premium px-5 py-3 text-center min-w-[100px]">
                        <p className="text-2xl font-bold text-oxford">{stat.value}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-1">
                            <span>{stat.icon}</span> {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search jobs by title, company, or location..."
                            className="w-full card-premium px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-oxford/10 transition-all placeholder:text-text-muted"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`card-premium px-4 py-3 transition-colors ${showFilters ? 'bg-oxford text-gold' : 'text-oxford hover:bg-surface-secondary'}`}
                    >
                        ⚙️ Filters
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="card-premium p-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Location Type</label>
                                <select
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value as LocationFilter)}
                                    className="w-full px-4 py-2 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                >
                                    <option value="all">All Locations</option>
                                    <option value="remote">Remote</option>
                                    <option value="onsite">On-site</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Match Level</label>
                                <select
                                    value={matchFilter}
                                    onChange={(e) => setMatchFilter(e.target.value as MatchFilter)}
                                    className="w-full px-4 py-2 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                >
                                    <option value="all">All Matches</option>
                                    <option value="high">High Match (70%+)</option>
                                    <option value="medium">Medium Match (50-70%)</option>
                                    <option value="low">Low Match (&lt;50%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="w-full px-4 py-2 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                >
                                    <option value="match">Best Match</option>
                                    <option value="recent">Most Recent</option>
                                    <option value="company">Company (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="text-center">
                <span className="text-sm text-text-muted">
                    Showing <span className="font-bold text-oxford">{filteredJobs.length}</span> of {jobs.length} opportunities
                </span>
            </div>

            {/* Post Job Form */}
            {isPosting && (
                <form onSubmit={handlePostJob} className="card-premium p-6 border-gold/20 space-y-4">
                    <h2 className="text-xl font-bold text-oxford">Post a New Opportunity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Job Title *" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} required />
                        <input placeholder="Company *" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} required />
                        <input placeholder="Location (e.g. Remote, New York)" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} required />
                        <select value={newJob.jobType} onChange={e => setNewJob({ ...newJob, jobType: e.target.value })} className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10 text-oxford">
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                        </select>
                        <input placeholder="Apply URL (optional)" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.applyUrl} onChange={e => setNewJob({ ...newJob, applyUrl: e.target.value })} />
                        <input placeholder="Required Skills (comma-separated)" className="bg-surface-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.requirements} onChange={e => setNewJob({ ...newJob, requirements: e.target.value })} />
                    </div>
                    <textarea placeholder="Job Description *" className="bg-surface-secondary rounded-xl px-4 py-3 w-full min-h-[100px] focus:outline-none focus:ring-2 focus:ring-oxford/10" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} required />
                    <div className="flex gap-3">
                        <button type="submit" className="btn-oxford px-6 py-3">Submit Job</button>
                        <button type="button" onClick={() => setIsPosting(false)} className="px-6 py-3 text-text-muted hover:text-oxford transition-colors">Cancel</button>
                    </div>
                </form>
            )}

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredJobs.length > 0 ? filteredJobs.map(job => {
                    const analysis = getAnalysisForJob(job.id);
                    const isAnalyzing = job.id ? analyzingJobs.has(job.id) : false;
                    const referralProb = analysis?.referral_probability || job.referralProb || 50;
                    const missingSkills = analysis?.missing_skills || job.missingSkills || [];
                    const isSaved = job.id ? savedJobs.has(job.id) : false;
                    const typeBadge = getJobTypeBadge(job.jobType);

                    return (
                        <div key={job.id} className="card-premium p-6 hover:border-gold/30 transition-all flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-oxford">{job.title}</h2>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge.color}`}>
                                            {typeBadge.text}
                                        </span>
                                    </div>
                                    <p className="text-gold font-semibold">{job.company}</p>
                                    <p className="text-sm text-text-muted mt-1 font-medium">📍 {job.location}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => job.id && toggleSaveJob(job.id)}
                                        className={`text-xl transition-all ${isSaved ? 'text-gold scale-110' : 'text-text-muted hover:text-gold'}`}
                                        title={isSaved ? 'Unsave' : 'Save job'}
                                    >
                                        {isSaved ? '⭐' : '☆'}
                                    </button>
                                    <div className="text-right">
                                        <div className="text-[10px] text-text-muted uppercase font-bold mb-1 tracking-wider">
                                            {analysis ? 'AI Match' : 'Match'}
                                        </div>
                                        {isAnalyzing ? (
                                            <div className="w-8 h-8 border-2 border-oxford border-t-transparent rounded-full animate-spin mx-auto" />
                                        ) : (
                                            <div className={`text-2xl font-bold ${referralProb > 70 ? 'text-success' : referralProb > 50 ? 'text-warning' : 'text-alert'}`}>
                                                {referralProb}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed flex-1">{job.description}</p>

                            {/* Skill Analysis */}
                            <div className="space-y-3 mb-4">
                                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    {analysis ? 'AI Skill Analysis' : 'Skill Gap'}
                                </h3>
                                {isAnalyzing ? (
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-xl" />
                                        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {analysis?.matching_skills?.slice(0, 2).map(skill => (
                                            <span key={skill} className="flex items-center gap-1 bg-success/5 border border-success/10 text-success px-2 py-1 rounded-lg text-xs font-medium">
                                                ✓ {skill}
                                            </span>
                                        ))}
                                        {missingSkills.slice(0, 2).map(skill => (
                                            <span key={skill} className="flex items-center gap-1 bg-alert/5 border border-alert/10 text-alert px-2 py-1 rounded-lg text-xs font-medium">
                                                ⚠ {skill}
                                            </span>
                                        ))}
                                        {(missingSkills.length === 0 && !analysis?.matching_skills?.length) && (
                                            <span className="text-xs text-success font-medium">✓ Skills matched!</span>
                                        )}
                                    </div>
                                )}
                                {analysis?.recommendation && (
                                    <p className="text-[10px] text-text-muted italic">{analysis.recommendation}</p>
                                )}
                            </div>

                            {/* Posted By */}
                            <p className="text-xs text-oxford font-medium mb-4">
                                Posted by <span className="text-gold">{job.postedByName || 'Alumni Network'}</span>
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-surface-tertiary mt-auto">
                                <button
                                    onClick={() => handleApplyNow(job)}
                                    className="btn-oxford flex-1 py-2.5 text-sm"
                                    disabled={!currentUser}
                                >
                                    🚀 Apply Now
                                </button>
                                <button
                                    onClick={() => handleAskReferral(job)}
                                    className="flex-1 py-2.5 card-premium hover:border-gold/30 text-oxford font-semibold transition-colors text-sm"
                                    disabled={!currentUser || submittingReferral || (job.id ? referralRequests.has(job.id) : false)}
                                >
                                    {job.id && referralRequests.has(job.id) ? '✓ Requested' : '🤝 Ask Referral'}
                                </button>
                                {currentUser && job.postedBy === currentUser.uid && (
                                    <button
                                        onClick={() => handleViewApplications(job)}
                                        className="flex-1 py-2.5 card-premium hover:border-oxford/30 text-oxford font-semibold transition-colors text-sm"
                                    >
                                        📋 View Applications
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-16 text-center">
                        <p className="text-4xl mb-4">💼</p>
                        <p className="text-text-muted text-lg">No jobs found matching your criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setLocationFilter('all'); setMatchFilter('all'); setShowSavedOnly(false); }}
                            className="mt-4 text-gold hover:underline font-bold"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Application Modal */}
            {showApplicationModal && selectedJob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApplicationModal(false)}>
                    <div className="card-premium p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-oxford mb-1">Apply for Position</h2>
                                <p className="text-gold font-semibold">{selectedJob.title} at {selectedJob.company}</p>
                            </div>
                            <button onClick={() => setShowApplicationModal(false)} className="text-text-muted hover:text-oxford text-2xl">
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmitApplication} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={currentUser?.displayName || ''}
                                    disabled
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={currentUser?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={applicationForm.phoneNumber}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, phoneNumber: e.target.value })}
                                    placeholder="+1 (555) 123-4567"
                                    required
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Resume URL (Optional)</label>
                                <input
                                    type="url"
                                    value={applicationForm.resumeUrl}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, resumeUrl: e.target.value })}
                                    placeholder="https://drive.google.com/your-resume"
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Cover Letter *</label>
                                <textarea
                                    value={applicationForm.coverLetter}
                                    onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                                    placeholder="Tell us why you're a great fit for this position..."
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submittingApplication}
                                    className="btn-oxford flex-1 py-3"
                                >
                                    {submittingApplication ? 'Submitting...' : 'Submit Application'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowApplicationModal(false)}
                                    className="px-6 py-3 text-text-muted hover:text-oxford transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Applications Viewer Modal */}
            {showApplicationsModal && viewingApplicationsFor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApplicationsModal(false)}>
                    <div className="card-premium p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-oxford mb-1">Applications</h2>
                                <p className="text-gold font-semibold">{viewingApplicationsFor.title} at {viewingApplicationsFor.company}</p>
                                <p className="text-sm text-text-muted mt-1">{jobApplications.length} application{jobApplications.length !== 1 ? 's' : ''} received</p>
                            </div>
                            <button onClick={() => setShowApplicationsModal(false)} className="text-text-muted hover:text-oxford text-2xl">
                                ×
                            </button>
                        </div>

                        {jobApplications.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-4xl mb-4">📭</p>
                                <p className="text-text-muted">No applications yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobApplications.map((application) => (
                                    <div key={application.id} className="bg-surface-secondary rounded-xl p-5 border border-surface-tertiary">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-oxford text-lg">{application.applicantName}</h3>
                                                <p className="text-sm text-text-secondary">{application.applicantEmail}</p>
                                                <p className="text-sm text-text-secondary">{application.phoneNumber}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${application.status === 'pending' ? 'bg-gold/10 text-gold border border-gold/20' :
                                                    application.status === 'reviewed' ? 'bg-oxford/10 text-oxford border border-oxford/20' :
                                                        application.status === 'accepted' ? 'bg-success/10 text-success border border-success/20' :
                                                            'bg-alert/10 text-alert border border-alert/20'
                                                }`}>
                                                {application.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Cover Letter</p>
                                            <p className="text-sm text-text-secondary leading-relaxed">{application.coverLetter}</p>
                                        </div>

                                        {application.resumeUrl && (
                                            <a
                                                href={application.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-oxford hover:text-gold font-semibold transition-colors"
                                            >
                                                📄 View Resume →
                                            </a>
                                        )}

                                        <p className="text-xs text-text-muted mt-3">
                                            Applied {application.createdAt?.toDate ? new Date(application.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Jobs;
