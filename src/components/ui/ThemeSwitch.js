// src/components/ui/ThemeSwitch.js
import { useTheme } from '../../contexts/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useEffect, useState } from 'react';

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Client-side rendering için
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Tema geçişi için animasyon kontrolü
  const handleThemeToggle = () => {
    // Animasyon durumunu aktif et
    setIsAnimating(true);
    
    // Animasyon için body'e sınıf ekle
    document.body.classList.add('theme-transition');
    
    // Temayı değiştir
    toggleTheme();
    
    // Animasyon bitince durumu sıfırla
    setTimeout(() => {
      setIsAnimating(false);
      document.body.classList.remove('theme-transition');
    }, 500); // CSS animasyon süresiyle eşleşmeli
  };
  
  // Render edilecek düğmenin özellikleri
  const iconSize = 22;
  const iconClass = "transition-transform duration-300";
  
  // SSR sırasında düğmeyi gösterme (hydration uyumsuzluğunu önlemek için)
  if (!mounted) {
    return <div className="w-10 h-10"></div>;
  }
  
  return (
    <button
      onClick={handleThemeToggle}
      disabled={isAnimating}
      className={`
        p-2 rounded-full 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        transition-all duration-300 ease-in-out
        ${theme === 'dark' 
          ? 'bg-gray-800 hover:bg-gray-700' 
          : 'bg-gray-100 hover:bg-gray-200'
        }
        ${isAnimating ? 'pointer-events-none' : ''}
      `}
      aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      {theme === 'dark' ? (
        <FiSun 
          className={`${iconClass} text-yellow-300 hover:text-yellow-400 ${isAnimating ? 'animate-spin' : ''}`} 
          size={iconSize} 
        />
      ) : (
        <FiMoon 
          className={`${iconClass} text-gray-600 hover:text-gray-800 ${isAnimating ? 'animate-spin' : ''}`} 
          size={iconSize} 
        />
      )}
    </button>
  );
}