# Tech Rehberi Blog Sitesi

Bu proje, Next.js ve Firebase kullanılarak geliştirilmiş bir teknoloji ve yazılım blog sitesidir. Kullanıcılar, teknoloji dünyasındaki en son gelişmeleri, ipuçlarını ve rehberleri okuyabilirler.

## Özellikler

- 📱 Duyarlı tasarım (Mobil, tablet ve masaüstü)
- 🌙 Karanlık/Aydınlık tema desteği
- 🔐 Firebase Authentication ile Google girişi
- 📝 Admin paneli ile içerik yönetimi (Blog yazıları ve kategoriler)
- 🖼️ Görsel yükleme ve yönetim
- 🔍 SEO optimizasyonu
- 📊 Yapılandırılmış veriler (JSON-LD)
- 🗺️ Sitemap.xml ve robots.txt
- 📱 PWA (Progressive Web App) desteği

## Teknoloji Yığını

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Firebase Authentication, Firestore, Storage
- **Araçlar:** React Icons, React Hook Form, React Quill

## Başlarken

### Gereksinimler

- Node.js 14.x veya üzeri
- npm veya yarn
- Firebase projesi

### Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/kullanici-adi/tech-rehberi.git
   cd tech-rehberi
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   # veya
   yarn install
   ```

3. `.env.local` dosyasını oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   NEXT_PUBLIC_SITE_URL=your-site-url
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   # veya
   yarn dev
   ```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### Firebase Kurulumu

1. [Firebase Console](https://console.firebase.google.com/)'a gidin ve yeni bir proje oluşturun.
2. Authentication servisini etkinleştirin ve Google oturum açma yöntemini ekleyin.
3. Firestore Database oluşturun.
4. Storage hizmetini etkinleştirin.
5. Firestore ve Storage için güvenlik kurallarını güncelleyin.

## Dağıtım

### Vercel'e Dağıtım

1. [Vercel](https://vercel.com/) hesabınızla oturum açın.
2. Yeni bir proje içe aktarın ve GitHub deposunu seçin.
3. Çevre değişkenlerini `.env.local` dosyasından Vercel projesi ayarlarına ekleyin.
4. Dağıtımı başlatın.

### Firebase Hosting'e Dağıtım

1. Firebase CLI'yi yükleyin:
   ```bash
   npm install -g firebase-tools
   ```

2. Firebase'de oturum açın:
   ```bash
   firebase login
   ```

3. Projenizi başlatın:
   ```bash
   firebase init
   ```

4. Hosting'i seçin ve projenizi yapılandırın.
5. Uygulamayı oluşturun:
   ```bash
   npm run build
   ```

6. Dağıtın:
   ```bash
   firebase deploy
   ```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız veya geri bildirimleriniz için [email@example.com](mailto:email@example.com) adresinden bize ulaşabilirsiniz.