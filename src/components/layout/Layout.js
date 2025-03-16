// src/components/layout/Layout.js
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import SEO from '../SEO';
import Header from './Header';
import Footer from './Footer';
import OfflineNotification from '../OfflineNotification';

export default function Layout({ 
  children, 
  title, 
  description, 
  canonical, 
  ogType,
  ogImage,
  ogTitle,
  ogDescription,
  twitterCard,
  jsonLd
}) {
  // Tema contextinden değerleri al
  const { theme, isDark } = useTheme();
  
  // Çevrimdışı durumu izleyen state
  const [isOffline, setIsOffline] = useState(false);
  
  // PWA kurulum durumunu izleyen state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Çevrimdışı/çevrimiçi durum takibi
  useEffect(() => {
    // Bileşen mount edildiğinde mevcut bağlantı durumunu kontrol et
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);

      // Çevrimdışı/çevrimiçi olaylarını dinle
      const handleOffline = () => setIsOffline(true);
      const handleOnline = () => setIsOffline(false);

      // Olay dinleyicilerini ekle
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);

      // Temizleme işlevi
      return () => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
      };
    }
  }, []);

  // PWA kurulum isteğini yakala
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // PWA zaten kurulu mu kontrol et
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsPwaInstalled(true);
      }

      // beforeinstallprompt olayını dinle (PWA kurulum isteği)
      const handleBeforeInstallPrompt = (e) => {
        // Varsayılan prompt'u engelle
        e.preventDefault();
        // Etkinliği daha sonra kullanmak üzere sakla
        setDeferredPrompt(e);
      };

      // Kurulum tamamlandığında
      const handleAppInstalled = () => {
        setIsPwaInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  // PWA'yı kurmak için işlev
  const installPwa = async () => {
    if (deferredPrompt) {
      // Kurulum isteğini göster
      deferredPrompt.prompt();
      // Kullanıcı yanıtını bekle
      const { outcome } = await deferredPrompt.userChoice;
      // Kullanıcı kurulumu tamamladıysa deferredPrompt'u sıfırla
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <>
      <SEO 
        title={title}
        description={description}
        canonical={canonical}
        ogType={ogType}
        ogImage={ogImage}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        twitterCard={twitterCard}
        jsonLd={jsonLd}
      />
      <div className={`min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        <Header />
        
        {/* Çevrimdışı bildirimi */}
        {isOffline && <OfflineNotification />}
        
        {/* PWA kurulum isteği varsa ve henüz kurulu değilse kurulum önerisi göster */}
        {deferredPrompt && !isPwaInstalled && (
          <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold">Tech Rehberi Uygulaması</h3>
              <p>Daha iyi bir deneyim için uygulamayı yükleyin!</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setDeferredPrompt(null)} 
                className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800"
              >
                Daha Sonra
              </button>
              <button 
                onClick={installPwa} 
                className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
              >
                Yükle
              </button>
            </div>
          </div>
        )}
        
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}