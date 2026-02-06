import { MapPin } from 'lucide-react';
import type { Event } from '../types';

interface EventCardProps {
    event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
    const dateObj = new Date(event.date.seconds * 1000);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                <div className="absolute -bottom-6 left-6 bg-white p-3 rounded-xl shadow-sm text-center min-w-[60px]">
                    <div className="text-xs text-gray-500 font-bold uppercase">{dateObj.toLocaleString('default', { month: 'short' })}</div>
                    <div className="text-xl font-bold text-gray-900">{dateObj.getDate()}</div>
                </div>
            </div>

            <div className="pt-8 px-6 pb-6 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{event.title}</h3>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{event.location}</span>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                    {event.description}
                </p>

                <button className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    RSVP Now
                </button>
            </div>
        </div>
    );
};

export default EventCard;
