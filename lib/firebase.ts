// Import the functions you need from the SDKs
import { initializeApp, getApps } from "firebase/app";
// Import the functions you need from the SDKs
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// these functions are used to get the auth, google provider, and firestore
import { getFirestore } from "firebase/firestore";
// this function is used to get the analytics
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0000000000"
};

// Log the environment for debugging
console.log("Firebase Environment:", {
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  nodeEnv: process.env.NODE_ENV
});

// Initialize Firebase if it hasn't been initialized yet
let app;
let auth;
let db;
let googleProvider;
let analytics = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    
    // Initialize Analytics - only on client side
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.error("Error initializing analytics:", error);
      }
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Provide mock implementations for testing/development without Firebase
  auth = {} as any;
  db = {} as any;
  googleProvider = {} as any;
}

export { app, auth, db, googleProvider, analytics }; 