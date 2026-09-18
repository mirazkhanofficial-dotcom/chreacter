// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDpaSKlMUb9_7QTokR9y3yyAvjEplQp9zo",
  authDomain: "willitoons.firebaseapp.com",
  databaseURL: "https://willitoons-default-rtdb.firebaseio.com",
  projectId: "willitoons",
  storageBucket: "willitoons.firebasestorage.app",
  messagingSenderId: "363850068080",
  appId: "1:363850068080:web:ef31ef4202f212716544b5",
  measurementId: "G-YJVJTM16QZ"
};

// Initialize Firebase safely (avoid duplicate app initialization)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Initialize Realtime Database (matching databaseURL in config)
let rtdbInstance: ReturnType<typeof getDatabase> | null = null;
try {
  rtdbInstance = getDatabase(app);
} catch (e) {
  console.warn("Firebase Realtime Database init:", e);
}
export const rtdb = rtdbInstance;

export default app;
