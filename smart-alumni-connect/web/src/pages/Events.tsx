
import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/events';
import { getRecommendedAttendees, type AttendeeRecommendation } from '../services/analytics';
import type { Event } from '../types';

const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
    const [isRegistering, setIsRegistering] = useState<string | null>(null);
    const [attendeeData, setAttendeeData] = useState<Record<string, AttendeeRecommendation>>({});
    const [loadingAttendees, setLoadingAttendees] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchEvents = async () => {
            const fetched = await getEvents();
            setEvents(fetched);

            // Fetch attendee recommendations for each event
            fetched.forEach(async (event) => {
                if (event.id) {
                    setLoadingAttendees(prev => new Set([...prev, event.id!]));
                    const recommendation = await getRecommendedAttendees(
                        event.type || 'virtual',
                        undefined,
                        undefined
                    );
                    if (recommendation) {
                        setAttendeeData(prev => ({
                            ...prev,
                            [event.id!]: recommendation
                        }));
                    }
                    setLoadingAttendees(prev => {
                        const next = new Set(prev);
                        next.delete(event.id!);
                        return next;
                    });
                }
            });
        };
        fetchEvents();
    }, []);

    const handleRSVP = (id: string) => {
        setIsRegistering(id);
        setTimeout(() => {
            setRsvpedIds(prev => new Set([...prev, id]));
            setIsRegistering(null);
        }, 1000);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="space-y-10 pb-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-oxford">Community</h1>
                    <p className="text-text-secondary">Events that turn classmates into colleagues.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {events.length > 0 ? events.map(event => {
                    const eventAttendees = event.id ? attendeeData[event.id] : null;
                    const isLoadingEvent = event.id ? loadingAttendees.has(event.id) : false;

                    return (
                        <div key={event.id} className="relative group">
                            <div className="absolute inset-0 bg-gold rounded-3xl blur-[40px] opacity-0 group-hover:opacity-5 transition-opacity" />
                            <div className="relative card-premium p-8 h-full flex flex-col group-hover:shadow-premium transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-3 py-1 bg-oxford/5 border border-oxford/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-oxford">
                                        {event.type}
                                    </span>
                                    <span className="text-text-muted font-bold text-sm">
                                        {typeof event.date === 'string' ? event.date : new Date(event.date.seconds * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                                <h2 className="font-heading text-2xl font-bold mb-4 text-oxford group-hover:text-gold transition-colors">{event.title}</h2>
                                <p className="text-text-secondary text-sm mb-8 flex-1 leading-relaxed">{event.description}</p>

                                <div className="bg-gold/5 border border-gold/20 p-4 rounded-2xl mb-6">
                                    <h3 className="text-[10px] font-bold text-gold uppercase mb-3 tracking-widest flex items-center gap-2">
                                        <span>👑</span> AI-Recommended Attendees
                                    </h3>
                                    <div className="flex -space-x-2">
                                        {isLoadingEvent ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                                            </div>
                                        ) : eventAttendees ? (
                                            <>
                                                {eventAttendees.recommended_attendees.slice(0, 4).map((attendee) => (
                                                    <div
                                                        key={attendee.uid}
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-oxford text-gold flex items-center justify-center text-[10px] font-bold cursor-help"
                                                        title={`${attendee.name} - ${attendee.role} at ${attendee.company}`}
                                                    >
                                                        {getInitials(attendee.name)}
                                                    </div>
                                                ))}
                                                {eventAttendees.total_interested > 4 && (
                                                    <div className="w-8 h-8 rounded-full bg-oxford text-gold flex items-center justify-center text-[10px] font-bold border-2 border-white">
                                                        +{eventAttendees.total_interested - 4}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            // Fallback
                                            <>
                                                {[1, 2, 3, 4].map(i => (
                                                    <img key={i} src={`https://picsum.photos/seed/${i + 10}/40/40`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                                                ))}
                                                <div className="w-8 h-8 rounded-full bg-oxford text-gold flex items-center justify-center text-[10px] font-bold">+12</div>
                                            </>
                                        )}
                                    </div>
                                    {eventAttendees && (
                                        <p className="text-[10px] text-gold/70 mt-2">
                                            {eventAttendees.match_reason}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => event.id && !rsvpedIds.has(event.id) && handleRSVP(event.id)}
                                    disabled={event.id ? isRegistering === event.id : true}
                                    className={`w-full font-bold py-3 rounded-xl transition-all ${event.id && rsvpedIds.has(event.id)
                                        ? 'bg-success text-white cursor-default'
                                        : 'btn-oxford'
                                        }`}
                                >
                                    {event.id && isRegistering === event.id ? 'Registering...' : (event.id && rsvpedIds.has(event.id) ? '✓ Registered' : 'RSVP Now')}
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-12 text-center text-text-muted">No upcoming events found.</div>
                )}
            </div>
        </div>
    );
};

export default Events;

