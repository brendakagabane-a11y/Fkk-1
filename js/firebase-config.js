// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    FacebookAuthProvider,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    setDoc,
    getDoc,
    getDocs,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDSY0OUQOtY71QT1a4GnP-TNICJ8FNo35M",
    authDomain: "sr-market-strategies.firebaseapp.com",
    projectId: "sr-market-strategies",
    storageBucket: "sr-market-strategies.firebasestorage.app",
    messagingSenderId: "118475459994",
    appId: "1:118475459994:web:e8ec9e157abb1ed3ec3e23",
    measurementId: "G-HZ4E5L32XE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services
export { 
    app, auth, db, storage,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    FacebookAuthProvider,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    updateProfile,
    onAuthStateChanged,
    signOut,
    collection, 
    addDoc, 
    doc, 
    setDoc,
    getDoc,
    getDocs,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    onSnapshot,
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject
};
