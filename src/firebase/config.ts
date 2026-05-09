import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase only if it hasn't been initialized already
const config = {
  ...firebaseConfig,
  // Force use of .appspot.com domain for better compatibility as requested
  storageBucket: `${firebaseConfig.projectId}.appspot.com`
};

const app = getApps().length === 0 ? initializeApp(config) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Explicitly set persistence
setPersistence(auth, browserLocalPersistence).catch(err => console.error('Initial persistence error:', err));

export default app;
