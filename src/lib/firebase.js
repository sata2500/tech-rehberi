// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Emülatör bağlantısı (geliştirme ortamında ve etkinleştirilmişse)
if (typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  
  import('firebase/auth').then(({ connectAuthEmulator }) => {
    connectAuthEmulator(auth, 'http://localhost:9099');
  });
  
  import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
    connectFirestoreEmulator(db, 'localhost', 8080);
  });
  
  import('firebase/storage').then(({ connectStorageEmulator }) => {
    connectStorageEmulator(storage, 'localhost', 9199);
  });
}

// Auth için ilave ayarlar
auth.useDeviceLanguage();

export { app, auth, db, storage };
export default app;