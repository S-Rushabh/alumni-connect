
import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile } from '../types';
import CareerPath from '../components/CareerPath';
import { parseSemanticSearch } from '../services/geminiService';
import { getAllUsers } from '../services/user';

interface Props {
    onStartChat: (alum: UserProfile) => void;
    onViewProfile?: (alum: UserProfile) => void;
}

const Directory: React.FC<Props> = ({ onStartChat, onViewProfile }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAlum, setSelectedAlum] = useState<UserProfile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [filterParams, setFilterParams] = useState<Record<string, string> | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

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

    const filteredAlumni = useMemo(() => {
        const baseFiltered = searchQuery.length > 0
            ? users.filter(alum =>
                (alum.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (alum.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (alum.company || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
            : users;

        if (!filterParams) return baseFiltered;

        return baseFiltered.filter(alum => {
            let matches = true;
            if (filterParams.location && !(alum.location || '').toLowerCase().includes(filterParams.location.toLowerCase())) matches = false;
            if (filterParams.industry && !(alum.industry || '').toLowerCase().includes(filterParams.industry.toLowerCase())) matches = false;
            if (filterParams.role && !(alum.role || '').toLowerCase().includes(filterParams.role.toLowerCase())) matches = false;
            return matches;
        });
    }, [filterParams, searchQuery, users]);

    if (loading) {
        return <div className="p-8 text-center text-text-muted">Loading Directory...</div>;
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-2xl mx-auto text-center space-y-4">
                <h1 className="font-heading text-3xl font-bold text-oxford">Discovery</h1>
                <p className="text-text-secondary">Search the network using names or natural language.</p>
                <form onSubmit={handleSearch} className="relative group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or 'Alumni in Berlin'..."
                        className="w-full card-premium px-6 py-4 focus:outline-none focus:ring-2 focus:ring-oxford/10 transition-all text-lg placeholder:text-text-muted"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-oxford text-gold p-2 rounded-xl hover:bg-oxford/90 transition-colors"
                    >
                        {isSearching ? <span className="animate-spin inline-block">⏳</span> : '🔍'}
                    </button>
                </form>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlumni.length > 0 ? filteredAlumni.map(alum => (
                    <div
                        key={alum.uid}
                        onClick={() => setSelectedAlum(alum)}
                        className="card-premium p-6 hover:border-gold/30 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <img src={alum.photoURL || "https://picsum.photos/seed/user/200/200"} className="w-14 h-14 rounded-full border-2 border-gold/20 object-cover" />
                            <div>
                                <h3 className="font-semibold text-lg text-oxford group-hover:text-gold transition-colors">{alum.displayName || "Unknown User"}</h3>
                                <p className="text-sm text-text-secondary">{alum.role} {alum.company ? `at ${alum.company}` : ''}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {alum.skills?.slice(0, 3).map(skill => (
                                <span key={skill} className="text-[10px] bg-surface-secondary text-text-secondary border border-surface-tertiary px-2 py-1 rounded font-medium">{skill}</span>
                            ))}
                        </div>
                        <div className="text-xs text-text-muted flex justify-between items-center pt-3 border-t border-surface-tertiary">
                            <span>📍 {alum.location || "Earth"}</span>
                            <span className="font-semibold text-oxford">Class of '{alum.graduationYear?.toString().slice(-2) || 'XX'}</span>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-text-muted">No alumni found matching "{searchQuery}". Try a different search.</p>
                    </div>
                )}
            </div>

            {/* Career Path Modal */}
            {selectedAlum && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-oxford/40 backdrop-blur-sm" onClick={() => setSelectedAlum(null)} />
                    <div className="relative card-premium w-full max-w-2xl p-8 shadow-premium animate-in zoom-in-95 duration-200">
                        <button
                            className="absolute top-6 right-6 text-text-muted hover:text-oxford transition-colors"
                            onClick={() => setSelectedAlum(null)}
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-6 mb-8">
                            <img src={selectedAlum.photoURL || "https://picsum.photos/seed/user/200/200"} className="w-20 h-20 rounded-2xl border-2 border-gold object-cover" />
                            <div>
                                <h2 className="font-heading text-2xl font-bold text-oxford">{selectedAlum.displayName}</h2>
                                <p className="text-gold font-medium">{selectedAlum.role} @ {selectedAlum.company}</p>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6">Career Path</h3>
                        {selectedAlum.careerPath ? (
                            <CareerPath path={selectedAlum.careerPath} />
                        ) : (
                            <p className="text-sm text-text-muted italic">No career path data available.</p>
                        )}

                        <div className="mt-8 pt-6 border-t border-surface-tertiary flex justify-between">
                            <button
                                onClick={() => onStartChat(selectedAlum)}
                                className="btn-oxford px-6 py-3 text-sm"
                            >
                                Send Message
                            </button>
                            <button
                                onClick={() => {
                                    if (onViewProfile) onViewProfile(selectedAlum);
                                    setSelectedAlum(null);
                                }}
                                className="px-6 py-3 bg-surface-secondary hover:bg-surface-tertiary text-oxford rounded-xl font-semibold text-sm transition-colors border border-surface-tertiary"
                            >
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Directory;
