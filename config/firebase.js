import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// Firebase configuration
// Replace these values with your Firebase project credentials
// You can get these from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. Initialize Auth with Persistence
// This ensures the user stays logged in even after closing the app
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, db, googleProvider };
export default app;

