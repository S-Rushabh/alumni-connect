import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export const uploadResume = async (userId: string, file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, `resumes/${userId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading resume:", error);
        throw error;
    }
};
