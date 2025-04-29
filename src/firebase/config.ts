import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDa1TC52hsEw-QpbNooInsTmFSJIjo3t-w",
  authDomain: "courtcasemgmt.firebaseapp.com",
  projectId: "courtcasemgmt",
  storageBucket: "courtcasemgmt.firebasestorage.app",
  messagingSenderId: "832609709260",
  appId: "1:832609709260:web:717c3745da0f7beb626669",
  measurementId: "G-7W376T40JQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

console.log("Firebase initialized");
export default app;
