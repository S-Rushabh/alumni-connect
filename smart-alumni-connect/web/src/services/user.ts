import { doc, getDoc, updateDoc, collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile } from "../types";

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        } else {
            console.log("No such user document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

// Placeholder for the new awardPoints function
export const awardPoints = async (uid: string, points: number) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            const currentPoints = userData.points || 0;
            const newPoints = currentPoints + points;

            await updateDoc(userRef, { points: newPoints });
            console.log(`Awarded ${points} points to user ${uid}. New total: ${newPoints}`);
        } else {
            console.log(`User document for ${uid} not found. Cannot award points.`);
        }
    } catch (error) {
        console.error("Error awarding points:", error);
        throw error;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);
        console.log("User profile updated!");
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

/**
 * Fetch all user profiles for the directory.
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        // In a real app with many users, we would paginate this.
        const q = query(usersRef, limit(50));
        const querySnapshot = await getDocs(q);
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as UserProfile);
        });
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};
