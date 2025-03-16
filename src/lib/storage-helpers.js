// src/lib/storage-helpers.js
import { getFirebaseStorage } from './firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';

const storage = getFirebaseStorage();

/**
 * Dosya yükleme
 * @param {File} file - Yüklenecek dosya
 * @param {string} path - Yükleme yolu
 * @param {Object} metadata - Dosya metadatası
 * @param {Function} progressCallback - İlerleme geri çağrı fonksiyonu
 */
export async function uploadFile(file, path, metadata = {}, progressCallback = null) {
  try {
    // Geçersiz karakterleri temizle ve benzersiz bir dosya adı oluştur
    const fileExtension = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = `${file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}_${randomString}.${fileExtension}`;
    
    // Storage referansını oluştur
    const fullPath = `${path}/${safeFileName}`;
    const storageRef = ref(storage, fullPath);
    
    // Metadatayı zenginleştir
    const enhancedMetadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...metadata.customMetadata
      },
      ...metadata
    };
    
    // Dosyayı yükle
    const uploadTask = uploadBytesResumable(storageRef, file, enhancedMetadata);
    
    // İlerleme takibini ayarla
    if (progressCallback) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressCallback(progress, snapshot);
        }
      );
    }
    
    // Yükleme tamamlandığında
    await uploadTask;
    
    // İndirme URL'sini al
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      url: downloadURL,
      path: fullPath,
      name: safeFileName,
      contentType: file.type,
      size: file.size,
      originalName: file.name
    };
  } catch (error) {
    console.error('Dosya yüklenemedi:', error);
    throw error;
  }
}

/**
 * Profil resmi yükleme
 * @param {File} file - Profil resmi
 * @param {string} userId - Kullanıcı ID'si
 */
export async function uploadProfileImage(file, userId, progressCallback = null) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Yalnızca resim dosyaları yüklenebilir');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
  }
  
  const fileExtension = file.name.split('.').pop();
  const timestamp = new Date().getTime();
  const path = `users/${userId}`;
  const fileName = `profile_${timestamp}.${fileExtension}`;
  
  try {
    // Storage referansını oluştur
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Metadatayı oluştur
    const metadata = {
      contentType: file.type,
      customMetadata: {
        userId: userId,
        purpose: 'profile',
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Dosyayı yükle
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    // İlerleme takibini ayarla
    if (progressCallback) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressCallback(progress, snapshot);
        }
      );
    }
    
    // Yükleme tamamlandığında
    await uploadTask;
    
    // İndirme URL'sini al
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      url: downloadURL,
      path: `${path}/${fileName}`,
      name: fileName,
      contentType: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('Profil resmi yüklenemedi:', error);
    throw error;
  }
}

/**
 * Blog yazısı görseli yükleme
 * @param {File} file - Görsel dosyası
 * @param {string} postId - Blog yazısı ID'si
 * @param {string} userId - Kullanıcı ID'si
 */
export async function uploadPostImage(file, postId, userId, progressCallback = null) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Yalnızca resim dosyaları yüklenebilir');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
  }
  
  // Geçersiz karakterleri temizle ve benzersiz bir dosya adı oluştur
  const fileExtension = file.name.split('.').pop();
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  const safeFileName = `${file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}_${randomString}.${fileExtension}`;
  
  const path = `posts/${postId}`;
  
  try {
    // Metadatayı oluştur (yazarın kim olduğunu belirtmek için)
    const metadata = {
      contentType: file.type,
      customMetadata: {
        postId: postId,
        authorId: userId,
        purpose: 'post_image',
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Dosyayı yükle
    return await uploadFile(file, path, metadata, progressCallback);
  } catch (error) {
    console.error('Blog görseli yüklenemedi:', error);
    throw error;
  }
}

/**
 * Dosya silme
 * @param {string} filePath - Silinecek dosyanın tam yolu
 */
export async function deleteFile(filePath) {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Dosya silinemedi:', error);
    throw error;
  }
}

/**
 * Bir dizindeki tüm dosyaları silme
 * @param {string} directoryPath - Dizin yolu
 */
export async function deleteDirectory(directoryPath) {
  try {
    const directoryRef = ref(storage, directoryPath);
    const fileList = await listAll(directoryRef);
    
    // Tüm alt dosyaları sil
    const deletePromises = fileList.items.map(fileRef => deleteObject(fileRef));
    
    // Tüm alt dizinleri sil (özyinelemeli)
    const subDirPromises = fileList.prefixes.map(prefix => deleteDirectory(prefix.fullPath));
    
    // Tüm silme işlemlerini bekle
    await Promise.all([...deletePromises, ...subDirPromises]);
    
    return { success: true, path: directoryPath };
  } catch (error) {
    console.error('Dizin silinemedi:', error);
    throw error;
  }
}

/**
 * Dosyanın indirme URL'sini al
 * @param {string} filePath - Dosya yolu
 */
export async function getFileUrl(filePath) {
  try {
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Dosya URL\'si alınamadı:', error);
    throw error;
  }
}

/**
 * Dosya URL'sinden Storage yolunu alma
 * (Genellikle özel durumlar için kullanılır)
 * @param {string} url - Dosya URL'si
 */
export function getPathFromUrl(url) {
  try {
    // Firebase Storage URL yapısı:
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?token=[TOKEN]
    const cleanUrl = decodeURIComponent(url);
    const bucketRegex = /firebasestorage\.googleapis\.com\/v0\/b\/([^\/]+)\/o\/([^?]+)/;
    const matches = cleanUrl.match(bucketRegex);
    
    if (matches && matches.length >= 3) {
      return matches[2].replace(/%2F/g, '/');
    }
    
    return null;
  } catch (error) {
    console.error('URL\'den yol çıkarılamadı:', error);
    return null;
  }
}