import { getApps, cert, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp;
if (!getApps().length) {
  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawKey) {
      const serviceAccount = typeof rawKey === 'string' ? JSON.parse(rawKey) : rawKey;
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cybersafe-9dxv1'}.firebasestorage.app`
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cybersafe-9dxv1',
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  adminApp = getApp();
}

let adminDb: Firestore;
let adminStorage: Storage;
let adminAuth: Auth;

try {
  adminDb = getFirestore(adminApp);
  adminDb.settings({
    ignoreUndefinedProperties: true,
  });
} catch (e) {
  adminDb = null as any;
}

try {
  adminStorage = getStorage(adminApp);
} catch (e) {
  adminStorage = null as any;
}

try {
  adminAuth = getAuth(adminApp);
} catch (e) {
  adminAuth = null as any;
}

export { adminDb, adminStorage, adminAuth };
