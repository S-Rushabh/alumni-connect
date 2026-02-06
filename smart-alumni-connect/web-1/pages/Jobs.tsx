
import React from 'react';
import { MOCK_JOBS, MOCK_ALUMNI } from '../constants';
import { Alum } from '../types';

interface Props {
  onAskReferral: (alum: Alum) => void;
}

const Jobs: React.FC<Props> = ({ onAskReferral }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Opportunity</h1>
          <p className="text-slate-500">Jobs matched to your unique network connections.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm">Saved</button>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-all shadow-lg">Post a Job</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_JOBS.map(job => (
          <div key={job.id} className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-indigo-200 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1 text-slate-900">{job.title}</h2>
                <p className="text-indigo-600 font-semibold">{job.company}</p>
                <p className="text-sm text-slate-400 mt-1 font-medium">📍 {job.location}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Referral Prob</div>
                <div className={`text-2xl font-black ${job.referralProb > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {job.referralProb}%
                </div>
              </div>
            </div>

            <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed">{job.description}</p>

            <div className="space-y-4 mb-8">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skill Gap Analysis</h3>
              <div className="flex flex-wrap gap-2">
                {job.missingSkills.map(skill => (
                  <div key={skill} className="flex items-center gap-2 bg-pink-50 border border-pink-100 text-pink-600 px-3 py-1.5 rounded-xl text-xs font-medium">
                    <span className="opacity-70">⚠️</span> Missing {skill}
                  </div>
                ))}
              </div>
              <p className="text-xs text-indigo-600 font-medium italic">
                Tip: Connect with <strong className="font-bold text-indigo-700">Sarah Chen</strong> (Class of '19) who is an expert in these!
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => alert(`Redirecting to application portal for ${job.title} at ${job.company}`)}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Apply Now
              </button>
              <button 
                onClick={() => onAskReferral(MOCK_ALUMNI[0])}
                className="px-6 bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 font-bold rounded-xl transition-colors shadow-sm"
              >
                Ask for Referral
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
