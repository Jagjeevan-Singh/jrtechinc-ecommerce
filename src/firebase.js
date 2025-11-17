// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 1. READ CONFIGURATION FROM ENVIRONMENT VARIABLES
const firebaseConfig = {
  // NOTE: If using Vite, environment variables must be prefixed with VITE_
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, 
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if configuration is available before initializing
if (!firebaseConfig.apiKey) {
  console.error("FIREBASE ERROR: API Key is missing. Check your .env file and ensure variables are prefixed correctly (e.g., VITE_).");
} else {
  console.log("Firebase configuration loaded successfully");
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Current window location:", window.location.hostname);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized");

// 2. Initialize and Export Services
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider to prevent popup issues
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

// IMPORTANT: Use named exports to satisfy Login.jsx's import statement
export { auth, googleProvider };