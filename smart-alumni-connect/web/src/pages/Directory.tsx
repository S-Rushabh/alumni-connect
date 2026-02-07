
import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile } from '../types';
import CareerPath from '../components/CareerPath';
import { parseSemanticSearch } from '../services/geminiService';
import { getAllUsers } from '../services/user';

interface Props {
    onStartChat: (alum: UserProfile) => void;
    onViewProfile?: (alum: UserProfile) => void;
}

type RoleFilter = 'all' | 'alumni' | 'student' | 'teacher';
type MentorshipFilter = 'all' | 'available' | 'seeking';

const Directory: React.FC<Props> = ({ onStartChat, onViewProfile }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAlum, setSelectedAlum] = useState<UserProfile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [filterParams, setFilterParams] = useState<Record<string, string> | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // New filter states
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [mentorshipFilter, setMentorshipFilter] = useState<MentorshipFilter>('all');
    const [sortBy, setSortBy] = useState<'name' | 'year' | 'points'>('points'); // Default to points for gamification
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
            setLoading(false);
        };
        loadUsers();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) {
            setFilterParams(null);
            return;
        }
        setIsSearching(true);
        const params = await parseSemanticSearch(searchQuery);
        setFilterParams(params);
        setIsSearching(false);
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getMentorshipBadge = (status?: string) => {
        switch (status) {
            case 'available': return { text: 'Open to Mentor', color: 'bg-success/10 text-success border-success/20' };
            case 'seeking': return { text: 'Seeking Mentor', color: 'bg-gold/10 text-gold border-gold/20' };
            default: return null;
        }
    };

    const filteredAndSortedAlumni = useMemo(() => {
        let result = [...users];

        // Text search filter
        if (searchQuery.length > 0) {
            const query = searchQuery.toLowerCase();
            result = result.filter(alum =>
                (alum.displayName || '').toLowerCase().includes(query) ||
                (alum.role || '').toLowerCase().includes(query) ||
                (alum.company || '').toLowerCase().includes(query) ||
                (alum.skills || []).some(s => s.toLowerCase().includes(query)) ||
                (alum.location || '').toLowerCase().includes(query) ||
                (alum.industry || '').toLowerCase().includes(query)
            );
        }

        // Semantic filter params
        if (filterParams) {
            result = result.filter(alum => {
                let matches = true;
                if (filterParams.location && !(alum.location || '').toLowerCase().includes(filterParams.location.toLowerCase())) matches = false;
                if (filterParams.industry && !(alum.industry || '').toLowerCase().includes(filterParams.industry.toLowerCase())) matches = false;
                if (filterParams.role && !(alum.role || '').toLowerCase().includes(filterParams.role.toLowerCase())) matches = false;
                return matches;
            });
        }

        // Role filter
        if (roleFilter !== 'all') {
            result = result.filter(alum => alum.role === roleFilter || alum.entityType === roleFilter);
        }

        // Mentorship filter
        if (mentorshipFilter !== 'all') {
            result = result.filter(alum => alum.mentorshipStatus === mentorshipFilter);
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.displayName || '').localeCompare(b.displayName || '');
                case 'year':
                    return (b.graduationYear || 0) - (a.graduationYear || 0);
                case 'points':
                    return ((b.gamification?.points || 0) - (a.gamification?.points || 0));
                default:
                    return 0;
            }
        });

        return result;
    }, [filterParams, searchQuery, users, roleFilter, mentorshipFilter, sortBy]);

    // Stats
    const stats = useMemo(() => ({
        total: users.length,
        alumni: users.filter(u => u.role === 'alumni' || u.entityType === 'alumni').length,
        students: users.filter(u => u.role === 'student' || u.entityType === 'student').length,
        mentors: users.filter(u => u.mentorshipStatus === 'available').length,
        verified: users.filter(u => u.verification?.isVerified).length,
    }), [users]);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-oxford border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-muted">Loading Directory...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header & Search */}
            <div className="max-w-3xl mx-auto text-center space-y-4">
                <h1 className="font-heading text-3xl font-bold text-oxford">Discovery</h1>
                <p className="text-text-secondary">Search the network using names, skills, or natural language like "alumni in tech at Google"</p>

                <form onSubmit={handleSearch} className="relative group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, skill, company, or try 'engineers in Mumbai'..."
                        className="w-full card-premium px-6 py-4 pr-24 focus:outline-none focus:ring-2 focus:ring-oxford/10 transition-all text-lg placeholder:text-text-muted"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-oxford text-gold' : 'bg-surface-secondary text-oxford hover:bg-surface-tertiary'}`}
                        >
                            ⚙️
                        </button>
                        <button
                            type="submit"
                            className="bg-oxford text-gold p-2 rounded-xl hover:bg-oxford/90 transition-colors"
                        >
                            {isSearching ? <span className="animate-spin inline-block">⏳</span> : '🔍'}
                        </button>
                    </div>
                </form>

                {/* Filter Tags */}
                {filterParams && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {Object.entries(filterParams)
                            .filter(([, val]) => val)
                            .map(([key, val]) => (
                                <span key={key} className="text-[10px] bg-oxford/5 text-oxford border border-oxford/10 px-2 py-1 rounded-full font-bold uppercase">
                                    {key}: {String(val)}
                                </span>
                            ))}
                        <button
                            onClick={() => { setFilterParams(null); setSearchQuery(''); }}
                            className="text-[10px] bg-alert/5 text-alert border border-alert/10 px-2 py-1 rounded-full font-bold uppercase"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-4 justify-center">
                {[
                    { label: 'Total Members', value: stats.total, icon: '👥' },
                    { label: 'Alumni', value: stats.alumni, icon: '🎓' },
                    { label: 'Students', value: stats.students, icon: '📚' },
                    { label: 'Mentors Available', value: stats.mentors, icon: '🤝' },
                    { label: 'Verified', value: stats.verified, icon: '✓' },
                ].map((stat, i) => (
                    <div key={i} className="card-premium px-5 py-3 text-center min-w-[120px]">
                        <p className="text-2xl font-bold text-oxford">{stat.value}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-1">
                            <span>{stat.icon}</span> {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="card-premium p-6 max-w-3xl mx-auto animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Role</label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                                className="w-full px-4 py-2 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                            >
                                <option value="all">All Roles</option>
                                <option value="alumni">Alumni</option>
                                <option value="student">Students</option>
                                <option value="teacher">Teachers</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Mentorship</label>
                            <select
                                value={mentorshipFilter}
                                onChange={(e) => setMentorshipFilter(e.target.value as MentorshipFilter)}
                                className="w-full px-4 py-2 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                            >
                                <option value="all">All</option>
                                <option value="available">Open to Mentor</option>
                                <option value="seeking">Seeking Mentor</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'name' | 'year' | 'points')}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="year">Sort by Year</option>
                                <option value="points">Sort by Points</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className="text-center">
                <span className="text-sm text-text-muted">
                    Showing <span className="font-bold text-oxford">{filteredAndSortedAlumni.length}</span> of {users.length} members
                </span>
            </div>

            {/* Alumni Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedAlumni.length > 0 ? filteredAndSortedAlumni.map(alum => {
                    const mentorBadge = getMentorshipBadge(alum.mentorshipStatus);
                    return (
                        <div
                            key={alum.uid}
                            onClick={() => setSelectedAlum(alum)}
                            className="card-premium p-6 hover:border-gold/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="relative">
                                    {alum.photoURL ? (
                                        <img src={alum.photoURL} className="w-14 h-14 rounded-full border-2 border-gold/20 object-cover" alt={alum.displayName || ''} />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-oxford text-gold flex items-center justify-center font-bold text-lg border-2 border-gold/20">
                                            {getInitials(alum.displayName)}
                                        </div>
                                    )}
                                    {alum.verification?.isVerified && (
                                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center text-white text-[10px] border-2 border-white" title="Verified">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg text-oxford group-hover:text-gold transition-colors truncate">{alum.displayName || "Unknown User"}</h3>
                                    <p className="text-sm text-text-secondary truncate">{alum.role} {alum.company ? `at ${alum.company}` : ''}</p>
                                    {alum.industry && (
                                        <p className="text-xs text-text-muted truncate">{alum.industry}</p>
                                    )}
                                </div>
                            </div>

                            {/* Mentorship Badge */}
                            {mentorBadge && (
                                <div className={`text-[10px] font-bold px-3 py-1 rounded-full border inline-block mb-3 ${mentorBadge.color}`}>
                                    {mentorBadge.text}
                                </div>
                            )}

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {alum.skills?.slice(0, 4).map(skill => (
                                    <span key={skill} className="text-[10px] bg-surface-secondary text-text-secondary border border-surface-tertiary px-2 py-1 rounded font-medium">{skill}</span>
                                ))}
                                {(alum.skills?.length || 0) > 4 && (
                                    <span className="text-[10px] text-text-muted">+{(alum.skills?.length || 0) - 4} more</span>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="text-xs text-text-muted flex justify-between items-center pt-3 border-t border-surface-tertiary">
                                <span className="flex items-center gap-1">📍 {alum.location || "Unknown"}</span>
                                <span className="font-semibold text-oxford">Class of '{alum.graduationYear?.toString().slice(-2) || 'XX'}</span>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-surface-tertiary">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStartChat(alum); }}
                                    className="flex-1 py-2 text-xs font-bold bg-oxford text-gold rounded-lg hover:bg-oxford/90 transition-colors"
                                >
                                    💬 Message
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (onViewProfile) onViewProfile(alum); }}
                                    className="flex-1 py-2 text-xs font-bold bg-surface-secondary text-oxford rounded-lg hover:bg-surface-tertiary transition-colors"
                                >
                                    👤 Profile
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-4xl mb-4">🔍</p>
                        <p className="text-text-muted text-lg">No members found matching your criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setFilterParams(null); setRoleFilter('all'); setMentorshipFilter('all'); }}
                            className="mt-4 text-gold hover:underline font-bold"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Detail Modal */}
            {selectedAlum && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-oxford/40 backdrop-blur-sm" onClick={() => setSelectedAlum(null)} />
                    <div className="relative card-premium w-full max-w-2xl p-8 shadow-premium animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-6 right-6 text-text-muted hover:text-oxford transition-colors text-xl"
                            onClick={() => setSelectedAlum(null)}
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative">
                                {selectedAlum.photoURL ? (
                                    <img src={selectedAlum.photoURL} className="w-20 h-20 rounded-2xl border-2 border-gold object-cover" alt={selectedAlum.displayName || ''} />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-oxford text-gold flex items-center justify-center font-bold text-2xl border-2 border-gold">
                                        {getInitials(selectedAlum.displayName)}
                                    </div>
                                )}
                                {selectedAlum.verification?.isVerified && (
                                    <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-sm border-2 border-white">
                                        ✓
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="font-heading text-2xl font-bold text-oxford">{selectedAlum.displayName}</h2>
                                <p className="text-gold font-medium">{selectedAlum.role} {selectedAlum.company ? `@ ${selectedAlum.company}` : ''}</p>
                                <div className="flex gap-2 mt-2">
                                    {selectedAlum.location && (
                                        <span className="text-xs text-text-muted">📍 {selectedAlum.location}</span>
                                    )}
                                    {selectedAlum.graduationYear && (
                                        <span className="text-xs text-text-muted">🎓 Class of {selectedAlum.graduationYear}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        {selectedAlum.bio && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">About</h3>
                                <p className="text-text-secondary leading-relaxed">{selectedAlum.bio}</p>
                            </div>
                        )}

                        {/* Skills */}
                        {selectedAlum.skills && selectedAlum.skills.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAlum.skills.map(skill => (
                                        <span key={skill} className="text-xs bg-oxford/5 text-oxford border border-oxford/10 px-3 py-1 rounded-full font-medium">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Career Path */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Career Path</h3>
                            {selectedAlum.careerPath ? (
                                <CareerPath path={selectedAlum.careerPath} />
                            ) : (
                                <p className="text-sm text-text-muted italic">No career path data available.</p>
                            )}
                        </div>

                        {/* Gamification */}
                        {(selectedAlum.gamification || selectedAlum.points) && (
                            <div className="mb-6 p-4 bg-gold/5 rounded-xl border border-gold/20">
                                <h3 className="text-sm font-bold text-gold uppercase tracking-widest mb-3">Achievements</h3>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-2xl font-bold text-oxford">{selectedAlum.gamification?.points || selectedAlum.points || 0}</p>
                                        <p className="text-xs text-text-muted">Points</p>
                                    </div>
                                    {(selectedAlum.gamification?.badges || selectedAlum.badges)?.map((badge, i) => (
                                        <span key={i} className="text-2xl" title={badge}>{badge}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-surface-tertiary flex gap-4">
                            <button
                                onClick={() => onStartChat(selectedAlum)}
                                className="flex-1 btn-oxford px-6 py-3 text-sm"
                            >
                                💬 Send Message
                            </button>
                            <button
                                onClick={() => {
                                    if (onViewProfile) onViewProfile(selectedAlum);
                                    setSelectedAlum(null);
                                }}
                                className="flex-1 px-6 py-3 bg-surface-secondary hover:bg-surface-tertiary text-oxford rounded-xl font-semibold text-sm transition-colors border border-surface-tertiary"
                            >
                                👤 View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Directory;

