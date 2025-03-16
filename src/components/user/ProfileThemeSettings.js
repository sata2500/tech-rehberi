// src/components/user/ProfileThemeSettings.js
import { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiMonitor, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../common/Notification';

export default function ProfileThemeSettings() {
  const { theme, changeTheme } = useTheme();
  const { success, error } = useNotification();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [isChanging, setIsChanging] = useState(false);

  // Theme değiştiğinde seçili temayı güncelle
  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  // Tema değiştirme işlevi
  const handleThemeChange = async (newTheme) => {
    if (newTheme === selectedTheme) return;
    
    setIsChanging(true);
    
    try {
      const result = await changeTheme(newTheme);
      
      if (result.success) {
        setSelectedTheme(newTheme);
        success('Tema tercihiniz güncellendi!');
      } else {
        throw new Error(result.error || 'Tema değiştirilemedi.');
      }
    } catch (err) {
      console.error('Tema değiştirme hatası:', err);
      error('Tema değiştirilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Tema Tercihleri
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Açık Tema */}
        <button 
          onClick={() => handleThemeChange('light')}
          disabled={isChanging}
          className={`p-4 rounded-lg border transition-colors ${
            selectedTheme === 'light' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          } flex flex-col items-center justify-center h-32`}
        >
          <div className={`p-3 rounded-full ${
            selectedTheme === 'light' 
              ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
          } mb-3`}>
            <FiSun size={24} />
          </div>
          
          <p className={`text-sm font-medium ${
            selectedTheme === 'light' 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            Açık Tema
          </p>
          
          {selectedTheme === 'light' && (
            <div className="mt-2 text-blue-600 dark:text-blue-400 flex items-center">
              <FiCheck className="mr-1" />
              <span className="text-xs">Aktif</span>
            </div>
          )}
        </button>
        
        {/* Koyu Tema */}
        <button 
          onClick={() => handleThemeChange('dark')}
          disabled={isChanging}
          className={`p-4 rounded-lg border transition-colors ${
            selectedTheme === 'dark' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          } flex flex-col items-center justify-center h-32`}
        >
          <div className={`p-3 rounded-full ${
            selectedTheme === 'dark' 
              ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
          } mb-3`}>
            <FiMoon size={24} />
          </div>
          
          <p className={`text-sm font-medium ${
            selectedTheme === 'dark' 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            Koyu Tema
          </p>
          
          {selectedTheme === 'dark' && (
            <div className="mt-2 text-blue-600 dark:text-blue-400 flex items-center">
              <FiCheck className="mr-1" />
              <span className="text-xs">Aktif</span>
            </div>
          )}
        </button>
        
        {/* Sistem Teması */}
        <button 
          onClick={() => handleThemeChange('system')}
          disabled={isChanging}
          className={`p-4 rounded-lg border transition-colors ${
            selectedTheme === 'system' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          } flex flex-col items-center justify-center h-32`}
        >
          <div className={`p-3 rounded-full ${
            selectedTheme === 'system' 
              ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
          } mb-3`}>
            <FiMonitor size={24} />
          </div>
          
          <p className={`text-sm font-medium ${
            selectedTheme === 'system' 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            Sistem
          </p>
          
          {selectedTheme === 'system' && (
            <div className="mt-2 text-blue-600 dark:text-blue-400 flex items-center">
              <FiCheck className="mr-1" />
              <span className="text-xs">Aktif</span>
            </div>
          )}
        </button>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">
          <strong>Açık Tema:</strong> Her zaman açık renk temayı kullanır.
        </p>
        <p className="mb-2">
          <strong>Koyu Tema:</strong> Her zaman koyu renk temayı kullanır.
        </p>
        <p>
          <strong>Sistem:</strong> Cihazınızın tema ayarlarına göre otomatik değişir.
        </p>
      </div>
    </div>
  );
}