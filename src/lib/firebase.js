// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  connectAuthEmulator 
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator 
} from 'firebase/storage';

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

// Firebase instance'larını doğrudan başlat (geriye dönük uyumluluk için)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Auth persistence (tarayıcı ortamındaysa)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .catch(error => {
      console.error('Auth persistence ayarlanırken hata:', error);
    });
}

// Auth dil ayarını yap
auth.useDeviceLanguage();

// Offline persistence (tarayıcı ortamındaysa)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_OFFLINE_PERSISTENCE === 'true') {
  const offlineConfig = {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  };
  
  // Çoklu sekme desteği kontrol et
  if (process.env.NEXT_PUBLIC_ENABLE_MULTI_TAB_PERSISTENCE === 'true') {
    enableMultiTabIndexedDbPersistence(db, offlineConfig)
      .catch(error => {
        if (error.code === 'failed-precondition') {
          console.warn('Birden çok sekme açık, persistence yalnızca bir sekmede etkin');
        } else if (error.code === 'unimplemented') {
          console.warn('Tarayıcı IndexedDB persistence desteklemiyor');
        } else {
          console.error('Persistence etkinleştirilirken hata:', error);
        }
      });
  } else {
    enableIndexedDbPersistence(db, offlineConfig)
      .catch(error => {
        if (error.code === 'failed-precondition') {
          console.warn('Birden çok sekme açık, persistence yalnızca bir sekmede etkin');
        } else if (error.code === 'unimplemented') {
          console.warn('Tarayıcı IndexedDB persistence desteklemiyor');
        } else {
          console.error('Persistence etkinleştirilirken hata:', error);
        }
      });
  }
}

// Emülatör bağlantısı (geliştirme ortamında)
if (typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

// Fonksiyonlar (yeni tarz erişim için)
export function getFirebaseApp() {
  return app;
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseFirestore() {
  return db;
}

export function getFirebaseStorage() {
  return storage;
}

// Doğrudan nesneler (geriye dönük uyumluluk için)
export { app, auth, db, storage };

export default app;