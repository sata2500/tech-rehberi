// scripts/setup-firebase-data-model.js
// Bu script, Firebase veri modelini güncellemek için kullanılır
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Service account anahtarını yükleyin (Firebase Console'dan indirmeniz gerekiyor)
// https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk
let serviceAccount;
try {
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  console.error('Firebase service account dosyası bulunamadı!');
  console.log('Lütfen aşağıdaki adımları izleyin:');
  console.log('1. Firebase Console\'a gidin: https://console.firebase.google.com');
  console.log('2. Projenizi seçin');
  console.log('3. Proje Ayarları > Servis Hesapları');
  console.log('4. "Firebase Admin SDK" altında "Yeni özel anahtar oluştur" butonuna tıklayın');
  console.log('5. İndirilen JSON dosyasını projenizin kök dizinine "firebase-service-account.json" olarak kaydedin');
  process.exit(1);
}

// Firebase'i başlatın
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore'a referans
const db = admin.firestore();
const batch = db.batch();

// Timestamp fonksiyonu
const timestamp = admin.firestore.FieldValue.serverTimestamp();
const increment = admin.firestore.FieldValue.increment;
const arrayUnion = admin.firestore.FieldValue.arrayUnion;

// Veri modeli güncelleme işlevi
async function updateDataModel() {
  console.log('Firebase veri modeli güncelleme başlatılıyor...');

  try {
    // 1. Kullanıcıları güncelle
    console.log('Kullanıcılar kontrol ediliyor ve güncelleniyor...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('Hiç kullanıcı bulunamadı. Kullanıcı koleksiyonu atlıyoruz.');
    } else {
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        const updates = {};
        let updateNeeded = false;
        
        // Yeni alanları ve varsayılan değerleri kontrol et
        if (!user.hasOwnProperty('bio')) {
          updates.bio = '';
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('location')) {
          updates.location = '';
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('website')) {
          updates.website = '';
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('twitterUsername')) {
          updates.twitterUsername = '';
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('githubUsername')) {
          updates.githubUsername = '';
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('bookmarkedPosts')) {
          updates.bookmarkedPosts = [];
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('likedPosts')) {
          updates.likedPosts = [];
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('preferences')) {
          updates.preferences = {
            theme: 'light', // Varsayılan tema
            emailNotifications: {
              newPosts: true,
              comments: true,
              newsletter: true
            }
          };
          updateNeeded = true;
        }
        
        if (!user.hasOwnProperty('updatedAt')) {
          updates.updatedAt = timestamp;
          updateNeeded = true;
        }
        
        // Eğer güncelleme gerekiyorsa, batch'e ekle
        if (updateNeeded) {
          batch.update(doc.ref, updates);
          console.log(`Kullanıcı güncellendi: ${doc.id}`);
        }
      });
    }
    
    // 2. Blog yazılarını güncelle
    console.log('Blog yazıları kontrol ediliyor ve güncelleniyor...');
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('Hiç blog yazısı bulunamadı. Blog yazıları koleksiyonu atlıyoruz.');
    } else {
      postsSnapshot.forEach(doc => {
        const post = doc.data();
        const updates = {};
        let updateNeeded = false;
        
        // Yeni alanları ve varsayılan değerleri kontrol et
        if (!post.hasOwnProperty('likeCount')) {
          updates.likeCount = 0;
          updateNeeded = true;
        }
        
        if (!post.hasOwnProperty('bookmarkCount')) {
          updates.bookmarkCount = 0;
          updateNeeded = true;
        }
        
        if (!post.hasOwnProperty('commentCount')) {
          updates.commentCount = 0;
          updateNeeded = true;
        }
        
        if (!post.hasOwnProperty('viewCount')) {
          updates.viewCount = 0;
          updateNeeded = true;
        }
        
        // Eğer güncelleme gerekiyorsa, batch'e ekle
        if (updateNeeded) {
          batch.update(doc.ref, updates);
          console.log(`Blog yazısı güncellendi: ${doc.id}`);
        }
      });
    }
    
    // 3. Comments koleksiyonunu kontrol et
    console.log('Yorumlar koleksiyonu kontrol ediliyor...');
    const commentsSnapshot = await db.collection('comments').get();
    
    if (commentsSnapshot.empty) {
      console.log('Yorumlar koleksiyonu boş veya mevcut değil. Yeni koleksiyon kurulabilir.');
    } else {
      console.log(`Yorumlar koleksiyonu mevcut, ${commentsSnapshot.size} yorum bulundu.`);
    }
    
    // 4. user-interactions koleksiyonunu kontrol et
    console.log('Kullanıcı etkileşimleri koleksiyonu kontrol ediliyor...');
    const interactionsSnapshot = await db.collection('user-interactions').get();
    
    if (interactionsSnapshot.empty) {
      console.log('Kullanıcı etkileşimleri koleksiyonu boş veya mevcut değil. Yeni koleksiyon kurulabilir.');
    } else {
      console.log(`Kullanıcı etkileşimleri koleksiyonu mevcut, ${interactionsSnapshot.size} etkileşim bulundu.`);
    }
    
    // 5. Batch işlemini uygula
    await batch.commit();
    console.log('Veri modeli güncellemesi başarıyla tamamlandı!');
    
    // 6. Örnek belge oluştur (sadece geliştirme amacıyla)
    if (process.env.NODE_ENV === 'development' && process.env.CREATE_SAMPLE_DATA === 'true') {
      console.log('Örnek veriler oluşturuluyor...');
      await createSampleData();
    }
    
  } catch (error) {
    console.error('Veri modeli güncellemesi sırasında hata oluştu:', error);
  }
}

