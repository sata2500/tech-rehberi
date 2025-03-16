// Firebase CLI ile Firestore veri modeli oluşturma
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase'i başlat (CLI'nin sağladığı kimlik bilgileriyle)
admin.initializeApp();

// Firestore referansı
const db = admin.firestore();

// Zaman damgaları için
const FieldValue = admin.firestore.FieldValue;

async function setupFirestore() {
  console.log('Firestore veri modeli oluşturuluyor...');
  
  try {
    // 1. Örnek Kullanıcı Oluştur
    console.log('Örnek kullanıcı oluşturuluyor...');
    
    const userId = `example_user_${Date.now()}`;
    await db.collection('users').doc(userId).set({
      id: userId,
      displayName: 'Örnek Kullanıcı',
      email: 'ornek@techrehberi.com',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      role: 'user',
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
    
    console.log(`Kullanıcı oluşturuldu: ${userId}`);
    
    // 2. Örnek Blog Yazısı Oluştur
    console.log('Örnek blog yazısı oluşturuluyor...');
    
    const postId = `example_post_${Date.now()}`;
    await db.collection('posts').doc(postId).set({
      id: postId,
      title: 'Örnek Blog Yazısı',
      slug: 'ornek-blog-yazisi',
      content: 'Bu bir örnek blog yazısıdır. Tech Rehberi sitesi için oluşturulmuştur.',
      excerpt: 'Bu bir örnek blog yazısıdır.',
      authorId: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
      status: 'published',
      categories: ['Genel', 'Teknoloji'],
      tags: ['örnek', 'test'],
      likeCount: 0,
      bookmarkCount: 0,
      commentCount: 0,
      viewCount: 0
    });
    
    console.log(`Blog yazısı oluşturuldu: ${postId}`);
    
    // 3. Örnek Yorum Oluştur
    console.log('Örnek yorum oluşturuluyor...');
    
    const commentId = `example_comment_${Date.now()}`;
    await db.collection('comments').doc(commentId).set({
      id: commentId,
      postId: postId,
      userId: userId,
      content: 'Bu bir örnek yorumdur. Tech Rehberi blog yazısı için oluşturulmuştur.',
      displayName: 'Örnek Kullanıcı',
      postTitle: 'Örnek Blog Yazısı',
      postSlug: 'ornek-blog-yazisi',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`Yorum oluşturuldu: ${commentId}`);
    
    // 4. Kategoriler Oluştur
    console.log('Örnek kategoriler oluşturuluyor...');
    
    const categories = ['Teknoloji', 'Yazılım', 'Web Geliştirme', 'Mobil', 'Yapay Zeka'];
    
    for (const category of categories) {
      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      await db.collection('categories').doc(categoryId).set({
        id: categoryId,
        name: category,
        slug: categoryId,
        description: `${category} kategorisi içeriklerini içerir.`,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
    
    console.log('Kategoriler oluşturuldu.');
    
    console.log('\nFirestore veri modeli başarıyla oluşturuldu!');
    console.log('\nSONRAKİ ADIMLAR:');
    console.log('1. Firebase Console üzerinden veritabanını kontrol edin');
    console.log('2. Tema değiştirme özelliklerini test edin');
    
  } catch (error) {
    console.error('Veri modeli oluşturulurken hata:', error);
  }
}

// Güvenlik kurallarını dosyadan yazma
async function setupSecurityRules() {
  console.log('\nFirestore güvenlik kuralları yükleniyor...');
  
  try {
    const rulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temel fonksiyonlar
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Kullanıcılar koleksiyonu
    match /users/{userId} {
      // Kullanıcılar kendi profillerini okuyabilir/güncelleyebilir, adminler tüm profilleri yönetebilir
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Blog yazıları koleksiyonu
    match /posts/{postId} {
      // Herkes yayınlanan gönderileri okuyabilir
      allow read: if resource.data.status == 'published' || isAdmin() || isOwner(resource.data.authorId);
      
      // Yalnızca admin ve içerik üreticileri yeni gönderi oluşturabilir
      allow create: if isAuthenticated();
      
      // Yazarlar kendi gönderilerini güncelleyebilir, adminler tüm gönderileri güncelleyebilir
      allow update: if isOwner(resource.data.authorId) || isAdmin();
      
      // Yalnızca adminler gönderi silebilir
      allow delete: if isAdmin();
    }
    
    // Yorumlar koleksiyonu
    match /comments/{commentId} {
      // Herkes yorumları okuyabilir
      allow read;
      
      // Kimlik doğrulaması yapılmış kullanıcılar yorum ekleyebilir
      allow create: if isAuthenticated();
      
      // Kullanıcılar kendi yorumlarını düzenleyebilir
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Kullanıcılar kendi yorumlarını silebilir, adminler herhangi bir yorumu silebilir
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Kategoriler - Yalnızca adminler yönetebilir, herkes okuyabilir
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}`;
    
    // Rules dosyasını kaydet
    fs.writeFileSync('firestore.rules', rulesContent);
    
    console.log('Güvenlik kuralları dosyası oluşturuldu: firestore.rules');
    console.log('Kuralları yüklemek için aşağıdaki komutu kullanın:');
    console.log('firebase deploy --only firestore:rules');
    
  } catch (error) {
    console.error('Güvenlik kuralları yazılırken hata:', error);
  }
}

// Ana işlev
async function main() {
  try {
    await setupFirestore();
    await setupSecurityRules();
  } catch (error) {
    console.error('Ana işlev hatası:', error);
  } finally {
    process.exit(0);
  }
}

// Çalıştır
main();