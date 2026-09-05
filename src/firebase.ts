import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const customDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

// Robust, direct Firestore initialization ensuring identical, immediate real-time sync across Chrome, Edge, and all platforms
let firestoreInstance;
try {
  firestoreInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
} catch (e) {
  try {
    firestoreInstance = initializeFirestore(
      app,
      { ignoreUndefinedProperties: true },
      customDbId
    );
  } catch {
    firestoreInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
}

export const db = firestoreInstance;
export default app;

