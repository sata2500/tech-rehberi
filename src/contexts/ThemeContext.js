// src/contexts/ThemeContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserPreferences, updateUserPreferences } from '../lib/user-helpers';

// Tema bağlamı oluştur
export const ThemeContext = createContext();

// Theme varsayılan değerleri
const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system'
};

// Tema sağlayıcı bileşeni
export function ThemeProvider({ children }) {
  const { user } = useAuth();
  // İlk yükleme için boş string, client-side scriptinden gelecek değeri bekleyelim
  const [theme, setTheme] = useState('');
  // Istemci tarafında çalışıp çalışmadığımızı kontrol etmek için
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sayfa sadece client tarafında yüklendiğinde çalışacak
  useEffect(() => {
    // İlk render sonrası istemci tarafında olduğumuzu işaretleyelim
    setIsMounted(true);
    
    // HTML'de data-theme özniteliğini kontrol et (SSR ile uyumlu)
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme) {
      setTheme(currentTheme);
    } else {
      // Eğer data-theme yoksa localStorage kontrolü yap
      const storedTheme = 
        typeof window !== 'undefined' 
          ? localStorage.getItem('theme') 
          : null;
      
      if (storedTheme) {
        setTheme(storedTheme);
      } else if (
        typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        setTheme(THEMES.DARK);
      } else {
        setTheme(THEMES.LIGHT);
      }
    }
    setIsLoading(false);
  }, []);
  
  // Kullanıcı girişi yapıldığında Firestore'dan tercihleri yükle
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.uid || !isMounted) return;
      
      setIsLoading(true);
      try {
        const { success, preferences } = await getUserPreferences(user.uid);
        
        if (success && preferences && preferences.theme) {
          // Sistem teması seçilmişse, sistem ayarını kontrol et
          if (preferences.theme === THEMES.SYSTEM) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? THEMES.DARK : THEMES.LIGHT);
            // Ama localStorage'a system değerini kaydet ki tercihin korunsun
            localStorage.setItem('theme', THEMES.SYSTEM);
          } else {
            setTheme(preferences.theme);
            localStorage.setItem('theme', preferences.theme);
          }
        }
      } catch (error) {
        console.error('Tema tercihi yüklenirken hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserPreferences();
  }, [user, isMounted]);
  
  // Tema değiştiğinde uygulanacak işlemler
  useEffect(() => {
    if (!isMounted || !theme) return;

    const root = window.document.documentElement;
    
    // 'system' teması için gerçekte uygulanacak temayı belirle
    let appliedTheme = theme;
    if (theme === THEMES.SYSTEM) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      appliedTheme = prefersDark ? THEMES.DARK : THEMES.LIGHT;
    }
    
    // data-theme özniteliğini güncelle (CSS geçişleri için)
    root.setAttribute('data-theme', appliedTheme);
    
    // Koyu tema için dark sınıfını ekle/kaldır (Tailwind uyumluluğu için)
    if (appliedTheme === THEMES.DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Yerel depolamaya tema tercihini kaydet
    localStorage.setItem('theme', theme);
  }, [theme, isMounted]);
  
  // Sistem tema değişikliklerini dinle
  useEffect(() => {
    if (!isMounted) return;
    
    // Sistem teması değişikliklerini dinleyecek media query
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Sistem teması değiştiğinde çalışacak fonksiyon
    const handleSystemThemeChange = (event) => {
      const storedTheme = localStorage.getItem('theme');
      
      // System teması seçilmişse veya tema yoksa sistem temasını takip et
      if (!storedTheme || storedTheme === THEMES.SYSTEM) {
        // Dark sınıfını değiştir, ama localStorage'daki system değerini koru
        const root = window.document.documentElement;
        if (event.matches) {
          root.classList.add('dark');
          root.setAttribute('data-theme', THEMES.DARK);
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', THEMES.LIGHT);
        }
      }
    };
    
    // Media query'e dinleyici ekle
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Component unmount olduğunda dinleyiciyi kaldır
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [isMounted]);
  
  // Temayı değiştirme işlevi
  const toggleTheme = () => {
    setTheme(prevTheme => {
      // 3 tema arasında döngüsel geçiş yap
      if (prevTheme === THEMES.LIGHT) return THEMES.DARK;
      if (prevTheme === THEMES.DARK) return THEMES.SYSTEM;
      return THEMES.LIGHT;
    });
  };
  
  // Belirli bir temaya geçiş işlevi
  const changeTheme = async (newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      return { success: false, error: 'Geçersiz tema değeri' };
    }
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Kullanıcı giriş yapmışsa, Firestore'a kaydet
    if (user?.uid) {
      try {
        const result = await updateUserPreferences(user.uid, { theme: newTheme });
        return result;
      } catch (error) {
        console.error('Tema tercihi kaydedilirken hata oluştu:', error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: true };
  };
  
  // Değerleri bağlama yayınla
  const value = {
    theme,
    isDark: theme === THEMES.DARK || (theme === THEMES.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches),
    isLight: theme === THEMES.LIGHT || (theme === THEMES.SYSTEM && !window.matchMedia('(prefers-color-scheme: dark)').matches),
    isSystem: theme === THEMES.SYSTEM,
    toggleTheme,
    changeTheme,
    setTheme,
    isLoading
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Özel hook - tema bağlamına kolay erişim için
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme kullanımı ThemeProvider içinde olmalıdır');
  }
  return context;
}