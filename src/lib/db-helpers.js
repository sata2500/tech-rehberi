// src/lib/db-helpers.js
import { getFirebaseFirestore } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  increment,
  runTransaction,
  writeBatch,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { useCache } from '../contexts/CacheContext';

const db = getFirebaseFirestore();

// Cache değişkenini global olarak tanımla
let globalCache = null;

// useCache hook'unun olmadığı yerlerde kullanmak için
export function setGlobalCache(cacheInstance) {
  globalCache = cacheInstance;
}

/**
 * Önbellekten veriyi al veya Firestore'dan getir
 * 
 * @param {string} collectionName - Koleksiyon adı
 * @param {string} docId - Doküman kimliği
 * @param {boolean} forceFetch - Önbelleği atlayıp zorla getir
 */
export async function getDocumentWithCache(collectionName, docId, forceFetch = false) {
  if (!globalCache) {
    console.warn('Cache instance not set. Call setGlobalCache() first.');
    return getDocumentById(collectionName, docId);
  }
  
  // Önbellekte var mı kontrol et
  if (!forceFetch) {
    const cachedDoc = globalCache.getItem(collectionName, docId);
    if (cachedDoc) {
      return cachedDoc;
    }
  }
  
  // Firestore'dan getir
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const docData = { id: docId, ...docSnap.data() };
    // Önbelleğe ekle
    globalCache.setItem(collectionName, docId, docData);
    return docData;
  }
  
  return null;
}

/**
 * Doküman kimliğine göre getir
 */
