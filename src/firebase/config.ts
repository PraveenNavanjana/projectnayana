// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDgpNpe2UJedg_baFBkbGktjAnjWX7B9EA",
  authDomain: "fida-global.firebaseapp.com",
  projectId: "fida-global",
  storageBucket: "fida-global.firebasestorage.app",
  messagingSenderId: "1048609581781",
  appId: "1:1048609581781:web:b264745425380b13eb905c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;