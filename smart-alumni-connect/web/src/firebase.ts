// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBRps4jvUooo22Bu1LoJNJQ6MCobz8kuLA",
    authDomain: "smart-alumni-hackathon.firebaseapp.com",
    projectId: "smart-alumni-hackathon",
    storageBucket: "smart-alumni-hackathon.firebasestorage.app",
    messagingSenderId: "693915056343",
    appId: "1:693915056343:web:1f0154a7ca5150555d5892",
    measurementId: "G-L8D2V2Y78L"
};

import { getStorage } from "firebase/storage";

// ... existing imports ...

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);