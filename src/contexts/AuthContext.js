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
import { ensureUserDocument } from '../lib/user-helpers'; // Yeni eklenen

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
      
      // Kullanıcı bilgilerini Firestore'a kaydet - ensureUserDocument kullanarak
      await ensureUserDocument(result.user.uid, {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        role: 'admin' // Test aşamasında admin olarak ayarla
      });
      
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
      // ensureUserDocument ile role alanını oluştur veya kontrol et
      const userResult = await ensureUserDocument(uid);
      
      if (userResult.success) {
        // Eğer ensureUserDocument fonksiyonu role değerini dönüyorsa, onu kullan
        if (userResult.role) return userResult.role;
        
        // Değilse, Firestore'dan oku
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          return userSnap.data().role || 'admin'; // Varsayılan role
        }
      }
      
      return 'admin'; // ensureUserDocument başarısız olursa varsayılan rol
    } catch (error) {
      console.error('Kullanıcı rolü alınırken hata:', error);
      return 'admin'; // Hata durumunda varsayılan rol
    }
  };

  // Auth durumunu izleme
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Yükleme başladı
      
      if (currentUser) {
        try {
          // Kullanıcı dokümanını oluştur veya güncelle
          await ensureUserDocument(currentUser.uid, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          });
          
          // Kullanıcı rolünü al
          const role = await getUserRole(currentUser.uid);
          
          // Role ile zenginleştirilmiş kullanıcı nesnesini ayarla
          setUser({ ...currentUser, role });
        } catch (error) {
          console.error("Kullanıcı oturum açma hatası:", error);
          setUser(currentUser); // Hata durumunda temel kullanıcı bilgilerini ayarla
        }
      } else {
        setUser(null);
      }
      
      setLoading(false); // Yükleme tamamlandı
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