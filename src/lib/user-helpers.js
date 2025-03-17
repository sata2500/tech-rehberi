// src/lib/user-helpers.js
import { 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    collection, 
    query, 
    where, 
    getDocs,
    orderBy,
    limit,
    Timestamp,
    setDoc
  } from 'firebase/firestore';
  import { 
    updateProfile, 
    updateEmail, 
    sendEmailVerification,
    reauthenticateWithCredential,
    EmailAuthProvider
  } from 'firebase/auth';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, storage } from './firebase';
  
  /**
   * Kullanıcı profilini Firestore'da günceller
   * @param {string} userId - Kullanıcı ID'si
   * @param {object} profileData - Güncellenecek profil verileri
   */
  export const updateUserProfile = async (userId, profileData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Profil güncellenirken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Firebase Auth profilini günceller (displayName ve photoURL)
   * @param {object} user - Firebase auth kullanıcı nesnesi
   * @param {object} profileData - Güncellenecek profil verileri
   */
  export const updateAuthProfile = async (user, profileData) => {
    try {
      const updates = {};
      
      if (profileData.displayName) {
        updates.displayName = profileData.displayName;
      }
      
      if (profileData.photoURL) {
        updates.photoURL = profileData.photoURL;
      }
      
      await updateProfile(user, updates);
      return { success: true };
    } catch (error) {
      console.error('Auth profili güncellenirken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Profil fotoğrafını yükler ve URL'ini döndürür
   * @param {object} file - Yüklenecek dosya
   * @param {string} userId - Kullanıcı ID'si
   */
  export const uploadProfilePhoto = async (file, userId) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-${userId}-${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `profile-photos/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      return { 
        success: true, 
        photoURL 
      };
    } catch (error) {
      console.error('Profil fotoğrafı yüklenirken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Kullanıcı e-postasını günceller
   * @param {object} user - Firebase auth kullanıcı nesnesi
   * @param {string} newEmail - Yeni e-posta adresi
   * @param {string} password - Mevcut şifre (yeniden kimlik doğrulama için)
   */
  export const changeUserEmail = async (user, newEmail, password) => {
    try {
      // Yeniden kimlik doğrulama
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // E-posta güncelleme
      await updateEmail(user, newEmail);
      
      // Doğrulama e-postası gönderme
      await sendEmailVerification(user);
      
      return { 
        success: true, 
        message: 'E-posta adresiniz güncellendi. Lütfen yeni adresinizi doğrulayın.' 
      };
    } catch (error) {
      console.error('E-posta güncellenirken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Kullanıcı tercihlerini günceller
   * @param {string} userId - Kullanıcı ID'si
   * @param {object} preferences - Güncellenecek tercihler
   */
  export const updateUserPreferences = async (userId, preferences) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          preferences: {
            ...userDoc.data().preferences,
            ...preferences
          },
          updatedAt: Timestamp.now()
        });
      } else {
        // Kullanıcı belgesi yoksa oluştur
        await setDoc(userRef, {
          id: userId,
          preferences,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Kullanıcı tercihleri güncellenirken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Kullanıcının tercihlerini getirir
   * @param {string} userId - Kullanıcı ID'si
   */
  export const getUserPreferences = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().preferences) {
        return { 
          success: true, 
          preferences: userDoc.data().preferences 
        };
      }
      
      return { 
        success: true, 
        preferences: {} 
      };
    } catch (error) {
      console.error('Kullanıcı tercihleri alınırken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Kullanıcının tam profilini getirir
   * @param {string} userId - Kullanıcı ID'si
   */
  export const getUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return { 
          success: true, 
          profile: userDoc.data() 
        };
      }
      
      return { 
        success: false, 
        error: 'Kullanıcı profili bulunamadı' 
      };
    } catch (error) {
      console.error('Kullanıcı profili alınırken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Yazıyı kaydet/beğen
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} postId - Yazı ID'si
   * @param {string} type - İşlem tipi: 'bookmark' veya 'like'
   */
  export const saveUserInteraction = async (userId, postId, type) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      const field = type === 'bookmark' ? 'bookmarkedPosts' : 'likedPosts';
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          [field]: arrayUnion(postId),
          updatedAt: Timestamp.now()
        });
      } else {
        await setDoc(userRef, {
          id: userId,
          [field]: [postId],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      // Yazı belgesini de güncelle (istatistikler için)
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        [`${type}Count`]: (await getDoc(postRef)).data()[`${type}Count`] + 1 || 1
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Yazı ${type === 'bookmark' ? 'kaydedilirken' : 'beğenilirken'} hata oluştu:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Yazı kaydını/beğenisini kaldır
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} postId - Yazı ID'si
   * @param {string} type - İşlem tipi: 'bookmark' veya 'like'
   */
  export const removeUserInteraction = async (userId, postId, type) => {
    try {
      const userRef = doc(db, 'users', userId);
      const field = type === 'bookmark' ? 'bookmarkedPosts' : 'likedPosts';
      
      await updateDoc(userRef, {
        [field]: arrayRemove(postId),
        updatedAt: Timestamp.now()
      });
      
      // Yazı belgesini de güncelle (istatistikler için)
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      const currentCount = postDoc.data()[`${type}Count`] || 0;
      
      if (currentCount > 0) {
        await updateDoc(postRef, {
          [`${type}Count`]: currentCount - 1
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Yazı ${type === 'bookmark' ? 'kaydı' : 'beğenisi'} kaldırılırken hata oluştu:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Kullanıcının kaydedilmiş/beğendiği yazıları getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} type - İşlem tipi: 'bookmark' veya 'like'
   * @param {object} options - Sıralama ve filtreleme seçenekleri
   */
  export const getUserInteractions = async (userId, type, options = {}) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { 
          success: true, 
          posts: [] 
        };
      }
      
      const field = type === 'bookmark' ? 'bookmarkedPosts' : 'likedPosts';
      const postIds = userDoc.data()[field] || [];
      
      if (postIds.length === 0) {
        return { 
          success: true, 
          posts: [] 
        };
      }
      
      // Yazıları getir
      let postsQuery = query(
        collection(db, 'posts'),
        where('__name__', 'in', postIds)
      );
      
      // Sıralama uygulanıyor
      if (options.sortBy) {
        postsQuery = query(postsQuery, orderBy(options.sortBy, options.sortDirection || 'desc'));
      }
      
      // Limit uygulanıyor
      if (options.limit) {
        postsQuery = query(postsQuery, limit(options.limit));
      }
      
      const postsSnapshot = await getDocs(postsQuery);
      
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { 
        success: true, 
        posts 
      };
    } catch (error) {
      console.error('Kullanıcı etkileşimleri alınırken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  /**
   * Kullanıcının yorumlarını getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {object} options - Sıralama ve filtreleme seçenekleri
   */
  export const getUserComments = async (userId, options = {}) => {
    try {
      let commentsQuery = query(
        collection(db, 'comments'),
        where('userId', '==', userId)
      );
      
      // Sıralama uygulanıyor
      if (options.sortBy) {
        commentsQuery = query(commentsQuery, orderBy(options.sortBy, options.sortDirection || 'desc'));
      } else {
        commentsQuery = query(commentsQuery, orderBy('createdAt', 'desc'));
      }
      
      // Limit uygulanıyor
      if (options.limit) {
        commentsQuery = query(commentsQuery, limit(options.limit));
      }
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Yorum yapılan yazıların başlıklarını al
      const postIds = [...new Set(comments.map(comment => comment.postId))];
      
      if (postIds.length > 0) {
        const postsQuery = query(
          collection(db, 'posts'),
          where('__name__', 'in', postIds)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        const posts = {};
        
        postsSnapshot.docs.forEach(doc => {
          posts[doc.id] = {
            title: doc.data().title,
            slug: doc.data().slug
          };
        });
        
        // Yorumlara yazı bilgilerini ekle
        comments.forEach(comment => {
          if (posts[comment.postId]) {
            comment.postTitle = posts[comment.postId].title;
            comment.postSlug = posts[comment.postId].slug;
          }
        });
      }
      
      return { 
        success: true, 
        comments 
      };
    } catch (error) {
      console.error('Kullanıcı yorumları alınırken hata oluştu:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

/**
 * Kullanıcı dokümanını oluşturur veya günceller (yoksa)
 * Bu fonksiyon, kullanıcı giriş yaptığında çağrılmalıdır
 * @param {string} userId - Kullanıcı kimliği
 * @param {object} userData - Kullanıcı verileri (opsiyonel)
 */
export const ensureUserDocument = async (userId, userData = {}) => {
  try {
    // Kullanıcı dokümanını kontrol et
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Kullanıcı dokümanı yoksa oluştur
      const timestamp = Timestamp.now();
      
      await setDoc(userRef, {
        id: userId,
        uid: userId, // Geriye uyumluluk için
        displayName: userData.displayName || '',
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        role: userData.role || 'admin', // Varsayılan olarak admin (test aşamasında)
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLogin: timestamp, // Geriye uyumluluk için
        preferences: {
          theme: 'light',
          emailNotifications: {
            newPosts: true,
            comments: true,
            newsletter: true
          }
        },
        bookmarkedPosts: [],
        likedPosts: []
      });
      
      console.log('Kullanıcı dokümanı oluşturuldu:', userId);
      return { success: true, message: 'Kullanıcı dokümanı oluşturuldu' };
    } else {
      // Kullanıcı dokümanı var, rolünü kontrol et
      const existingData = userDoc.data();
      
      const updates = { 
        lastLogin: Timestamp.now()
      };
      
      // Role alanı yoksa veya boşsa ekle
      if (!existingData.role) {
        updates.role = 'admin'; // Test aşamasında admin olarak ayarla
        console.log('Kullanıcı rolü eklendi:', userId);
      }
      
      // preferences alanı yoksa ekle
      if (!existingData.preferences) {
        updates.preferences = {
          theme: 'light',
          emailNotifications: {
            newPosts: true,
            comments: true,
            newsletter: true
          }
        };
      }
      
      // Güncellemeler varsa uygula
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
        console.log('Kullanıcı dokümanı güncellendi:', userId);
      }
      
      return { 
        success: true, 
        message: 'Kullanıcı dokümanı zaten mevcut', 
        role: existingData.role || 'admin' 
      };
    }
  } catch (error) {
    console.error('Kullanıcı dokümanı oluşturulurken hata:', error);
    return { success: false, error: error.message };
  }
};