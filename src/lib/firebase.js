// src/lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase yapılandırma bilgileri - sadece client-side'da güvenli olan bilgiler
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase'i lazy initialization ile başlat
let firebaseApp;
let firebaseAuth;
let firebaseDb;
let firebaseStorage;

/**
 * Firebase uygulamasını başlatır
 */
export function initializeFirebase() {
  if (!firebaseApp) {
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
  }
  return firebaseApp;
}

/**
 * Firebase Authentication hizmetini alır
 */
export function getFirebaseAuth() {
  if (!firebaseAuth) {
    const app = initializeFirebase();
    firebaseAuth = getAuth(app);
    
    // Geliştirme ortamında emülatör bağlantısı (isteğe bağlı)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
    }

    // Authentication için ilave güvenlik ayarları
    firebaseAuth.useDeviceLanguage();
  }
  
  return firebaseAuth;
}

/**
 * Firebase Firestore hizmetini alır
 */
export function getFirebaseFirestore() {
  if (!firebaseDb) {
    const app = initializeFirebase();
    firebaseDb = getFirestore(app);
    
    // Geliştirme ortamında emülatör bağlantısı (isteğe bağlı)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
    }
  }
  
  return firebaseDb;
}

/**
 * Firebase Storage hizmetini alır
 */
export function getFirebaseStorage() {
  if (!firebaseStorage) {
    const app = initializeFirebase();
    firebaseStorage = getStorage(app);
    
    // Geliştirme ortamında emülatör bağlantısı (isteğe bağlı)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectStorageEmulator(firebaseStorage, 'localhost', 9199);
    }
  }
  
  return firebaseStorage;
}

// Geriye uyumluluk için eski ihraç edilenleri koruyoruz,
// ancak yeni kod lazy yükleyicileri kullanmalı
export const app = initializeFirebase();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const storage = getFirebaseStorage();

export default app;