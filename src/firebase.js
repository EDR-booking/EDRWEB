// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4mijdojVa2Xhhsyl9bZJtp_vpsPvmAMw",
  authDomain: "edr-ticket.firebaseapp.com",
  projectId: "edr-ticket",
  storageBucket: "edr-ticket.appspot.com",
  messagingSenderId: "279745382016",
  appId: "1:279745382016:web:b7111d0caf8f03d77ac865",
  measurementId: "G-SK74292K9T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { db, auth, analytics, storage };
