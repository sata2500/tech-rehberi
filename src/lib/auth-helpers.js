// src/lib/auth-helpers.js
import { 
    getFirebaseAuth, 
    getFirebaseFirestore 
  } from './firebase';
  import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
  } from 'firebase/auth';
  import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp 
  } from 'firebase/firestore';
  
  // Auth nesnesini al
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  
  /**
   * Kullanıcı kaydı
   * @param {string} email - Kullanıcı e-posta adresi
   * @param {string} password - Kullanıcı şifresi
   * @param {object} userData - Kullanıcı profil verisi
   */
  export async function registerUser(email, password, userData = {}) {
    try {
      // Firebase Authentication'da kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Kullanıcı adını ayarla (varsa)
      if (userData.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName,
          photoURL: userData.photoURL || null
        });
      }
      
      // Firestore'da kullanıcı dokümanı oluştur
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        createdAt: serverTimestamp(),
        role: 'user', // Varsayılan rol
        roles: ['user'], // Roller dizisi (gelecekte RBAC için)
        settings: {
          emailNotifications: true,
          theme: 'light'
        },
        ...userData
      });
      
      return user;
    } catch (error) {
      console.error('Kullanıcı kaydı başarısız:', error);
      throw error;
    }
  }
  
  /**
   * E-posta ve şifre ile giriş
   */
  export async function loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Giriş başarısız:', error);
      throw error;
    }
  }
  
  /**
   * Google ile giriş
   */
  export async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Kullanıcı dokümanını kontrol et, yoksa oluştur
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          role: 'user',
          roles: ['user'],
          settings: {
            emailNotifications: true,
            theme: 'light'
          }
        });
      }
      
      return user;
    } catch (error) {
      console.error('Google ile giriş başarısız:', error);
      throw error;
    }
  }
  
  /**
   * Çıkış yapma
   */
  export async function logoutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Çıkış yapma başarısız:', error);
      throw error;
    }
  }
  
  /**
   * Şifre sıfırlama e-postası gönder
   */
  export async function sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Şifre sıfırlama e-postası gönderilemedi:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcı profilini güncelle
   */
  export async function updateUserProfile(user, profileData) {
    try {
      // Auth profilini güncelle
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(user, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });
      }
      
      // Firestore kullanıcı dokümanını güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Profil güncellenemedi:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcı şifresini güncelle
   */
  export async function changePassword(user, currentPassword, newPassword) {
    try {
      // Yeniden kimlik doğrulama
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Şifreyi güncelle
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Şifre değiştirilemedi:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcı rolünü kontrol et
   */
  export async function hasRole(user, role) {
    if (!user) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      return userData.roles && userData.roles.includes(role);
    } catch (error) {
      console.error('Rol kontrolü başarısız:', error);
      return false;
    }
  }
  
  /**
   * Admin kontrolü
   */
  export async function isAdmin(user) {
    return hasRole(user, 'admin');
  }
  
  /**
   * İçerik üreticisi kontrolü
   */
  export async function isContributor(user) {
    return hasRole(user, 'contributor') || hasRole(user, 'admin');
  }