import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

// Upload file to Firebase Storage
export const uploadChatFile = async (file: File, userId: string): Promise<string> => {
    try {
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, `chat_files/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

// Upload image to Firebase Storage
export const uploadChatImage = async (file: File, userId: string): Promise<string> => {
    try {
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, `chat_images/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

// Get file size in human-readable format
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Check if file is an image
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

// Validate file size (max 10MB)
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};
