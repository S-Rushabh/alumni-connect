import { createEvent } from './services/events';
// import { collection, addDoc } from 'firebase/firestore';

// Sample events to populate the database
const sampleEvents = [
    {
        title: "Alumni Networking Mixer",
        description: "Join us for an evening of networking with fellow alumni. Connect with professionals across various industries, share experiences, and build meaningful relationships.",
        date: new Date('2026-03-15T18:00:00'),
        type: 'physical' as const,
        location: "Grand Ballroom, Alumni Center, New York",
        category: "Networking",
        capacity: 50,
        feedbackEnabled: true
    },
    {
        title: "Career Development Workshop",
        description: "Learn essential skills for career advancement including resume building, interview techniques, and personal branding strategies from industry experts.",
        date: new Date('2026-03-20T14:00:00'),
        type: 'virtual' as const,
        location: "Zoom (link will be sent after RSVP)",
        category: "Career",
        capacity: 100,
        feedbackEnabled: true
    },
    {
        title: "Tech Talk: AI in 2026",
        description: "Explore the latest developments in artificial intelligence with leading researchers and practitioners. Topics include machine learning, neural networks, and ethical AI.",
        date: new Date('2026-03-25T19:00:00'),
        type: 'virtual' as const,
        location: "Microsoft Teams",
        category: "Workshop",
        feedbackEnabled: true
    },
    {
        title: "Annual Alumni Gala",
        description: "Our prestigious annual gala celebrating alumni achievements. Enjoy dinner, entertainment, and recognition of outstanding alumni contributions.",
        date: new Date('2026-04-10T19:00:00'),
        type: 'physical' as const,
        location: "Hilton Hotel, Downtown",
        category: "Social",
        capacity: 200,
        feedbackEnabled: true
    },
    {
        title: "Startup Pitch Competition",
        description: "Watch alumni entrepreneurs pitch their innovative startups. Network with founders, investors, and industry leaders. Cash prizes for winners!",
        date: new Date('2026-04-15T16:00:00'),
        type: 'physical' as const,
        location: "Innovation Hub, Campus",
        category: "Conference",
        capacity: 75,
        feedbackEnabled: true
    },
    {
        title: "Mentorship Program Kickoff",
        description: "Launch event for our alumni mentorship program. Meet potential mentors and mentees, learn about program structure, and start building connections.",
        date: new Date('2026-03-28T17:00:00'),
        type: 'virtual' as const,
        location: "Zoom",
        category: "Career",
        capacity: 150,
        feedbackEnabled: true
    },
    {
        title: "Alumni Sports Day",
        description: "Relive your college days with friendly sports competitions! Basketball, soccer, volleyball, and more. All skill levels welcome. Lunch provided.",
        date: new Date('2026-04-05T10:00:00'),
        type: 'physical' as const,
        location: "University Sports Complex",
        category: "Social",
        capacity: 80,
        feedbackEnabled: true
    },
    {
        title: "Women in Leadership Panel",
        description: "Hear from successful women alumni leaders about their career journeys, challenges overcome, and advice for aspiring leaders. Q&A session included.",
        date: new Date('2026-03-30T18:30:00'),
        type: 'virtual' as const,
        location: "Google Meet",
        category: "Conference",
        feedbackEnabled: true
    }
];

// Function to create all sample events
export async function createSampleEvents(organizerUid: string, organizerName: string) {
    console.log('Creating sample events...');

    for (const event of sampleEvents) {
        try {
            await createEvent(event, organizerUid, organizerName);
            console.log(`Created event: ${event.title}`);
        } catch (error) {
            console.error(`Failed to create event ${event.title}:`, error);
        }
    }

    console.log('Sample events creation complete!');
}

// To use this, import and call in your component:
// import { createSampleEvents } from './seed-events';
// createSampleEvents('your-user-id', 'Your Name');