export async function getDocumentById(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docId, ...docSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting ${collectionName} document:`, error);
    throw error;
  }
}

/**
 * Toplu işlem yapan yardımcı fonksiyon
 * 
 * @param {Array} operations - İşlemler dizisi { type, collectionName, docId, data }
 * @returns {Object} - İşlem sonuçları
 */
export async function batchOperations(operations) {
  const batch = writeBatch(db);
  const results = { success: true, created: [], updated: [], deleted: [] };
  
  try {
    for (const op of operations) {
      const { type, collectionName, docId, data } = op;
      
      switch (type) {
        case 'create':
          // Yeni doküman oluştur veya belirli ID ile oluştur
          if (docId) {
            const newDocRef = doc(db, collectionName, docId);
            batch.set(newDocRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            results.created.push({ id: docId, ...data });
          } else {
            const collectionRef = collection(db, collectionName);
            const newDocRef = doc(collectionRef);
            batch.set(newDocRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            results.created.push({ id: newDocRef.id, ...data });
          }
          break;
          
        case 'update':
          // Doküman güncelle
          const updateDocRef = doc(db, collectionName, docId);
          batch.update(updateDocRef, { ...data, updatedAt: serverTimestamp() });
          results.updated.push({ id: docId, ...data });
          break;
          
        case 'delete':
          // Doküman sil
          const deleteDocRef = doc(db, collectionName, docId);
          batch.delete(deleteDocRef);
          results.deleted.push({ id: docId });
          break;
          
        default:
          throw new Error(`Unsupported operation type: ${type}`);
      }
    }
    
    // Batch işlemini çalıştır
    await batch.commit();
    
    // Önbelleği güncelle (eğer kullanılabilirse)
    if (globalCache) {
      // Oluşturulanları önbelleğe ekle
      results.created.forEach(item => {
        const collection = operations.find(op => op.type === 'create' && op.docId === item.id)?.collectionName;
        if (collection) {
          globalCache.setItem(collection, item.id, item);
        }
      });
      
      // Güncellenenleri önbellekte güncelle
      results.updated.forEach(item => {
        const collection = operations.find(op => op.type === 'update' && op.docId === item.id)?.collectionName;
        if (collection) {
          globalCache.updateItem(collection, item.id, item);
        }
      });
      
      // Silinenleri önbellekten çıkar
      results.deleted.forEach(item => {
        const collection = operations.find(op => op.type === 'delete' && op.docId === item.id)?.collectionName;
        if (collection) {
          globalCache.removeItem(collection, item.id);
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('Batch operation failed:', error);
    
    results.success = false;
    results.error = error.message;
    
    return results;
  }
}

/**
 * Blog yazısı oluşturma
 */
export async function createPost(postData, userId) {
  try {
    // ID olarak kullanmak için timestamp ve rastgele karakter oluştur
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 8);
    const slug = `${postData.slug || postData.title.toLowerCase().replace(/[^\w-]+/g, '-')}-${random}`;
    
    // Yeni blog gönderisi nesnesi
    const newPost = {
      ...postData,
      slug,
      authorId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      status: postData.status || 'draft', // draft, published, private
    };
    
    // Toplu işlem olarak gerçekleştir
    const operations = [
      { type: 'create', collectionName: 'posts', data: newPost }
    ];
    
    // Kategorileri güncelle
    if (postData.categories && Array.isArray(postData.categories)) {
      postData.categories.forEach(categoryId => {
        operations.push({
          type: 'update',
          collectionName: 'categories',
          docId: categoryId,
          data: { postCount: increment(1) }
        });
      });
    }
    
    // Etiketleri güncelle
    if (postData.tags && Array.isArray(postData.tags)) {
      postData.tags.forEach(tagId => {
        operations.push({
          type: 'update',
          collectionName: 'tags',
          docId: tagId,
          data: { postCount: increment(1) }
        });
      });
    }
    
    const result = await batchOperations(operations);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create post');
    }
    
    // Yeni post ID'sini sonuçlardan al
    const createdPost = result.created[0];
    
    return { id: createdPost.id, ...newPost };
  } catch (error) {
    console.error('Blog yazısı oluşturulamadı:', error);
    throw error;
  }
}

/**
 * Blog yazısını güncelleme
 */
export async function updatePost(postId, postData, userId) {
  try {
    // Önbellekten veya DB'den mevcut postu al
    let postDoc;
    if (globalCache) {
      postDoc = globalCache.getItem('posts', postId);
    }
    
    if (!postDoc) {
      const postRef = doc(db, 'posts', postId);
      const postSnapshot = await getDoc(postRef);
      
      if (!postSnapshot.exists()) {
        throw new Error('Blog yazısı bulunamadı');
      }
      
      postDoc = postSnapshot.data();
    }
    
    // Sadece yazarın kendisi veya admin bu işlemi yapabilir
    if (postDoc.authorId !== userId) {
      // Admin kontrolü burada yapılabilir
      throw new Error('Bu blog yazısını düzenleme yetkiniz yok');
    }
    
    // Güncellenecek veri
    const updatedPost = {
      ...postData,
      updatedAt: serverTimestamp(),
    };
    
    // Toplu işlem hazırla
    const operations = [
      { type: 'update', collectionName: 'posts', docId: postId, data: updatedPost }
    ];
    
    // Kategori değişikliklerini izle ve sayaçları güncelle
    if (postData.categories && Array.isArray(postData.categories) && 
        postDoc.categories && Array.isArray(postDoc.categories)) {
      
      // Kategori eklemeler
      const addedCategories = postData.categories.filter(cat => !postDoc.categories.includes(cat));
      addedCategories.forEach(categoryId => {
        operations.push({
          type: 'update',
          collectionName: 'categories',
          docId: categoryId,
          data: { postCount: increment(1) }
        });
      });
      
      // Kategori çıkarmalar
      const removedCategories = postDoc.categories.filter(cat => !postData.categories.includes(cat));
      removedCategories.forEach(categoryId => {
        operations.push({
          type: 'update',
          collectionName: 'categories',
          docId: categoryId,
          data: { postCount: increment(-1) }
        });
      });
    }
    
    // Etiket değişikliklerini izle ve sayaçları güncelle
    if (postData.tags && Array.isArray(postData.tags) && 
        postDoc.tags && Array.isArray(postDoc.tags)) {
      
      // Etiket eklemeler
      const addedTags = postData.tags.filter(tag => !postDoc.tags.includes(tag));
      addedTags.forEach(tagId => {
        operations.push({
          type: 'update',
          collectionName: 'tags',
          docId: tagId,
          data: { postCount: increment(1) }
        });
      });
      
      // Etiket çıkarmalar
      const removedTags = postDoc.tags.filter(tag => !postData.tags.includes(tag));
      removedTags.forEach(tagId => {
        operations.push({
          type: 'update',
          collectionName: 'tags',
          docId: tagId,
          data: { postCount: increment(-1) }
        });
      });
    }
    
    // Toplu işlemi çalıştır
    const result = await batchOperations(operations);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update post');
    }
    
    // Önbelleği güncelle
    if (globalCache) {
      globalCache.updateItem('posts', postId, { id: postId, ...updatedPost });
    }
    
    return { id: postId, ...updatedPost };
  } catch (error) {
    console.error('Blog yazısı güncellenemedi:', error);
    throw error;
  }
}

/**
 * Blog yazısını silme
 */
export async function deletePost(postId, userId) {
  try {
    // Önbellekten veya DB'den mevcut postu al
    let postDoc;
    if (globalCache) {
      postDoc = globalCache.getItem('posts', postId);
    }
    
    if (!postDoc) {
      const postRef = doc(db, 'posts', postId);
      const postSnapshot = await getDoc(postRef);
      
      if (!postSnapshot.exists()) {
        throw new Error('Blog yazısı bulunamadı');
      }
      
      postDoc = postSnapshot.data();
    }
    
    // Sadece yazarın kendisi veya admin bu işlemi yapabilir
    if (postDoc.authorId !== userId) {
      // Admin kontrolü burada yapılabilir
      throw new Error('Bu blog yazısını silme yetkiniz yok');
    }
    
    // Toplu işlem hazırla
    const operations = [
      { type: 'delete', collectionName: 'posts', docId: postId }
    ];
    
    // Kategorileri güncelle
    if (postDoc.categories && Array.isArray(postDoc.categories)) {
      postDoc.categories.forEach(categoryId => {
        operations.push({
          type: 'update',
          collectionName: 'categories',
          docId: categoryId,
          data: { postCount: increment(-1) }
        });
      });
    }
    
    // Etiketleri güncelle
    if (postDoc.tags && Array.isArray(postDoc.tags)) {
      postDoc.tags.forEach(tagId => {
        operations.push({
          type: 'update',
          collectionName: 'tags',
          docId: tagId,
          data: { postCount: increment(-1) }
        });
      });
    }
    
    // TODO: İlgili yorumları bulma ve silme işlemi eklenebilir
    
    // Toplu işlemi çalıştır
    const result = await batchOperations(operations);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete post');
    }
    
    // Önbellekten sil
    if (globalCache) {
      globalCache.removeItem('posts', postId);
    }
    
    return { success: true, id: postId };
  } catch (error) {
    console.error('Blog yazısı silinemedi:', error);
    throw error;
  }
}

/**
 * Blog yazısı okuma
 */
export async function getPost(postId, userId = null) {
  try {
    // Önce önbellekten kontrol et
    if (globalCache) {
      const cachedPost = globalCache.getItem('posts', postId);
      
      if (cachedPost) {
        // Önbellekteki verinin yayınlanmış veya kullanıcıya ait olup olmadığını kontrol et
        if (cachedPost.status === 'published' || cachedPost.authorId === userId) {
          // Eğer post yayınlandıysa, önbellekteki view count bilgisini güncelle
          // ama DB'deki asıl artırma işlemi arka planda yapılacak
          if (cachedPost.status === 'published') {
            const postRef = doc(db, 'posts', postId);
            // Görüntülenmeyi arka planda artır ama sonuç için bekleme
            updateDoc(postRef, { viewCount: increment(1) })
              .catch(err => console.error('Error updating view count:', err));
            
            // Önbellekteki görüntülenme sayısını artır
            globalCache.updateItem('posts', postId, {
              ...cachedPost,
              viewCount: (cachedPost.viewCount || 0) + 1
            });
            
            return {
              ...cachedPost,
              viewCount: (cachedPost.viewCount || 0) + 1
            };
          }
          
          return cachedPost;
        }
      }
    }
    
    // Önbellekte yoksa veya koşullar uygun değilse Firestore'dan getir
    const postRef = doc(db, 'posts', postId);
    const postSnapshot = await getDoc(postRef);
    
    if (!postSnapshot.exists()) {
      throw new Error('Blog yazısı bulunamadı');
    }
    
    const postData = postSnapshot.data();
    
    // Yalnızca yayınlanmış veya kullanıcının kendi gönderileri okunabilir
    if (postData.status !== 'published' && postData.authorId !== userId) {
      // Admin kontrolü burada yapılabilir
      throw new Error('Bu blog yazısını görüntüleme yetkiniz yok');
    }
    
    // Görüntülenme sayısını artır (sadece yayınlanmış gönderiler için)
    if (postData.status === 'published') {
      await updateDoc(postRef, {
        viewCount: increment(1)
      });
      
      // Artırılmış görüntülenme sayısını yansıt
      postData.viewCount = (postData.viewCount || 0) + 1;
    }
    
    const post = { id: postId, ...postData };
    
    // Önbelleğe ekle
    if (globalCache) {
      globalCache.setItem('posts', postId, post);
    }
    
    return post;
  } catch (error) {
    console.error('Blog yazısı okunamadı:', error);
    throw error;
  }
}

/**
 * Yayınlanmış blog yazılarını listele
 */
export async function getPublishedPosts(options = {}) {
  try {
    const { 
      categoryId = null, 
      tagId = null, 
      authorId = null,
      searchTerm = null,
      sortBy = 'createdAt', 
      sortDirection = 'desc',
      pageSize = 10,
      lastVisible = null
    } = options;
    
    // Sorgu anahtarı oluştur
    const queryKey = `published_posts:${categoryId || ''}:${tagId || ''}:${authorId || ''}:${searchTerm || ''}:${sortBy}:${sortDirection}:${pageSize}:${lastVisible ? lastVisible.id : ''}`;
    
    // Önbellekten kontrol et
    if (globalCache && !lastVisible) {
      const cachedPosts = globalCache.getQuery(queryKey);
      
      if (cachedPosts) {
        return cachedPosts;
      }
    }
    
    // Temel sorgu
    let postsQuery = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy(sortBy, sortDirection),
      limit(pageSize)
    );
    
    // Kategori filtresi
    if (categoryId) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        where('categories', 'array-contains', categoryId),
        orderBy(sortBy, sortDirection),
        limit(pageSize)
      );
    }
    
    // Etiket filtresi için özel sorgu oluştur
    // Not: Firestore, çoklu array-contains sorgularını desteklemez
    if (tagId && !categoryId) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        where('tags', 'array-contains', tagId),
        orderBy(sortBy, sortDirection),
        limit(pageSize)
      );
    }
    
    // Yazar filtresi
    if (authorId && !categoryId && !tagId) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        where('authorId', '==', authorId),
        orderBy(sortBy, sortDirection),
        limit(pageSize)
      );
    }
    
    // Arama terimi (Firestore'da tam metin araması sınırlıdır)
    if (searchTerm && !categoryId && !tagId && !authorId) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        where('title', '>=', searchTerm),
        where('title', '<=', searchTerm + '\uf8ff'),
        orderBy('title'),
        limit(pageSize)
      );
    }
    
    // Pagination
    if (lastVisible) {
      postsQuery = query(
        postsQuery,
        startAfter(lastVisible)
      );
    }
    
    const querySnapshot = await getDocs(postsQuery);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      const post = {
        id: doc.id,
        ...doc.data()
      };
      posts.push(post);
      
      // Tekil postları da önbelleğe ekle
      if (globalCache) {
        globalCache.setItem('posts', doc.id, post);
      }
    });
    
    // Son görünür öğeyi pagination için döndür
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    const result = {
      posts,
      lastVisible: lastVisibleDoc ? {
        id: lastVisibleDoc.id,
        ...lastVisibleDoc.data()
      } : null
    };
    
    // Sorgu sonucunu önbelleğe ekle (sadece ilk sayfa)
    if (globalCache && !lastVisible) {
      globalCache.setQuery(queryKey, result);
    }
    
    return result;
  } catch (error) {
    console.error('Blog yazıları listelenirken hata oluştu:', error);
    throw error;
  }
}

/**
 * Popüler kategorileri getir (önbellekle)
 */
export async function getPopularCategories(limit = 10) {
  try {
    const queryKey = `popular_categories:${limit}`;
    
    // Önbellekten kontrol et
    if (globalCache) {
      const cachedCategories = globalCache.getQuery(queryKey);
      
      if (cachedCategories) {
        return cachedCategories;
      }
    }
    
    // Firestore'dan getir
    const categoriesQuery = query(
      collection(db, 'categories'),
      orderBy('postCount', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(categoriesQuery);
    const categories = [];
    
    querySnapshot.forEach((doc) => {
      const category = {
        id: doc.id,
        ...doc.data()
      };
      categories.push(category);
      
      // Tekil kategorileri de önbelleğe ekle
      if (globalCache) {
        globalCache.setItem('categories', doc.id, category);
      }
    });
    
    // Önbelleğe ekle (7 gün geçerli)
    if (globalCache) {
      globalCache.setQuery(queryKey, categories, 7 * 24 * 60 * 60 * 1000);
    }
    
    return categories;
  } catch (error) {
    console.error('Popüler kategoriler listelenirken hata oluştu:', error);
    throw error;
  }
}

/**
 * Popüler etiketleri getir (önbellekle)
 */
export async function getPopularTags(limit = 20) {
  try {
    const queryKey = `popular_tags:${limit}`;
    
    // Önbellekten kontrol et
    if (globalCache) {
      const cachedTags = globalCache.getQuery(queryKey);
      
      if (cachedTags) {
        return cachedTags;
      }
    }
    
    // Firestore'dan getir
    const tagsQuery = query(
      collection(db, 'tags'),
      orderBy('postCount', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(tagsQuery);
    const tags = [];
    
    querySnapshot.forEach((doc) => {
      const tag = {
        id: doc.id,
        ...doc.data()
      };
      tags.push(tag);
      
      // Tekil etiketleri de önbelleğe ekle
      if (globalCache) {
        globalCache.setItem('tags', doc.id, tag);
      }
    });
    
    // Önbelleğe ekle (1 gün geçerli)
    if (globalCache) {
      globalCache.setQuery(queryKey, tags, 24 * 60 * 60 * 1000);
    }
    
    return tags;
  } catch (error) {
    console.error('Popüler etiketler listelenirken hata oluştu:', error);
    throw error;
  }
}

/**
 * En son yazıları getir (önbellekle)
 */
export async function getLatestPosts(limit = 5) {
  try {
    const queryKey = `latest_posts:${limit}`;
    
    // Önbellekten kontrol et
    if (globalCache) {
      const cachedPosts = globalCache.getQuery(queryKey);
      
      if (cachedPosts) {
        return cachedPosts;
      }
    }
    
    // Firestore'dan getir
    const postsQuery = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      const post = {
        id: doc.id,
        ...doc.data()
      };
      posts.push(post);
      
      // Tekil postları da önbelleğe ekle
      if (globalCache) {
        globalCache.setItem('posts', doc.id, post);
      }
    });
    
    // Önbelleğe ekle (30 dakika geçerli)
    if (globalCache) {
      globalCache.setQuery(queryKey, posts, 30 * 60 * 1000);
    }
    
    return posts;
  } catch (error) {
    console.error('En son yazılar listelenirken hata oluştu:', error);
    throw error;
  }
}