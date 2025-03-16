// src/components/layout/ThemeSwitch.js
import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

export default function ThemeSwitch() {
  const { theme, changeTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // component mount edildiğinde işaretleyelim (SSR ile uyumluluk için)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tema menüsünü aç/kapat
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Menüyü dışarıya tıklayınca kapat
  useEffect(() => {
    const closeMenu = () => {
      setMenuOpen(false);
    };

    if (menuOpen) {
      document.addEventListener('click', closeMenu);
    }

    return () => {
      document.removeEventListener('click', closeMenu);
    };
  }, [menuOpen]);

  // Tema değiştirme işlevi
  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
    setMenuOpen(false);
  };

  // SSR için render kontrolü
  if (!mounted) {
    return (
      <button 
        className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label="Tema Değiştir"
      >
        <div className="w-5 h-5"></div>
      </button>
    );
  }

  // Mevcut temaya göre gösterilecek simge
  const getThemeIcon = () => {
    if (theme === 'dark') return <FiMoon className="w-5 h-5" />;
    if (theme === 'system') return <FiMonitor className="w-5 h-5" />;
    return <FiSun className="w-5 h-5" />;
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
        aria-label="Tema Değiştir"
        aria-expanded={menuOpen}
      >
        {getThemeIcon()}
      </button>

      {/* Tema seçim menüsü */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleThemeChange('light');
            }}
            className={`w-full px-4 py-2 text-left flex items-center ${
              theme === 'light' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiSun className="mr-3" />
            <span>Açık Tema</span>
            {theme === 'light' && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleThemeChange('dark');
            }}
            className={`w-full px-4 py-2 text-left flex items-center ${
              theme === 'dark' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiMoon className="mr-3" />
            <span>Koyu Tema</span>
            {theme === 'dark' && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleThemeChange('system');
            }}
            className={`w-full px-4 py-2 text-left flex items-center ${
              theme === 'system' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FiMonitor className="mr-3" />
            <span>Sistem</span>
            {theme === 'system' && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}