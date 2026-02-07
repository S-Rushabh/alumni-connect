import { doc, getDoc, updateDoc, collection, query, limit, getDocs, Timestamp } from "firebase/firestore";
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

export const processDonation = async (uid: string, amount: number) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            const currentTotal = userData.totalDonations || 0;
            const newTotal = currentTotal + amount;

            // Update history
            const history = userData.donationHistory || [];
            history.push({
                date: Timestamp.now(),
                amount: amount
            });

            await updateDoc(userRef, {
                totalDonations: newTotal,
                lastDonationDate: Timestamp.now(),
                donationHistory: history
            });
            console.log(`Processed donation of $${amount} for user ${uid}. New total: $${newTotal}`);

            // Also award points for donation (e.g. 10 points per dollar)
            await awardPoints(uid, amount * 10);
        }
    } catch (error) {
        console.error("Error processing donation:", error);
        throw error;
    }
};

export const seedDonationData = async () => {
    try {
        const users = await getAllUsers();
        let updatedCount = 0;

        for (const user of users) {
            // 80% chance to have donated
            if (Math.random() > 0.2) {
                // Generate random history for the last year
                const history: { date: Timestamp; amount: number }[] = [];
                let total = 0;
                const numDonations = Math.floor(Math.random() * 20) + 1; // 1-20 donations

                for (let i = 0; i < numDonations; i++) {
                    const date = new Date();
                    // Random date in last 365 days
                    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
                    const amount = Math.floor(Math.random() * 50) * 10 + 10;

                    history.push({
                        date: Timestamp.fromDate(date),
                        amount: amount
                    });
                    total += amount;
                }

                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    totalDonations: total,
                    lastDonationDate: history.length > 0 ? history[history.length - 1].date : null,
                    donationHistory: history
                });
                updatedCount++;
            } else {
                // Ensure fields exist even if 0
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    totalDonations: 0,
                    lastDonationDate: null
                });
            }
        }
        console.log(`Seeded donation data for ${updatedCount} users.`);
        return updatedCount;
    } catch (error) {
        console.error("Error seeding donation data:", error);
        return 0;
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
