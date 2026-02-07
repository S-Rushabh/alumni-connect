
import type { Alum, Job, Event } from './types';

export const MOCK_ALUMNI: Alum[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        role: 'Lead AI Engineer',
        company: 'Anthropic',
        location: 'San Francisco, CA',
        gradYear: 2019,
        industry: 'Tech',
        skills: ['PyTorch', 'Large Language Models', 'MLOps'],
        bio: 'Pioneering safe AI systems and scalable infrastructure.',
        avatar: 'https://picsum.photos/seed/sarah/200/200',
        careerPath: [
            { id: '1a', title: 'Graduated', org: 'Tech Institute', year: '2019' },
            { id: '1b', title: 'Junior ML dev', org: 'NVIDIA', year: '2019-2021' },
            { id: '1c', title: 'Lead AI Engineer', org: 'Anthropic', year: '2022-Present' }
        ]
    },
    {
        id: '2',
        name: 'Marcus Thorne',
        role: 'Founder',
        company: 'EcoStream',
        location: 'Berlin, DE',
        gradYear: 2017,
        industry: 'Green Tech',
        skills: ['Sustainability', 'Seed Funding', 'Renewable Energy'],
        bio: 'Building the next generation of power distribution for European cities.',
        avatar: 'https://picsum.photos/seed/marcus/200/200',
        careerPath: [
            { id: '2a', title: 'Graduated', org: 'Tech Institute', year: '2017' },
            { id: '2b', title: 'Analyst', org: 'Siemens', year: '2017-2019' },
            { id: '2c', title: 'Founder', org: 'EcoStream', year: '2020-Present' }
        ]
    }
];

export const MOCK_JOBS: Job[] = [
    {
        id: 'j1',
        title: 'Senior Product Designer',
        company: 'Stripe',
        location: 'Remote',
        referralProb: 85,
        missingSkills: ['Framer', 'Prototyping'],
        description: 'Lead design systems for global payment infrastructure.',
        postedBy: 'system',
        createdAt: new Date().toISOString()
    },
    {
        id: 'j2',
        title: 'Quantum Researcher',
        company: 'Google',
        location: 'Zurich, CH',
        referralProb: 12,
        missingSkills: ['Quantum Cryptography', 'Python'],
        description: 'Explore the boundaries of error-corrected quantum computing.',
        postedBy: 'system',
        createdAt: new Date().toISOString()
    }
];

export const MOCK_EVENTS: Event[] = [
    {
        id: 'e1',
        title: 'Fintech Alumni Summit',
        date: 'Oct 15, 2024',
        type: 'virtual',
        description: 'Deep dive into digital banking trends with industry leaders.'
    },
    {
        id: 'e2',
        title: 'NYC Networking Gala',
        date: 'Nov 2, 2024',
        type: 'physical',
        description: 'Annual gathering at the Pierre Hotel.'
    }
];
