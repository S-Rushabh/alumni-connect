
import {
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import type { UserProfile } from "../types";

// --- Auth Functions ---

export const loginWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user profile exists in Firestore, if not create basic one
        await ensureUserProfile(user);

        return user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const loginWithEmailPassword = async (email: string, pass: string): Promise<User> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error) {
        console.error("Email Login failed:", error);
        throw error;
    }
};

export const registerWithEmailPassword = async (email: string, pass: string, profileData: Partial<UserProfile>): Promise<User> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        const user = result.user;

        // Update Auth Profile
        if (profileData.displayName || profileData.photoURL) {
            await updateProfile(user, {
                displayName: profileData.displayName,
                photoURL: profileData.photoURL
            });
        }

        // Create Firestore Profile
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: profileData.displayName || user.displayName,
            photoURL: profileData.photoURL || user.photoURL,
            role: profileData.role || 'student',
            ...profileData,
            gamification: {
                points: 0,
                badges: []
            }
        };

        await setDoc(doc(db, "users", user.uid), newProfile);
        return user;

    } catch (error) {
        console.error("Registration failed:", error);
        throw error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
        throw error;
    }
};

// --- Helper: Ensure User Profile Exists ---

const ensureUserProfile = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // Create new profile
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'student', // Default role
            gamification: {
                points: 0,
                badges: []
            }
        };
        await setDoc(userRef, newProfile);
        console.log("New user profile created!");
    } else {
        console.log("User profile already exists.");
    }
};