// Örnek veri oluşturma işlevi (opsiyonel - sadece geliştirme ortamında)
async function createSampleData() {
  try {
    // Örnek bir yorum ekle
    const sampleCommentRef = db.collection('comments').doc();
    await sampleCommentRef.set({
      id: sampleCommentRef.id,
      postId: 'sample-post-id',
      userId: 'sample-user-id',
      content: 'Bu bir örnek yorumdur. Veri modeli testi için oluşturulmuştur.',
      displayName: 'Örnek Kullanıcı',
      postTitle: 'Örnek Blog Yazısı',
      postSlug: 'ornek-blog-yazisi',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Örnek bir etkileşim ekle
    const sampleInteractionRef = db.collection('user-interactions').doc();
    await sampleInteractionRef.set({
      id: sampleInteractionRef.id,
      userId: 'sample-user-id',
      postId: 'sample-post-id',
      type: 'bookmark',
      createdAt: timestamp
    });
    
    console.log('Örnek veriler başarıyla oluşturuldu!');
  } catch (error) {
    console.error('Örnek veri oluşturma sırasında hata oluştu:', error);
  }
}

// Güvenlik kurallarını güncelleme işlevi
async function updateSecurityRules() {
  console.log('Firebase güvenlik kuralları güncelleniyor...');
  
  try {
    // Güvenlik kuralları dosyasını oku
    const rulesPath = path.join(__dirname, '../firebase/firestore.rules');
    
    if (!fs.existsSync(rulesPath)) {
      console.error('Güvenlik kuralları dosyası bulunamadı:', rulesPath);
      console.log('Lütfen aşağıdaki adımları izleyin:');
      console.log('1. firebase/ dizinini oluşturun');
      console.log('2. Güncel güvenlik kurallarını içeren firestore.rules dosyasını bu dizine ekleyin');
      console.log('Önerilen güvenlik kuralları için artifacts/updated-firebase-rules.js dosyasına bakın.');
      return;
    }
    
    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    // Firebase CLI ile kuralları yükleme
    console.log('Güvenlik kurallarını yüklemek için Firebase CLI kullanmanız gerekiyor.');
    console.log('Kuralları manuel olarak yüklemek için şu komutu çalıştırın:');
    console.log('firebase deploy --only firestore:rules');
    
  } catch (error) {
    console.error('Güvenlik kuralları güncellemesi sırasında hata oluştu:', error);
  }
}

// Ana işlev
async function main() {
  try {
    await updateDataModel();
    await updateSecurityRules();
    
    console.log('\nFirebase yapılandırması tamamlandı!');
    console.log('\nSONRAKİ ADIMLAR:');
    console.log('1. Oluşturulan veri modelini Firebase konsolundan kontrol edin.');
    console.log('2. Güvenlik kurallarını manuel olarak güncelleyin:');
    console.log('   firebase deploy --only firestore:rules');
    console.log('3. Uygulamanızı çalıştırın ve yeni özellikleri test edin.');
    
  } catch (error) {
    console.error('Ana işlev sırasında hata oluştu:', error);
  } finally {
    // Firebase Admin uygulamasını kapat
    await admin.app().delete();
  }
}

// Scripti çalıştır
main();