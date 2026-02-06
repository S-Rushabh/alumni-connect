import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { Job } from "../types";

export const postJob = async (jobData: Omit<Job, 'id' | 'createdAt'>, posterName: string) => {
    try {
        const jobsRef = collection(db, 'jobs');
        await addDoc(jobsRef, {
            ...jobData,
            postedByName: posterName, // Denormalize for easy display
            createdAt: Timestamp.now(),
            applicants: []
        });
        console.log("Job posted successfully!");
    } catch (error) {
        console.error("Error posting job:", error);
        throw error;
    }
};

export const getJobs = async (): Promise<Job[]> => {
    try {
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Job));
    } catch (error) {
        console.error("Error fetching jobs:", error);
        throw error;
    }
};
