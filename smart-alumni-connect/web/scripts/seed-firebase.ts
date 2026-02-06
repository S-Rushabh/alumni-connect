import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, Timestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBRps4jvUooo22Bu1LoJNJQ6MCobz8kuLA",
    authDomain: "smart-alumni-hackathon.firebaseapp.com",
    projectId: "smart-alumni-hackathon",
    storageBucket: "smart-alumni-hackathon.firebasestorage.app",
    messagingSenderId: "693915056343",
    appId: "1:693915056343:web:1f0154a7ca5150555d5892",
    measurementId: "G-L8D2V2Y78L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Demo Users - password is always pass@1234
const demoUsers = [
    {
        email: "sarah.chen@alumni.edu",
        displayName: "Sarah Chen",
        role: "alumni",
        company: "Google",
        location: "Mumbai",
        industry: "Technology",
        skills: ["Python", "TensorFlow", "Machine Learning", "Data Science"],
        bio: "Senior ML Engineer at Google with 8+ years of experience in building scalable AI systems. Passionate about mentoring the next generation of tech leaders.",
        graduationYear: 2016,
        mentorshipStatus: "available",
        vibePulse: "Elite"
    },
    {
        email: "mike.ross@alumni.edu",
        displayName: "Mike Ross",
        role: "alumni",
        company: "Netflix",
        location: "New York",
        industry: "Entertainment Tech",
        skills: ["React", "Node.js", "TypeScript", "AWS"],
        bio: "Staff Software Engineer leading the streaming infrastructure team. Former startup founder with a passion for building products that scale.",
        graduationYear: 2018,
        mentorshipStatus: "available",
        vibePulse: "High"
    },
    {
        email: "priya.sharma@alumni.edu",
        displayName: "Priya Sharma",
        role: "alumni",
        company: "Microsoft",
        location: "London",
        industry: "Cloud Computing",
        skills: ["Azure", "Docker", "Kubernetes", "Go"],
        bio: "Principal Cloud Architect helping enterprises transform their infrastructure. Love to share knowledge through tech talks and open source.",
        graduationYear: 2015,
        mentorshipStatus: "available",
        vibePulse: "Elite"
    },
    {
        email: "james.wilson@alumni.edu",
        displayName: "James Wilson",
        role: "alumni",
        company: "Stripe",
        location: "Singapore",
        industry: "Fintech",
        skills: ["JavaScript", "Python", "PostgreSQL", "System Design"],
        bio: "Engineering Manager at Stripe working on payment infrastructure. Previously at PayPal and Square. Open to coffee chats!",
        graduationYear: 2017,
        mentorshipStatus: "seeking",
        vibePulse: "High"
    },
    {
        email: "maria.garcia@alumni.edu",
        displayName: "Maria Garcia",
        role: "alumni",
        company: "Airbnb",
        location: "Berlin",
        industry: "Product Design",
        skills: ["Figma", "UX Research", "Design Systems", "Prototyping"],
        bio: "Lead Product Designer crafting delightful experiences for millions of travelers. Advocate for inclusive design and accessibility.",
        graduationYear: 2019,
        mentorshipStatus: "available",
        vibePulse: "Rising"
    },
    {
        email: "raj.patel@alumni.edu",
        displayName: "Raj Patel",
        role: "student",
        company: "University",
        location: "Mumbai",
        industry: "Computer Science",
        skills: ["React", "Python", "SQL"],
        bio: "Final year CS student looking for opportunities in full-stack development. Currently working on open source projects.",
        graduationYear: 2025,
        mentorshipStatus: "seeking",
        vibePulse: "Rising"
    },
    {
        email: "emma.taylor@alumni.edu",
        displayName: "Emma Taylor",
        role: "teacher",
        company: "University",
        location: "London",
        industry: "Education",
        skills: ["Research", "Data Science", "Machine Learning", "Python"],
        bio: "Associate Professor in Computer Science. Research focus on AI Ethics and Responsible ML. Always happy to guide students.",
        graduationYear: 2010,
        mentorshipStatus: "available",
        vibePulse: "Elite"
    },
    {
        email: "alex.kim@alumni.edu",
        displayName: "Alex Kim",
        role: "alumni",
        company: "Tesla",
        location: "New York",
        industry: "Automotive Tech",
        skills: ["C++", "Embedded Systems", "Computer Vision", "ROS"],
        bio: "Autonomous Vehicles Engineer working on perception systems. Previously at Waymo. Fascinated by the intersection of AI and robotics.",
        graduationYear: 2014,
        mentorshipStatus: "available",
        vibePulse: "Elite"
    }
];

// Demo Events
const demoEvents = [
    {
        title: "AI & Machine Learning Summit 2026",
        type: "virtual",
        description: "Join industry leaders from Google, Microsoft, and OpenAI for a deep dive into the latest trends in AI/ML. Topics include LLMs, generative AI, and responsible AI practices.",
        date: Timestamp.fromDate(new Date("2026-03-15T10:00:00")),
        organizer: "Alumni Association",
        attendees: []
    },
    {
        title: "Startup Founders Mixer",
        type: "physical",
        description: "An exclusive networking event for alumni entrepreneurs. Share your journey, find co-founders, and connect with angel investors from our alumni network.",
        date: Timestamp.fromDate(new Date("2026-02-28T18:00:00")),
        organizer: "Career Services",
        attendees: []
    },
    {
        title: "Women in Tech Leadership Panel",
        type: "virtual",
        description: "Hear from trailblazing women leaders in tech, including CTOs and VPs from Fortune 500 companies. Q&A session included.",
        date: Timestamp.fromDate(new Date("2026-03-08T15:00:00")),
        organizer: "Diversity Council",
        attendees: []
    },
    {
        title: "Annual Alumni Homecoming Gala",
        type: "physical",
        description: "The biggest event of the year! Celebrate with fellow alumni, enjoy live music, and reconnect with old friends. Black tie optional.",
        date: Timestamp.fromDate(new Date("2026-04-20T19:00:00")),
        organizer: "Alumni Association",
        attendees: []
    }
];

