// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// AuthContext objesini oluştur ve dışarıya aktar
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google ile giriş yapma
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Kullanıcı bilgilerini Firestore'a kaydet
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Yeni kullanıcı oluştur
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'user', // Varsayılan rol
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Son giriş tarihini güncelle
        await setDoc(userRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
      
      return result.user;
    } catch (error) {
      console.error('Google girişi sırasında hata:', error);
      throw error;
    }
  };

  // Çıkış yapma
  const logout = () => {
    return signOut(auth);
  };

  // Kullanıcı rolünü kontrol etme
  const getUserRole = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data().role;
      }
      
      return null;
    } catch (error) {
      console.error('Kullanıcı rolü alınırken hata:', error);
      return null;
    }
  };

  // Auth durumunu izleme
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Kullanıcı rolünü al ve kullanıcı nesnesine ekle
        const role = await getUserRole(currentUser.uid);
        setUser({ ...currentUser, role });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook - diğer dosyalardan kolay erişim için
export function useAuth() {
  return useContext(AuthContext);
}