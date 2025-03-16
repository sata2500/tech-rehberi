// src/components/layout/Header.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';
import ThemeSwitch from '../ui/ThemeSwitch';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sayfa scroll edildiğinde header stilini değiştir
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    // Menü açıldığında sayfanın scroll edilmesini engelle
    if (!menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white dark:bg-gray-800 transition-all duration-300 ${
      scrolled ? 'shadow-md' : 'shadow-sm'
    }`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo - daha küçük ekranlarda daha küçük yazı tipi */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white transition-colors">
            Tech Rehberi
          </Link>

          {/* Mobile menu button - dokunma alanını genişlettik */}
          <div className="md:hidden flex items-center">
            <ThemeSwitch />
            <button
              className="ml-4 p-2 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              onClick={toggleMenu}
              aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Desktop Navigation - spacing iyileştirildi */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
            <Link href="/" className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Ana Sayfa
            </Link>
            <Link href="/blog" className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Blog
            </Link>
            <Link href="/kategoriler" className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Kategoriler
            </Link>
            <Link href="/hakkimizda" className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Hakkımızda
            </Link>
            <Link href="/iletisim" className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              İletişim
            </Link>
            
            <ThemeSwitch />

            <div className="ml-2 flex items-center space-x-2">
              {user ? (
                <div className="flex items-center flex-wrap gap-2">
                  {user.role === 'admin' && (
                    <Link 
                      href="/admin" 
                      className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link 
                    href="/hesabim" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    Hesabım
                  </Link>
                  <button
                    onClick={logout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                  >
                    Çıkış Yap
                  </button>
                </div>
              ) : (
                <Link 
                  href="/giris" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </nav>
        </div>

        {/* Mobile Navigation - animasyon ve dokunma alanları iyileştirildi */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-40" onClick={toggleMenu}>
            <nav 
              className="py-6 px-4 bg-white dark:bg-gray-800 h-full w-4/5 max-w-sm overflow-y-auto transform transition-transform duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={toggleMenu}
                >
                  Ana Sayfa
                </Link>
                <Link 
                  href="/blog" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={toggleMenu}
                >
                  Blog
                </Link>
                <Link 
                  href="/kategoriler" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={toggleMenu}
                >
                  Kategoriler
                </Link>
                <Link 
                  href="/hakkimizda" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={toggleMenu}
                >
                  Hakkımızda
                </Link>
                <Link 
                  href="/iletisim" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={toggleMenu}
                >
                  İletişim
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="block text-blue-600 hover:text-blue-800 py-3 px-4 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          onClick={toggleMenu}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link 
                        href="/hesabim" 
                        className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white py-3 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={toggleMenu}
                      >
                        Hesabım
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          toggleMenu();
                        }}
                        className="w-full text-left bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md mt-4 transition-colors"
                      >
                        Çıkış Yap
                      </button>
                    </>
                  ) : (
                    <Link 
                      href="/giris" 
                      className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md text-center transition-colors"
                      onClick={toggleMenu}
                    >
                      Giriş Yap
                    </Link>
                  )}
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}