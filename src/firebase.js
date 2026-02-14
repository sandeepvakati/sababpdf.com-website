import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAzt2NcFSHXLaxrhrsd6ECHVqzFjCRSAXo",
    authDomain: "sababpdf-95e28.firebaseapp.com",
    projectId: "sababpdf-95e28",
    storageBucket: "sababpdf-95e28.firebasestorage.app",
    messagingSenderId: "951743259610",
    appId: "1:951743259610:web:913429c32350cd627ad6e3",
    measurementId: "G-LXLN7J0JEX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