// Demo Jobs
const demoJobs = [
    {
        title: "Senior Software Engineer",
        company: "Google",
        location: "Mumbai, India",
        description: "Join our Search team to build the next generation of search experiences. Work on large-scale distributed systems serving billions of queries daily.",
        requirements: ["Python", "Go", "Distributed Systems", "5+ years experience"],
        postedBy: "system",
        postedByName: "Sarah Chen (Google)",
        referralProb: 85,
        missingSkills: []
    },
    {
        title: "Product Manager - AI Products",
        company: "Microsoft",
        location: "London, UK",
        description: "Lead product strategy for our AI-powered productivity tools. Work closely with engineering and design to ship features used by millions.",
        requirements: ["Product Management", "AI/ML", "Stakeholder Management", "3+ years experience"],
        postedBy: "system",
        postedByName: "Priya Sharma (Microsoft)",
        referralProb: 72,
        missingSkills: ["Product Strategy"]
    },
    {
        title: "Full Stack Developer",
        company: "Stripe",
        location: "Remote",
        description: "Build and scale financial infrastructure used by millions of businesses. Work with React, Node.js, and Ruby in a fast-paced environment.",
        requirements: ["React", "Node.js", "PostgreSQL", "2+ years experience"],
        postedBy: "system",
        postedByName: "James Wilson (Stripe)",
        referralProb: 90,
        missingSkills: []
    },
    {
        title: "Machine Learning Engineer",
        company: "Tesla",
        location: "New York, USA",
        description: "Work on computer vision and perception systems for autonomous vehicles. Push the boundaries of what's possible with deep learning.",
        requirements: ["Python", "PyTorch", "Computer Vision", "C++"],
        postedBy: "system",
        postedByName: "Alex Kim (Tesla)",
        referralProb: 68,
        missingSkills: ["Computer Vision", "C++"]
    },
    {
        title: "UX Designer - Design Systems",
        company: "Airbnb",
        location: "Berlin, Germany",
        description: "Help us scale our design language across all products. Create components, documentation, and tooling for design systems.",
        requirements: ["Figma", "Design Systems", "React", "Communication"],
        postedBy: "system",
        postedByName: "Maria Garcia (Airbnb)",
        referralProb: 78,
        missingSkills: []
    }
];

async function seedDatabase() {
    console.log("🚀 Starting Firebase seeding...\n");

    // 1. Create Demo Users
    console.log("👥 Creating demo users...");
    for (const user of demoUsers) {
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                user.email,
                "pass@1234"
            );
            const uid = userCredential.user.uid;

            // Create Firestore profile
            const profile = {
                uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`,
                role: user.role,
                company: user.company,
                location: user.location,
                industry: user.industry,
                skills: user.skills,
                bio: user.bio,
                graduationYear: user.graduationYear,
                mentorshipStatus: user.mentorshipStatus,
                vibePulse: user.vibePulse,
                points: Math.floor(Math.random() * 500) + 100,
                badges: ["Verified Alumni"],
                verification: {
                    isVerified: true,
                    certificateHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
                    issuedAt: Timestamp.now()
                },
                gamification: {
                    points: Math.floor(Math.random() * 500) + 100,
                    badges: ["Verified Alumni", user.role === "alumni" ? "Network Builder" : "Active Learner"]
                }
            };

            await setDoc(doc(db, "users", uid), profile);
            console.log(`  ✅ Created: ${user.displayName} (${user.email})`);
        } catch (error: any) {
            if (error.code === "auth/email-already-in-use") {
                console.log(`  ⚠️ Skipped: ${user.email} (already exists)`);
            } else {
                console.error(`  ❌ Error creating ${user.email}:`, error.message);
            }
        }
    }

    // 2. Create Demo Events
    console.log("\n📅 Creating demo events...");
    for (const event of demoEvents) {
        try {
            const eventRef = doc(collection(db, "events"));
            await setDoc(eventRef, event);
            console.log(`  ✅ Created: ${event.title}`);
        } catch (error: any) {
            console.error(`  ❌ Error creating event:`, error.message);
        }
    }

    // 3. Create Demo Jobs
    console.log("\n💼 Creating demo jobs...");
    for (const job of demoJobs) {
        try {
            const jobRef = doc(collection(db, "jobs"));
            await setDoc(jobRef, {
                ...job,
                createdAt: Timestamp.now(),
                applicants: []
            });
            console.log(`  ✅ Created: ${job.title} at ${job.company}`);
        } catch (error: any) {
            console.error(`  ❌ Error creating job:`, error.message);
        }
    }

    console.log("\n✨ Seeding complete!");
    console.log("\n📋 Test credentials:");
    console.log("   Email: sarah.chen@alumni.edu");
    console.log("   Password: pass@1234");
    console.log("\n   (Or use any other seeded email with the same password)");

    process.exit(0);
}

seedDatabase().catch(console.error);
