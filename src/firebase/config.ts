import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "Your API KEY",
  authDomain: "Your Auth Domain",
  projectId: "ur project ID",
  storageBucket: "your Bucket Name",
  messagingSenderId: "Your Sender ID",
  appId: "your APP ID",
  measurementId: "Your Measurement ID"
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
