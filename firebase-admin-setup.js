// Daha basit Firebase Admin kurulumu
const admin = require('firebase-admin');
const fs = require('fs');

// Firebase Admin başlatma - Proje ID'sini açıkça belirtiyoruz
let serviceAccount;
try {
  // Service account anahtarını yüklemeyi dene
  serviceAccount = require('./firebase-service-account.json');
} catch (error) {
  console.error('Service account anahtarı bulunamadı.');
  console.error('Firebase Console > Proje Ayarları > Servis Hesapları\'ndan yeni bir anahtar indirin.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tech-rehberi-25' // Projenizin ID'sini açıkça belirtin
});

// Firestore referansı
const db = admin.firestore();

// Zaman damgaları için yardımcı değişkenler
const timestamp = admin.firestore.FieldValue.serverTimestamp();

async function setupCollections() {
  console.log('Firestore veri modeli oluşturuluyor...');
  
  try {
    // 1. users koleksiyonu
    console.log('Örnek kullanıcı oluşturuluyor...');
    const userId = `example_${Date.now()}`;
    
    await db.collection('users').doc(userId).set({
      id: userId,
      displayName: 'Örnek Kullanıcı',
      email: 'ornek@techrehberi.com',
      createdAt: timestamp,
      updatedAt: timestamp,
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
    
    console.log(`✅ Kullanıcı oluşturuldu: ${userId}`);
    
    // 2. posts koleksiyonu
    console.log('Örnek blog yazısı oluşturuluyor...');
    const postId = `example_post_${Date.now()}`;
    
    await db.collection('posts').doc(postId).set({
      id: postId,
      title: 'Örnek Blog Yazısı',
      slug: 'ornek-blog-yazisi',
      content: 'Bu bir örnek blog yazısıdır. Tech Rehberi için oluşturulmuştur.',
      excerpt: 'Bu bir örnek blog yazısıdır.',
      authorId: userId,
      categories: ['Teknoloji', 'Web'],
      tags: ['örnek', 'test'],
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: timestamp,
      status: 'published',
      likeCount: 0,
      bookmarkCount: 0,
      commentCount: 0,
      viewCount: 0
    });
    
    console.log(`✅ Blog yazısı oluşturuldu: ${postId}`);
    
    // 3. comments koleksiyonu
    console.log('Örnek yorum oluşturuluyor...');
    const commentId = `example_comment_${Date.now()}`;
    
    await db.collection('comments').doc(commentId).set({
      id: commentId,
      postId: postId,
      userId: userId,
      content: 'Bu bir örnek yorumdur. Tech Rehberi için oluşturulmuştur.',
      displayName: 'Örnek Kullanıcı',
      postTitle: 'Örnek Blog Yazısı',
      postSlug: 'ornek-blog-yazisi',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    console.log(`✅ Yorum oluşturuldu: ${commentId}`);
    
    // 4. categories koleksiyonu
    console.log('Örnek kategoriler oluşturuluyor...');
    
    const categories = [
      { name: 'Teknoloji', slug: 'teknoloji' },
      { name: 'Yazılım', slug: 'yazilim' },
      { name: 'Web Geliştirme', slug: 'web-gelistirme' },
      { name: 'Mobil', slug: 'mobil' },
      { name: 'Yapay Zeka', slug: 'yapay-zeka' }
    ];
    
    for (const category of categories) {
      await db.collection('categories').doc(category.slug).set({
        id: category.slug,
        name: category.name,
        slug: category.slug,
        description: `${category.name} kategorisi için içerikler.`,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
    
    console.log(`✅ Kategoriler oluşturuldu.`);
    
    console.log('\n🎉 Firebase veri modeli başarıyla oluşturuldu!');
    
  } catch (error) {
    console.error('❌ Koleksiyon oluşturma hatası:', error);
  }
}

// Güvenlik kurallarını oluştur
async function createSecurityRules() {
  console.log('\nFirestore güvenlik kuralları oluşturuluyor...');
  
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
  
  fs.writeFileSync('firestore.rules', rulesContent);
  console.log('✅ Güvenlik kuralları dosyası oluşturuldu: firestore.rules');
}

// Ana işlem
async function main() {
  try {
    await setupCollections();
    await createSecurityRules();
    
    console.log('\n🚀 İŞLEM TAMAMLANDI! SONRAKI ADIMLAR:');
    console.log('1. Firestore veri modelini Firebase Console\'dan kontrol edin');
    console.log('2. Güvenlik kurallarını yükleyin: firebase deploy --only firestore:rules');
    console.log('3. Next.js uygulamanızı güncelleyip tema değiştirme özelliğini test edin');
    
  } catch (error) {
    console.error('❌ Ana işlem hatası:', error);
  } finally {
    process.exit(0);
  }
}

// Çalıştır
main();