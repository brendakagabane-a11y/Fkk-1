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

import { firebaseConfig } from '../../config/firebase-config.js';

class FirebaseService {
    constructor() {
        this.init();
    }

    init() {
        try {
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            this.storage = getStorage(this.app);
            this.googleProvider = new GoogleAuthProvider();
            this.facebookProvider = new FacebookAuthProvider();
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }

    // Auth methods
    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            await this.saveUserData(userCredential.user.uid, userData);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async saveUserData(uid, userData) {
        try {
            await setDoc(doc(this.db, "users", uid), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserData(uid) {
        try {
            const docRef = doc(this.db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { success: true, data: docSnap.data() };
            } else {
                return { success: false, error: "User data not found" };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Firestore methods
    async addDocument(collectionName, data) {
        try {
            const docRef = await addDoc(collection(this.db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getDocuments(collectionName, constraints = []) {
        try {
            let q = collection(this.db, collectionName);
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }
            const querySnapshot = await getDocs(q);
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: documents };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Storage methods
    async uploadFile(file, path) {
        try {
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return { success: true, url: downloadURL };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default new FirebaseService();
