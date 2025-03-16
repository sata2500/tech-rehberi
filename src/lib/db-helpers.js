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
} from 'firebase/firestore';

const db = getFirebaseFirestore();

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
    
    // Yeni doküman oluştur
    const docRef = await addDoc(collection(db, 'posts'), newPost);
    
    // Kategorileri güncelle
    if (postData.categories && Array.isArray(postData.categories)) {
      await Promise.all(postData.categories.map(async (categoryId) => {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
          postCount: increment(1)
        });
      }));
    }
    
    // Etiketleri güncelle
    if (postData.tags && Array.isArray(postData.tags)) {
      await Promise.all(postData.tags.map(async (tagId) => {
        const tagRef = doc(db, 'tags', tagId);
        await updateDoc(tagRef, {
          postCount: increment(1)
        });
      }));
    }
    
    return { id: docRef.id, ...newPost };
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
    const postRef = doc(db, 'posts', postId);
    const postSnapshot = await getDoc(postRef);
    
    if (!postSnapshot.exists()) {
      throw new Error('Blog yazısı bulunamadı');
    }
    
    const postDoc = postSnapshot.data();
    
    // Sadece yazarın kendisi veya admin bu işlemi yapabilir
    // Bu kontrol client-side'da yapılmalı,
    // ancak server-side güvenlik kurallarıyla da desteklenmelidir
    if (postDoc.authorId !== userId) {
      // Admin kontrolü burada yapılabilir
      throw new Error('Bu blog yazısını düzenleme yetkiniz yok');
    }
    
    // Güncellenecek veri
    const updatedPost = {
      ...postData,
      updatedAt: serverTimestamp(),
    };
    
    // Kategori değişikliklerini izle ve sayaçları güncelle
    if (postData.categories && Array.isArray(postData.categories) && 
        postDoc.categories && Array.isArray(postDoc.categories)) {
      
      // Kategori eklemeler
      const addedCategories = postData.categories.filter(cat => !postDoc.categories.includes(cat));
      await Promise.all(addedCategories.map(async (categoryId) => {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
          postCount: increment(1)
        });
      }));
      
      // Kategori çıkarmalar
      const removedCategories = postDoc.categories.filter(cat => !postData.categories.includes(cat));
      await Promise.all(removedCategories.map(async (categoryId) => {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
          postCount: increment(-1)
        });
      }));
    }
    
    // Etiket değişikliklerini izle ve sayaçları güncelle
    if (postData.tags && Array.isArray(postData.tags) && 
        postDoc.tags && Array.isArray(postDoc.tags)) {
      
      // Etiket eklemeler
      const addedTags = postData.tags.filter(tag => !postDoc.tags.includes(tag));
      await Promise.all(addedTags.map(async (tagId) => {
        const tagRef = doc(db, 'tags', tagId);
        await updateDoc(tagRef, {
          postCount: increment(1)
        });
      }));
      
      // Etiket çıkarmalar
      const removedTags = postDoc.tags.filter(tag => !postData.tags.includes(tag));
      await Promise.all(removedTags.map(async (tagId) => {
        const tagRef = doc(db, 'tags', tagId);
        await updateDoc(tagRef, {
          postCount: increment(-1)
        });
      }));
    }
    
    // Blog yazısını güncelle
    await updateDoc(postRef, updatedPost);
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
    const postRef = doc(db, 'posts', postId);
    const postSnapshot = await getDoc(postRef);
    
    if (!postSnapshot.exists()) {
      throw new Error('Blog yazısı bulunamadı');
    }
    
    const postDoc = postSnapshot.data();
    
    // Sadece yazarın kendisi veya admin bu işlemi yapabilir
    // Bu kontrol client-side'da yapılmalı,
    // ancak server-side güvenlik kurallarıyla da desteklenmelidir
    if (postDoc.authorId !== userId) {
      // Admin kontrolü burada yapılabilir
      throw new Error('Bu blog yazısını silme yetkiniz yok');
    }
    
    // İşlemi bir transaction içinde yap
    await runTransaction(db, async (transaction) => {
      // Blog yazısını sil
      transaction.delete(postRef);
      
      // Kategorilerdeki sayaçları güncelle
      if (postDoc.categories && Array.isArray(postDoc.categories)) {
        postDoc.categories.forEach((categoryId) => {
          const categoryRef = doc(db, 'categories', categoryId);
          transaction.update(categoryRef, {
            postCount: increment(-1)
          });
        });
      }
      
      // Etiketlerdeki sayaçları güncelle
      if (postDoc.tags && Array.isArray(postDoc.tags)) {
        postDoc.tags.forEach((tagId) => {
          const tagRef = doc(db, 'tags', tagId);
          transaction.update(tagRef, {
            postCount: increment(-1)
          });
        });
      }
      
      // TODO: İlgili yorumları ve diğer bağlı verileri silme işlemleri de eklenebilir
    });
    
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
    }
    
    return { id: postId, ...postData };
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
        postsQuery,
        where('categories', 'array-contains', categoryId)
      );
    }
    
    // Etiket filtresi
    // Not: Firestore, çoklu array-contains sorgularını desteklemez
    // Bu nedenle, tag filtresi için ayrı bir index veya farklı bir yaklaşım gerekebilir
    
    // Yazar filtresi
    if (authorId) {
      postsQuery = query(
        postsQuery,
        where('authorId', '==', authorId)
      );
    }
    
    // Arama terimi (Firestore'da tam metin araması sınırlıdır)
    // Daha gelişmiş arama özellikleri için Algolia gibi çözümler kullanılabilir
    if (searchTerm) {
      // Basit başlık araması
      postsQuery = query(
        postsQuery,
        where('title', '>=', searchTerm),
        where('title', '<=', searchTerm + '\uf8ff')
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
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Son görünür öğeyi pagination için döndür
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      posts,
      lastVisible: lastVisibleDoc
    };
  } catch (error) {
    console.error('Blog yazıları listelenirken hata oluştu:', error);
    throw error;
  }
}