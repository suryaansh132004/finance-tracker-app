// firebase.js - SAFE VERSION FOR GITHUB
// Copy your Firebase config from Firebase Console → Project Settings → Your apps → Config

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY_HERE", // ← Get from Firebase Console
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE", // ex: your-project.firebaseapp.com
  projectId: "PASTE_YOUR_PROJECT_ID_HERE", // ex: your-project-12345
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE", // ex: your-project.appspot.com
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE", // Numeric ID
  appId: "PASTE_YOUR_APP_ID_HERE", // ex: 1:123456789:android:abcdef123456
};

let app, auth, db;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);

  // Initialize Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  // Initialize Firestore
  db = getFirestore(app);

  console.log('✅ Firebase initialized successfully');
  console.log('Platform:', Platform.OS);
} catch (error) {
  console.error('❌ Firebase init failed:', error);
  app = null;
  auth = null;
  db = null;
}

export { auth, db, app };
export default app;
