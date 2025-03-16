// src/components/layout/AdminLayout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiFileText, FiTag, FiMessageSquare, FiSettings, FiLogOut } from 'react-icons/fi';
import ThemeSwitch from './ThemeSwitch';

export default function AdminLayout({ children, title }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Kullanıcı yüklendiğinde admin kontrolü
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
        router.push('/giris');
      } else if (user.role !== 'admin') {
        // Kullanıcı admin değilse anasayfaya yönlendir
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Çıkış yapma işlevi
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Yükleme durumu veya kullanıcı yoksa yükleniyor göster
  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Kullanıcı admin değilse yetki hatası göster
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erişim Reddedildi</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
          Bu sayfaya erişmek için admin yetkilerine sahip olmanız gerekmektedir.
        </p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Anasayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobil Menü Butonu */}
      <div className="md:hidden bg-white dark:bg-gray-800 p-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {title || 'Admin Paneli'}
        </h1>
        <div className="flex items-center space-x-4">
          <ThemeSwitch />
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Kenar Çubuğu */}
        <aside 
          className={`
            ${isSidebarOpen ? 'block' : 'hidden'} 
            md:block md:w-64 bg-white dark:bg-gray-800 md:h-screen md:sticky md:top-0 overflow-y-auto shadow-md
          `}
        >
          <div className="p-6">
            <Link href="/" className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
              <span>Tech Rehberi</span>
            </Link>
          </div>
          <nav className="px-4 pb-6 space-y-1">
            <Link 
              href="/admin" 
              className={`
                flex items-center px-4 py-3 rounded-md 
                ${router.pathname === '/admin' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <FiHome className="mr-3" /> Kontrol Paneli
            </Link>
            <Link 
              href="/admin/yazilar" 
              className={`
                flex items-center px-4 py-3 rounded-md 
                ${router.pathname.startsWith('/admin/yazi') 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <FiFileText className="mr-3" /> Yazılar
            </Link>
            <Link 
              href="/admin/kategoriler" 
              className={`
                flex items-center px-4 py-3 rounded-md 
                ${router.pathname.startsWith('/admin/kategori') 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <FiTag className="mr-3" /> Kategoriler
            </Link>
            <Link 
              href="/admin/yorumlar" 
              className={`
                flex items-center px-4 py-3 rounded-md 
                ${router.pathname === '/admin/yorumlar' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <FiMessageSquare className="mr-3" /> Yorumlar
            </Link>
            <Link 
              href="/admin/ayarlar" 
              className={`
                flex items-center px-4 py-3 rounded-md 
                ${router.pathname === '/admin/ayarlar' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <FiSettings className="mr-3" /> Ayarlar
            </Link>
            
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FiLogOut className="mr-3" /> Çıkış Yap
            </button>
          </nav>
        </aside>

        {/* Ana İçerik */}
        <main className="flex-1 p-4 md:p-6">
          <div className="hidden md:flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {title || 'Admin Paneli'}
            </h1>
            <ThemeSwitch />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}