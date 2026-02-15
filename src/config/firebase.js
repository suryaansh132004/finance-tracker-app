// config/firebase.js - ✅ WEB SDK (Works on React Native)

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBfQvpE3CvjTsNnPlvHJOB7s_yNxFUw6DA",
  authDomain: "dhantracker-913e5.firebaseapp.com",
  projectId: "dhantracker-913e5",
  storageBucket: "dhantracker-913e5.firebasestorage.app",
  messagingSenderId: "127418086653",
  appId: "1:127418086653:web:821afac66450d77a4a7a94"
};

let app, auth, db;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  
  // Initialize Firestore
  db = getFirestore(app);
  
  console.log('✅ Firebase initialized (Web SDK)');
  console.log('📱 Platform:', Platform.OS);
} catch (error) {
  console.error('❌ Firebase init failed:', error);
  app = null;
  auth = null;
  db = null;
}

export { auth, db, app };
export default app;
