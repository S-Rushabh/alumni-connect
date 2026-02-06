
import React, { useState, useMemo } from 'react';
import { MOCK_ALUMNI } from '../constants';
import { Alum } from '../types';
import CareerPath from '../components/CareerPath';
import { parseSemanticSearch } from '../services/geminiService';

interface Props {
  onStartChat: (alum: Alum) => void;
  onViewProfile: (alum: Alum) => void;
}

const Directory: React.FC<Props> = ({ onStartChat, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlum, setSelectedAlum] = useState<Alum | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filterParams, setFilterParams] = useState<any>(null);

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
    // Basic search filtering (Name, Role, Company)
    const baseFiltered = searchQuery.length > 0 
      ? MOCK_ALUMNI.filter(alum => 
          alum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alum.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alum.company.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : MOCK_ALUMNI;

    // Further refine if AI semantic params are present
    if (!filterParams) return baseFiltered;
    
    return baseFiltered.filter(alum => {
      let matches = true;
      if (filterParams.location && !alum.location.toLowerCase().includes(filterParams.location.toLowerCase())) matches = false;
      if (filterParams.industry && !alum.industry.toLowerCase().includes(filterParams.industry.toLowerCase())) matches = false;
      if (filterParams.role && !alum.role.toLowerCase().includes(filterParams.role.toLowerCase())) matches = false;
      return matches;
    });
  }, [filterParams, searchQuery]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Discovery</h1>
        <p className="text-slate-500">Search the network using names or natural language.</p>
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or 'Alumni in Berlin'..."
            className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg placeholder:text-gray-400 shadow-sm"
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {isSearching ? <span className="animate-spin inline-block">⏳</span> : '🔍'}
          </button>
        </form>
        {filterParams && (
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(filterParams).map(([key, val]) => val && (
              <span key={key} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-full font-bold uppercase">
                {key}: {val as string}
              </span>
            ))}
            <button 
              onClick={() => {setFilterParams(null); setSearchQuery('');}}
              className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full font-bold uppercase"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.length > 0 ? filteredAlumni.map(alum => (
          <div 
            key={alum.id}
            onClick={() => setSelectedAlum(alum)}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <img src={alum.avatar} className="w-14 h-14 rounded-full border border-gray-50 object-cover" />
              <div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{alum.name}</h3>
                <p className="text-sm text-slate-500 font-medium">{alum.role} at {alum.company}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {alum.skills.slice(0, 3).map(skill => (
                <span key={skill} className="text-[10px] bg-gray-50 text-gray-600 border border-gray-100 px-2 py-1 rounded font-medium">{skill}</span>
              ))}
            </div>
            <div className="text-xs text-gray-400 flex justify-between items-center pt-2 border-t border-gray-50">
              <span>📍 {alum.location}</span>
              <span className="font-semibold text-slate-500">Class of '{alum.gradYear.toString().slice(-2)}</span>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-400">No alumni found matching "{searchQuery}". Try a different search.</p>
          </div>
        )}
      </div>

      {/* Career Path Modal */}
      {selectedAlum && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedAlum(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl p-8 border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              className="absolute top-6 right-6 text-gray-400 hover:text-slate-900 transition-colors"
              onClick={() => setSelectedAlum(null)}
            >
              ✕
            </button>
            <div className="flex items-center gap-6 mb-8">
              <img src={selectedAlum.avatar} className="w-20 h-20 rounded-2xl border border-gray-100 shadow-sm object-cover" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedAlum.name}</h2>
                <p className="text-indigo-600 font-medium">{selectedAlum.role} @ {selectedAlum.company}</p>
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Career Path Visualization</h3>
            <CareerPath path={selectedAlum.careerPath} />
            
            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between">
              <button 
                onClick={() => onStartChat(selectedAlum)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                Send Message
              </button>
              <button 
                onClick={() => {
                  onViewProfile(selectedAlum);
                  setSelectedAlum(null);
                }}
                className="px-6 py-2 bg-gray-50 hover:bg-gray-100 text-slate-700 rounded-xl font-bold text-sm transition-colors border border-gray-200"
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
