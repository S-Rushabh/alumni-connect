
import React, { useState, useEffect, useMemo } from 'react';
import {
    getEvents,
    getUpcomingEvents,
    getPastEvents,
    rsvpToEvent,
    cancelRSVP,
    checkUserRSVP,
    getEventAttendees,
    createEvent,
    submitEventFeedback,
    getEventFeedback,
    getAverageRating
} from '../services/events';
import { getRecommendedAttendees, type AttendeeRecommendation } from '../services/analytics';
import { EventRecommendations } from '../components/events/EventRecommendations';
import type { Event, UserProfile, EventAttendee, EventFeedback } from '../types';

interface Props {
    currentUser?: UserProfile | null;
}

type EventFilter = 'all' | 'upcoming' | 'past';
type EventCategory = 'all' | 'Networking' | 'Career' | 'Social' | 'Workshop' | 'Conference';

const Events: React.FC<Props> = ({ currentUser }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(new Set());
    const [attendeeData, setAttendeeData] = useState<Record<string, AttendeeRecommendation>>({});

    // Filter states
    const [filter, setFilter] = useState<EventFilter>('upcoming');
    const [category, setCategory] = useState<EventCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [eventAttendees, setEventAttendees] = useState<EventAttendee[]>([]);
    const [eventFeedback, setEventFeedback] = useState<EventFeedback[]>([]);
    const [averageRating, setAverageRating] = useState<number>(0);

    // Form states
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'virtual' as 'virtual' | 'physical',
        location: '',
        category: 'Networking',
        capacity: '',
        imageUrl: '',
        tags: '',
        feedbackEnabled: true
    });

    const [feedbackForm, setFeedbackForm] = useState({
        rating: 5,
        comment: ''
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    useEffect(() => {
        if (currentUser) {
            checkUserRSVPs();
        }
    }, [events, currentUser]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let fetched: Event[] = [];
            if (filter === 'upcoming') {
                fetched = await getUpcomingEvents();
            } else if (filter === 'past') {
                fetched = await getPastEvents();
            } else {
                fetched = await getEvents();
            }
            setEvents(fetched);

            // Fetch AI recommendations for each event
            fetched.forEach(async (event) => {
                if (event.id) {
                    const recommendation = await getRecommendedAttendees(
                        event.type || 'virtual',
                        event.category
                    );
                    if (recommendation) {
                        setAttendeeData(prev => ({
                            ...prev,
                            [event.id!]: recommendation
                        }));
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkUserRSVPs = async () => {
        if (!currentUser) return;
        const rsvped = new Set<string>();

        for (const event of events) {
            if (event.id) {
                const hasRSVP = await checkUserRSVP(event.id, currentUser.uid);
                if (hasRSVP) {
                    rsvped.add(event.id);
                }
            }
        }

        setRsvpedEvents(rsvped);
    };

    const handleRSVP = async (event: Event) => {
        if (!currentUser || !event.id) return;

        setSubmitting(true);
        try {
            const isRSVPed = rsvpedEvents.has(event.id);

            if (isRSVPed) {
                await cancelRSVP(event.id, currentUser.uid);
                setRsvpedEvents(prev => {
                    const next = new Set(prev);
                    next.delete(event.id!);
                    return next;
                });
                alert('RSVP cancelled successfully!');
            } else {
                await rsvpToEvent(
                    event.id,
                    currentUser.uid,
                    currentUser.displayName || 'Anonymous',
                    currentUser.photoURL || undefined,
                    currentUser.role,
                    currentUser.company
                );
                setRsvpedEvents(prev => new Set(prev).add(event.id!));
                alert('RSVP successful! 🎉');
            }

            // Refresh events to get updated attendee count
            fetchEvents();
        } catch (error: any) {
            alert(error.message || 'Failed to RSVP');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setSubmitting(true);
        try {
            const eventDate = new Date(`${newEvent.date}T${newEvent.time}`);

            await createEvent({
                title: newEvent.title,
                description: newEvent.description,
                date: eventDate,
                type: newEvent.type,
                location: newEvent.location || undefined,
                category: newEvent.category,
                capacity: newEvent.capacity ? parseInt(newEvent.capacity) : undefined,
                imageUrl: newEvent.imageUrl || undefined,
                tags: newEvent.tags ? newEvent.tags.split(',').map(t => t.trim()).filter(t => t) : [],
                feedbackEnabled: newEvent.feedbackEnabled
            }, currentUser.uid, currentUser.displayName || 'Anonymous');

            alert('Event created successfully! 🎉');
            setShowCreateModal(false);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                type: 'virtual',
                location: '',
                category: 'Networking',
                capacity: '',
                imageUrl: '',
                tags: '',
                feedbackEnabled: true
            });
            fetchEvents();
        } catch (error) {
            alert('Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewAttendees = async (event: Event) => {
        if (!event.id) return;

        setSelectedEvent(event);
        setShowAttendeesModal(true);

        try {
            const attendees = await getEventAttendees(event.id);
            setEventAttendees(attendees);
        } catch (error) {
            console.error('Error fetching attendees:', error);
        }
    };

    const handleViewFeedback = async (event: Event) => {
        if (!event.id) return;

        setSelectedEvent(event);
        setShowFeedbackModal(true);

        try {
            const [feedback, rating] = await Promise.all([
                getEventFeedback(event.id),
                getAverageRating(event.id)
            ]);
            setEventFeedback(feedback);
            setAverageRating(rating);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        }
    };

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedEvent?.id) return;

        setSubmitting(true);
        try {
            await submitEventFeedback({
                eventId: selectedEvent.id,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Anonymous',
                rating: feedbackForm.rating,
                comment: feedbackForm.comment
            });

            alert('Feedback submitted! Thank you! 🙏');
            setFeedbackForm({ rating: 5, comment: '' });
            setShowFeedbackModal(false);

            // Refresh feedback
            if (selectedEvent.id) {
                const feedback = await getEventFeedback(selectedEvent.id);
                setEventFeedback(feedback);
            }
        } catch (error) {
            alert('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEvents = useMemo(() => {
        let result = [...events];

        // Category filter
        if (category !== 'all') {
            result = result.filter(e => e.category === category);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.title.toLowerCase().includes(query) ||
                e.description.toLowerCase().includes(query) ||
                e.category?.toLowerCase().includes(query) ||
                (e.tags && e.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        return result;
    }, [events, category, searchQuery]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const isPastEvent = (event: Event) => {
        if (!event.date) return false;
        const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
        return eventDate < new Date();
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-oxford border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-muted">Loading events...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-oxford">Community Events</h1>
                    <p className="text-text-secondary">Connect, learn, and grow with your alumni network.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-oxford px-6 py-2 text-sm"
                    disabled={!currentUser}
                >
                    + Create Event
                </button>
            </header>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="w-full card-premium px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-oxford/10 transition-all placeholder:text-text-muted"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
                </div>

                {/* Time Filter */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as EventFilter)}
                    className="card-premium px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10 text-oxford font-semibold"
                >
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past Events</option>
                </select>

                {/* Category Filter */}
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="card-premium px-4 py-3 focus:outline-none focus:ring-2 focus:ring-oxford/10 text-oxford font-semibold"
                >
                    <option value="all">All Categories</option>
                    <option value="Networking">Networking</option>
                    <option value="Career">Career</option>
                    <option value="Social">Social</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Conference">Conference</option>
                </select>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
                <div className="card-premium px-5 py-3 text-center">
                    <p className="text-2xl font-bold text-oxford">{filteredEvents.length}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Events</p>
                </div>
                <div className="card-premium px-5 py-3 text-center">
                    <p className="text-2xl font-bold text-oxford">{rsvpedEvents.size}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Your RSVPs</p>
                </div>
            </div>

            {/* Recommendations */}
            {currentUser && <EventRecommendations currentUser={currentUser} />}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredEvents.length > 0 ? filteredEvents.map(event => {
                    const eventAttendees = event.id ? attendeeData[event.id] : null;
                    const isRSVPed = event.id ? rsvpedEvents.has(event.id) : false;
                    const attendeeCount = event.attendees?.length || 0;
                    const isOrganizer = currentUser && event.organizer === currentUser.uid;
                    const past = isPastEvent(event);
                    const atCapacity = event.capacity && attendeeCount >= event.capacity;

                    return (
                        <div key={event.id} className="relative group">
                            <div className="absolute inset-0 bg-gold rounded-3xl blur-[40px] opacity-0 group-hover:opacity-5 transition-opacity" />
                            <div className="relative card-premium h-full flex flex-col group-hover:shadow-premium transition-all overflow-hidden p-0">

                                {event.imageUrl && (
                                    <div className="h-48 w-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute bottom-4 left-6 z-20">
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                                                {event.category || 'Event'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-wrap gap-2">
                                            {!event.imageUrl && (
                                                <span className="px-3 py-1 bg-oxford/5 border border-oxford/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-oxford">
                                                    {event.type}
                                                </span>
                                            )}
                                            {/* Show category tag only if no image, as image has it overlaid */}
                                            {!event.imageUrl && event.category && (
                                                <span className="px-3 py-1 bg-gold/5 border border-gold/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-gold">
                                                    {event.category}
                                                </span>
                                            )}
                                            {past && (
                                                <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                    Past
                                                </span>
                                            )}
                                            {event.tags && event.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-slate-100 rounded-md text-[9px] font-medium text-slate-600">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-text-muted font-bold text-sm">
                                            {typeof event.date === 'string' ? event.date : new Date(event.date.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h2 className="font-heading text-2xl font-bold mb-4 text-oxford group-hover:text-gold transition-colors">{event.title}</h2>
                                    <p className="text-text-secondary text-sm mb-6 flex-1 leading-relaxed line-clamp-3">{event.description}</p>

                                    {event.location && (
                                        <p className="text-sm text-text-muted mb-4">📍 {event.location}</p>
                                    )}

                                    {/* Attendees */}
                                    <div className="bg-gold/5 border border-gold/20 p-4 rounded-2xl mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-2">
                                                <span>👥</span> {attendeeCount} Attending
                                                {event.capacity && ` / ${event.capacity}`}
                                            </h3>
                                            {attendeeCount > 0 && (
                                                <button
                                                    onClick={() => handleViewAttendees(event)}
                                                    className="text-[10px] text-gold hover:underline font-bold"
                                                >
                                                    View All →
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex -space-x-2">
                                            {eventAttendees ? (
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
                                            ) : attendeeCount > 0 ? (
                                                <div className="text-xs text-gold/70">
                                                    {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gold/70">Be the first to RSVP!</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        {!past && (
                                            <button
                                                onClick={() => handleRSVP(event)}
                                                disabled={!currentUser || submitting || !!atCapacity}
                                                className={`flex-1 font-bold py-3 rounded-xl transition-all ${isRSVPed
                                                    ? 'bg-success text-white'
                                                    : atCapacity
                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'btn-oxford'
                                                    }`}
                                            >
                                                {isRSVPed ? '✓ Registered' : atCapacity ? 'Full' : 'RSVP Now'}
                                            </button>
                                        )}

                                        {past && event.feedbackEnabled && isRSVPed && (
                                            <button
                                                onClick={() => handleViewFeedback(event)}
                                                className="flex-1 card-premium hover:border-gold/30 text-oxford font-semibold py-3 rounded-xl transition-all"
                                            >
                                                ⭐ Feedback
                                            </button>
                                        )}

                                        {isOrganizer && (
                                            <button
                                                onClick={() => handleViewAttendees(event)}
                                                className="flex-1 card-premium hover:border-oxford/30 text-oxford font-semibold py-3 rounded-xl transition-all"
                                            >
                                                📋 Manage
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-16 text-center">
                        <p className="text-4xl mb-4">📅</p>
                        <p className="text-text-muted text-lg">No events found matching your criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setCategory('all'); }}
                            className="mt-4 text-gold hover:underline font-bold"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="card-premium p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-oxford">Create New Event</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-oxford text-2xl">×</button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Event Title *</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Alumni Networking Mixer"
                                    required
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Description *</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Describe your event..."
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Date *</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Time *</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Type *</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as 'virtual' | 'physical' })}
                                        className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                    >
                                        <option value="virtual">Virtual</option>
                                        <option value="physical">Physical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Category *</label>
                                    <select
                                        value={newEvent.category}
                                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                    >
                                        <option value="Networking">Networking</option>
                                        <option value="Career">Career</option>
                                        <option value="Social">Social</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Conference">Conference</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">
                                    Location {newEvent.type === 'physical' && '*'}
                                </label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                    placeholder={newEvent.type === 'virtual' ? 'Zoom link (optional)' : 'Event venue'}
                                    required={newEvent.type === 'physical'}
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Cover Image URL (Optional)</label>
                                <input
                                    type="url"
                                    value={newEvent.imageUrl}
                                    onChange={(e) => setNewEvent({ ...newEvent, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Tags (Comma separated)</label>
                                <input
                                    type="text"
                                    value={newEvent.tags}
                                    onChange={(e) => setNewEvent({ ...newEvent, tags: e.target.value })}
                                    placeholder="AI, Workshop, Mentorship"
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Capacity (Optional)</label>
                                <input
                                    type="number"
                                    value={newEvent.capacity}
                                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                                    placeholder="Leave empty for unlimited"
                                    min="1"
                                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="feedbackEnabled"
                                    checked={newEvent.feedbackEnabled}
                                    onChange={(e) => setNewEvent({ ...newEvent, feedbackEnabled: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <label htmlFor="feedbackEnabled" className="text-sm text-oxford font-medium">
                                    Enable feedback collection after event
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-oxford flex-1 py-3"
                                >
                                    {submitting ? 'Creating...' : 'Create Event'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 text-text-muted hover:text-oxford transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendees Modal */}
            {showAttendeesModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAttendeesModal(false)}>
                    <div className="card-premium p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-oxford mb-1">Event Attendees</h2>
                                <p className="text-gold font-semibold">{selectedEvent.title}</p>
                                <p className="text-sm text-text-muted mt-1">{eventAttendees.length} {eventAttendees.length === 1 ? 'person' : 'people'} attending</p>
                            </div>
                            <button onClick={() => setShowAttendeesModal(false)} className="text-text-muted hover:text-oxford text-2xl">×</button>
                        </div>

                        {eventAttendees.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-4xl mb-4">👥</p>
                                <p className="text-text-muted">No attendees yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {eventAttendees.map((attendee) => (
                                    <div key={attendee.uid} className="flex items-center gap-4 p-4 bg-surface-secondary rounded-xl border border-surface-tertiary">
                                        <div className="w-12 h-12 rounded-full bg-oxford text-gold flex items-center justify-center font-bold">
                                            {getInitials(attendee.name)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-oxford">{attendee.name}</p>
                                            {attendee.role && attendee.company && (
                                                <p className="text-sm text-text-secondary">{attendee.role} at {attendee.company}</p>
                                            )}
                                        </div>
                                        {attendee.rsvpedAt && (
                                            <p className="text-xs text-text-muted">
                                                RSVP'd {new Date(attendee.rsvpedAt.toDate()).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFeedbackModal(false)}>
                    <div className="card-premium p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-oxford mb-1">Event Feedback</h2>
                                <p className="text-gold font-semibold">{selectedEvent.title}</p>
                                {averageRating > 0 && (
                                    <p className="text-sm text-text-muted mt-1">
                                        Average Rating: {'⭐'.repeat(Math.round(averageRating))} ({averageRating.toFixed(1)})
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setShowFeedbackModal(false)} className="text-text-muted hover:text-oxford text-2xl">×</button>
                        </div>

                        {/* Submit Feedback Form */}
                        <form onSubmit={handleSubmitFeedback} className="mb-6 p-4 bg-gold/5 border border-gold/20 rounded-xl">
                            <h3 className="text-sm font-bold text-oxford mb-3">Share Your Experience</h3>

                            <div className="mb-3">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                            className={`text-3xl transition-all ${star <= feedbackForm.rating ? 'text-gold' : 'text-gray-300'}`}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Comment (Optional)</label>
                                <textarea
                                    value={feedbackForm.comment}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                                    placeholder="What did you think about this event?"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-surface-tertiary rounded-xl text-oxford focus:outline-none focus:ring-2 focus:ring-oxford/10 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-oxford w-full py-2"
                            >
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </form>

                        {/* Existing Feedback */}
                        <div>
                            <h3 className="text-sm font-bold text-oxford mb-3">All Feedback ({eventFeedback.length})</h3>
                            {eventFeedback.length === 0 ? (
                                <p className="text-center text-text-muted py-8">No feedback yet. Be the first!</p>
                            ) : (
                                <div className="space-y-3">
                                    {eventFeedback.map((fb) => (
                                        <div key={fb.id} className="p-4 bg-surface-secondary rounded-xl border border-surface-tertiary">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-oxford">{fb.userName}</p>
                                                <div className="flex">
                                                    {Array.from({ length: fb.rating }).map((_, i) => (
                                                        <span key={i} className="text-gold">⭐</span>
                                                    ))}
                                                </div>
                                            </div>
                                            {fb.comment && (
                                                <p className="text-sm text-text-secondary">{fb.comment}</p>
                                            )}
                                            <p className="text-xs text-text-muted mt-2">
                                                {new Date(fb.createdAt.toDate()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
