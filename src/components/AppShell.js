// src/components/AppShell.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSwitch from './ui/ThemeSwitch';

/**
 * App Shell bileşeni - PWA için kritik UI altyapısı
 * Bu bileşen, navigasyon, tema değiştirme ve temel sayfa yapısını içerir
 * Service Worker tarafından önbelleğe alınarak çevrimdışı kullanımı sağlar
 */
const AppShell = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sayfa geçişlerini izle ve yükleme durumunu güncelle
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Sayfa kaydırma durumunu izle
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ana navigasyon menü öğeleri
  const navItems = [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Makaleler', href: '/makaleler' },
    { label: 'Kategoriler', href: '/kategoriler' },
    { label: 'Hakkımızda', href: '/hakkimizda' },
    { label: 'İletişim', href: '/iletisim' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Üst Çubuk - App Shell'in ana parçası */}
      <header 
        className={`sticky top-0 z-40 w-full transition-shadow duration-300 ${
          isScrolled 
            ? 'bg-white shadow-md dark:bg-gray-800 dark:shadow-gray-700/20' 
            : 'bg-white dark:bg-gray-800'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                Tech Rehberi
              </Link>
            </div>

            {/* Mobil için menü butonu */}
            <div className="md:hidden">
              <button
                className="text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Ana menüyü aç/kapat"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {menuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop navigasyon menüsü */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-1 py-2 text-sm font-medium ${
                    router.pathname === item.href
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Tema değiştirme ve kullanıcı düğmesi */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeSwitch />

              {user ? (
                <div className="relative">
                  <button
                    className="flex items-center text-sm text-gray-700 dark:text-gray-200"
                    aria-label="Kullanıcı menüsü"
                  >
                    <span className="mr-2">{user.displayName || user.email}</span>
                    <Image
                      className="h-8 w-8 rounded-full object-cover"
                      src={user.photoURL || `/images/default-avatar.png`}
                      alt="Avatar"
                      width={32}
                      height={32}
                    />
                  </button>
                </div>
              ) : (
                <Link
                  href="/giris"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobil navigasyon menüsü */}
        <div
          className={`md:hidden ${
            menuOpen ? 'block' : 'hidden'
          } bg-white dark:bg-gray-800 border-t dark:border-gray-700`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  router.pathname === item.href
                    ? 'text-white bg-blue-600 dark:bg-blue-800'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobil için tema değiştirme ve kullanıcı düğmeleri */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-3">
                <ThemeSwitch />
                
                {user ? (
                  <button
                    onClick={logout}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Çıkış Yap
                  </button>
                ) : (
                  <Link
                    href="/giris"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setMenuOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sayfa yükleniyor göstergesi */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100">
          <div className="h-full bg-blue-600 animate-loading-bar" style={{ width: '30%' }}></div>
        </div>
      )}

      {/* Ana içerik */}
      <main className="flex-grow">{children}</main>

      {/* Alt bilgi - App Shell'in parçası */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Tech Rehberi</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Teknoloji ve yazılım hakkında güncel bilgiler, rehberler ve ipuçları.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Hızlı Bağlantılar</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Bizi Takip Edin</h3>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com/techrehberi"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.1 10.1 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.16a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                  </svg>
                </a>
                
                <a
                  href="https://linkedin.com/company/techrehberi"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-300">
            <p>&copy; {new Date().getFullYear()} Tech Rehberi. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;