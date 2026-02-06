import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Job, JobApplication, ReferralRequest } from "../types";

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

// --- Job Application Functions ---

export const submitJobApplication = async (applicationData: Omit<JobApplication, 'id' | 'createdAt' | 'status'>) => {
    try {
        const applicationsRef = collection(db, 'job_applications');
        await addDoc(applicationsRef, {
            ...applicationData,
            createdAt: Timestamp.now(),
            status: 'pending'
        });
        console.log("Job application submitted successfully!");
    } catch (error) {
        console.error("Error submitting job application:", error);
        throw error;
    }
};

export const getJobApplications = async (jobId: string): Promise<JobApplication[]> => {
    try {
        const applicationsRef = collection(db, 'job_applications');
        const q = query(applicationsRef, where("jobId", "==", jobId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as JobApplication));
    } catch (error) {
        console.error("Error fetching job applications:", error);
        throw error;
    }
};

export const getUserApplications = async (userId: string): Promise<JobApplication[]> => {
    try {
        const applicationsRef = collection(db, 'job_applications');
        const q = query(applicationsRef, where("applicantUid", "==", userId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as JobApplication));
    } catch (error) {
        console.error("Error fetching user applications:", error);
        throw error;
    }
};

// --- Referral Request Functions ---

export const submitReferralRequest = async (referralData: Omit<ReferralRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
        const referralsRef = collection(db, 'referral_requests');
        await addDoc(referralsRef, {
            ...referralData,
            createdAt: Timestamp.now(),
            status: 'pending'
        });
        console.log("Referral request submitted successfully!");
    } catch (error) {
        console.error("Error submitting referral request:", error);
        throw error;
    }
};

export const getReferralRequests = async (userId: string): Promise<ReferralRequest[]> => {
    try {
        const referralsRef = collection(db, 'referral_requests');
        // Get requests where user is either requester or referrer
        const q1 = query(referralsRef, where("requesterId", "==", userId), orderBy("createdAt", "desc"));
        const q2 = query(referralsRef, where("referrerId", "==", userId), orderBy("createdAt", "desc"));

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const requests1 = snapshot1.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ReferralRequest));

        const requests2 = snapshot2.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ReferralRequest));

        // Combine and deduplicate
        const allRequests = [...requests1, ...requests2];
        const uniqueRequests = Array.from(new Map(allRequests.map(r => [r.id, r])).values());

        return uniqueRequests;
    } catch (error) {
        console.error("Error fetching referral requests:", error);
        throw error;
    }
};

export const checkExistingReferralRequest = async (jobId: string, requesterId: string): Promise<boolean> => {
    try {
        const referralsRef = collection(db, 'referral_requests');
        const q = query(
            referralsRef,
            where("jobId", "==", jobId),
            where("requesterId", "==", requesterId)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking existing referral request:", error);
        return false;
    }
};
