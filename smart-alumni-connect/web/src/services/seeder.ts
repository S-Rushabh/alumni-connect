
import { collection, addDoc, doc, setDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";

const FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Reyansh", "Arjun", "Vivaan", "Krishna", "Ishaan", "Shaurya", "Ananya", "Diya", "Saanvi", "Anya", "Aditi", "Pari", "Riya", "Anvi", "Myra", "Aadhya"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Mehta", "Joshi", "Patel", "Singh", "Kumar", "Das", "Roy", "Chopra", "Kapoor", "Agarwal", "Reddy", "Nair", "Iyer", "Rao", "Gowda"];
const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Netflix", "Apple", "Uber", "Airbnb", "Stripe", "Spotify", "TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra"];
const LOCATIONS = ["Mumbai, India", "Bangalore, India", "Delhi, India", "Pune, India", "Hyderabad, India", "Chennai, India", "New York, USA", "San Francisco, USA", "London, UK", "Singapore", "Berlin, Germany", "Toronto, Canada"];
const ROLES = ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer", "DevOps Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Engineering Manager", "CTO"];
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "E-commerce", "Consulting", "Media", "Automotive"];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const generateDummyUser = (index: number): UserProfile => {
    const isAlumni = Math.random() > 0.4; // 60% Alumni, 40% Student
    const firstName = getRandom(FIRST_NAMES);
    const lastName = getRandom(LAST_NAMES);
    const gradYear = 1990 + Math.floor(Math.random() * 35); // 1990 - 2025

    return {
        uid: `dummy_user_${index}_${Date.now()}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
        displayName: `${firstName} ${lastName}`,
        photoURL: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
        role: isAlumni ? 'alumni' : 'student',
        bio: `Passionate about technology and innovation. Expected graduation ${isAlumni ? 'Class of ' + gradYear : '2026'}.`,
        graduationYear: isAlumni ? gradYear : 2026,
        company: isAlumni ? getRandom(COMPANIES) : null,
        location: getRandom(LOCATIONS),
        industry: isAlumni ? getRandom(INDUSTRIES) : null,
        headline: isAlumni ? `${getRandom(ROLES)} at ${getRandom(COMPANIES)}` : "Computer Science Student",
        mentorshipStatus: isAlumni ? (Math.random() > 0.5 ? 'available' : 'none') : 'seeking',
        points: Math.floor(Math.random() * 5000), // Top level points
        gamification: {
            points: Math.floor(Math.random() * 5000), // Synced points
            badges: [],
            level: Math.floor(Math.random() * 5) + 1,
            currentTier: getRandom(['Bronze', 'Silver', 'Gold', 'Platinum'])
        },
        entityType: isAlumni ? 'alumni' : 'student'
    };
};

const seedUsers = async (count: number = 100) => {
    try {
        console.log(`Starting seed of ${count} users...`);
        const batchSize = 20; // Firestore batch limit is 500, but let's do smaller chunks for safety

        // We will do this in chunks to avoid overwhelming the client/network in one go
        for (let i = 0; i < count; i += batchSize) {
            const batch = writeBatch(db);
            const chunkEnd = Math.min(i + batchSize, count);

            for (let j = i; j < chunkEnd; j++) {
                const user = generateDummyUser(j);
                const userRef = doc(db, "users", user.uid);
                batch.set(userRef, user);
            }

            await batch.commit();
            console.log(`Seeded batch ${i / batchSize + 1}: users ${i} to ${chunkEnd}`);
        }

        console.log("Seeding complete!");
        return true;
    } catch (error) {
        console.error("Error seeding users:", error);
        return false;
    }
};

const seedDemoAccounts = async () => {
    const { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } = await import("firebase/auth");
    const { auth } = await import("../firebase");

    const demoUsers = [
        {
            email: "alumni.demo@example.com",
            password: "password123",
            role: "alumni",
            name: "Sarah Jenkins",
            bio: "Senior Software Engineer at Google. Happy to mentor students!",
            company: "Google",
            headline: "Senior SWE @ Google"
        },
        {
            email: "student.demo@example.com",
            password: "password123",
            role: "student",
            name: "Mike Ross",
            bio: "Computer Science student at IIT Bombay. Looking for internship opportunities.",
            headline: "CS Student @ IIT Bombay"
        }
    ];

    console.log("Seeding demo accounts...");

    for (const u of demoUsers) {
        try {
            // Try to create user
            let uid = "";
            try {
                const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
                uid = cred.user.uid;
                console.log(`Created user: ${u.email}`);
            } catch (e: any) {
                if (e.code === 'auth/email-already-in-use') {
                    console.log(`User ${u.email} already exists. Signing in to update profile...`);
                    const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
                    uid = cred.user.uid;
                } else {
                    console.error(`Error creating ${u.email}:`, e);
                    continue;
                }
            }

            // Create/Update Firestore Profile
            const userProfile: any = {
                uid: uid,
                email: u.email,
                displayName: u.name,
                photoURL: `https://ui-avatars.com/api/?name=${u.name.replace(" ", "+")}&background=random`,
                role: u.role as 'student' | 'alumni',
                bio: u.bio,
                headline: u.headline,
                graduationYear: u.role === 'alumni' ? 2018 : 2026,
                location: "Mumbai, India",
                industry: "Technology",
                mentorshipStatus: u.role === 'alumni' ? 'available' : 'seeking',
                points: 500,
                gamification: {
                    points: 500, // Synced points
                    badges: [],
                    level: 1,
                    currentTier: 'Silver'
                },
                entityType: u.role as 'student' | 'alumni'
            };

            // Only add company for alumni
            if (u.role === 'alumni' && u.company) {
                userProfile.company = u.company;
            }

            await setDoc(doc(db, "users", uid), userProfile);
            console.log(`Updated profile for ${u.email}`);

        } catch (error) {
            console.error(`Failed to handle ${u.email}`, error);
        }
    }

    // Sign out explicitly so the script/browser doesn't stay logged in as the last user
    await signOut(auth);
    console.log("Demo accounts seeded and signed out.");
    return true;
};

export { seedUsers, seedDemoAccounts };
