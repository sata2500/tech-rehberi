// scripts/simple-firebase-setup.js
// Bu basitleştirilmiş script, NOT_FOUND hatalarını önlemeye çalışır
const admin = require('firebase-admin');

// Service account anahtarını yükleyin
let serviceAccount;
try {
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  console.error('Firebase service account dosyası bulunamadı!');
  console.log('Lütfen firebase-service-account.json dosyasını doğru şekilde yerleştirdiğinizden emin olun.');
  process.exit(1);
}

// Firebase Admin başlatma (daha fazla debug bilgisi)
console.log('Firebase Admin başlatılıyor...');
console.log('Proje ID:', serviceAccount.project_id);

// Firebase'i başlatın
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore'a referans
const db = admin.firestore();

// Timestamp oluşturucu
const timestamp = admin.firestore.FieldValue.serverTimestamp();

// Koleksiyonları oluşturma ve yapılandırma
async function setupCollections() {
  console.log('Firebase koleksiyonları oluşturuluyor...');

  try {
    // Test belgeleri oluştur
    console.log('users koleksiyonu kontrol ediliyor...');
    const usersCollection = db.collection('users');
    
    // Koleksiyonda örnek belge var mı kontrol et
    const userSnapshot = await usersCollection.limit(1).get();
    
    if (userSnapshot.empty) {
      console.log('users koleksiyonu boş görünüyor. Örnek kullanıcı oluşturuluyor...');
      
      // Örnek kullanıcı oluştur
      const userId = `example_user_${Date.now()}`;
      await usersCollection.doc(userId).set({
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
      console.log('Örnek kullanıcı oluşturuldu:', userId);
    } else {
      console.log('users koleksiyonu mevcut. Belge sayısı:', userSnapshot.size);
    }
    
    // posts koleksiyonu
    console.log('posts koleksiyonu kontrol ediliyor...');
    const postsCollection = db.collection('posts');
    
    const postSnapshot = await postsCollection.limit(1).get();
    
    if (postSnapshot.empty) {
      console.log('posts koleksiyonu boş görünüyor. Örnek blog yazısı oluşturuluyor...');
      
      // Örnek blog yazısı oluştur
      const postId = `example_post_${Date.now()}`;
      await postsCollection.doc(postId).set({
        id: postId,
        title: 'Örnek Blog Yazısı',
        slug: 'ornek-blog-yazisi',
        content: 'Bu bir örnek blog yazısıdır.',
        authorId: 'sistem',
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'published',
        likeCount: 0,
        bookmarkCount: 0,
        commentCount: 0,
        viewCount: 0
      });
      console.log('Örnek blog yazısı oluşturuldu:', postId);
    } else {
      console.log('posts koleksiyonu mevcut. Belge sayısı:', postSnapshot.size);
    }
    
    // comments koleksiyonu
    console.log('comments koleksiyonu kontrol ediliyor...');
    const commentsCollection = db.collection('comments');
    
    const commentSnapshot = await commentsCollection.limit(1).get();
    
    if (commentSnapshot.empty) {
      console.log('comments koleksiyonu boş görünüyor. Örnek yorum oluşturuluyor...');
      
      // Örnek yorum oluştur
      const commentId = `example_comment_${Date.now()}`;
      await commentsCollection.doc(commentId).set({
        id: commentId,
        postId: postId || 'example_post',
        userId: userId || 'example_user',
        content: 'Bu bir örnek yorumdur.',
        displayName: 'Örnek Kullanıcı',
        createdAt: timestamp,
        updatedAt: timestamp
      });
      console.log('Örnek yorum oluşturuldu:', commentId);
    } else {
      console.log('comments koleksiyonu mevcut. Belge sayısı:', commentSnapshot.size);
    }
    
    console.log('Temel veritabanı yapısı başarıyla oluşturuldu!');
    
  } catch (error) {
    console.error('Koleksiyon oluşturma hatası:', error);
    console.log('\nHata detayı:', error.message);
    
    // Service account hata analizi
    if (error.code === 'app/invalid-credential' || error.code === 'app/invalid-cert') {
      console.log('\nService account anahtarı ile ilgili bir sorun var:');
      console.log('1. Service account anahtarının doğru ve geçerli olduğundan emin olun');
      console.log('2. Bu anahtarın Firestore\'a erişim izni olduğundan emin olun');
      console.log('3. Projenizde Firestore\'un etkinleştirildiğinden emin olun');
    }
    
    if (error.code === 5 || error.message.includes('NOT_FOUND')) {
      console.log('\nFirestore koleksiyonu bulunamadı:');
      console.log('1. Firestore veritabanınızın oluşturulduğundan emin olun');
      console.log('2. Firestore\'un Datastore değil, Native modda çalıştığından emin olun');
    }
  }
}

// Şimdi kurulumu çalıştır
setupCollections().then(() => {
  console.log('\nKoleksiyonlar kontrol edildi. Firebase Console üzerinden veritabanınızı inceleyin.');
  console.log('\nSONRAKİ ADIMLAR:');
  console.log('1. Firebase Console\'dan Firestore veritabanınızı kontrol edin');
  console.log('2. Tema değiştirme özelliğini test edin');
  
  // Firebase Admin uygulamasını kapat
  admin.app().delete().then(() => {
    console.log('İşlem tamamlandı.');
  });
}).catch(err => {
  console.error('Ana işlem hatası:', err);
});