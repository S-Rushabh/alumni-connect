import { MapPin, Briefcase } from 'lucide-react';
import type { Job } from '../types';

interface JobCardProps {
    job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                    <p className="text-blue-600 font-medium">{job.company}</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {new Date(job.createdAt.seconds * 1000).toLocaleDateString()}
                </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Briefcase size={14} />
                    <span>Full-time</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {job.requirements?.slice(0, 3).map((req, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md">
                        {req}
                    </span>
                ))}
            </div>

            <button className="w-full mt-5 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium py-2 rounded-lg transition-colors text-sm">
                View Details
            </button>
        </div>
    );
};

export default JobCard;
