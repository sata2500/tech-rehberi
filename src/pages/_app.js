// src/pages/_app.js
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../components/common/Notification'; // Yeni eklenen
import SEO from '../components/SEO';
import OfflineNotification from '../components/OfflineNotification';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Global state ve PWA işlevselliği Layout bileşenine taşındı
  // Bu sayede _app.js sadece global provider'ları ve SEO ayarlarını yönetir

  // Tüm sayfalara uygulanacak varsayılan global SEO yapılandırması
  // Bu değerler, açıkça geçersiz kılınmadığı sürece tüm sayfalara uygulanır
  const globalSeoConfig = {
    title: null, // Yalnızca site adı kullanılacak
    description: 'Tech Rehberi - Teknoloji ve yazılım hakkında güncel bilgiler, rehberler ve ipuçları.',
    keywords: [
      'teknoloji rehberi', 'yazılım rehberi', 'teknoloji blog',
      'programlama', 'kodlama', 'web geliştirme', 'mobil uygulama'
    ],
    twitterSite: '@techrehberi',
    ogLocale: 'tr_TR',
    themeColor: '#3B82F6'
  };

  // Web sitesi için kuruluş şeması oluşturuyoruz
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Tech Rehberi',
    'url': process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com',
    'logo': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com'}/images/logo.png`,
    'sameAs': [
      'https://twitter.com/techrehberi',
      'https://facebook.com/techrehberi',
      'https://instagram.com/techrehberi',
      'https://linkedin.com/company/techrehberi'
    ]
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          {/* Tüm sayfalarda mevcut olacak global SEO ayarlarını uyguluyoruz */}
          <SEO 
            title={globalSeoConfig.title}
            description={globalSeoConfig.description}
            keywords={globalSeoConfig.keywords}
            twitterSite={globalSeoConfig.twitterSite}
            ogLocale={globalSeoConfig.ogLocale}
            themeColor={globalSeoConfig.themeColor}
            jsonLd={organizationSchema}
          />
          
          <Component {...pageProps} />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MyApp;