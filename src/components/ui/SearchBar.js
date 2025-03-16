// src/components/ui/SearchBar.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiX } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';

/**
 * Yeniden kullanılabilir arama çubuğu bileşeni
 * 
 * @param {function} onSearch - Arama yapıldığında çağrılacak fonksiyon
 * @param {string} placeholder - Placeholder metni
 * @param {string} className - Ek CSS sınıfları
 * @param {string} initialValue - Başlangıç değeri
 * @param {boolean} showButton - Arama butonu gösterilsin mi
 * @param {boolean} autoSubmit - Yazarken otomatik arama yapsın mı
 * @param {boolean} saveHistory - Arama geçmişi kaydedilsin mi
 */
const SearchBar = ({ 
  onSearch, 
  placeholder = "Ara...", 
  className = "", 
  initialValue = "", 
  showButton = true, 
  autoSubmit = false, 
  saveHistory = false 
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Aramayı geçmişe kaydet - temel fonksiyon
  const saveToHistoryFn = useCallback((term) => {
    if (!saveHistory || !term.trim()) return;
    
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      // Eğer zaten varsa en başa taşı, yoksa ekle
      const newHistory = [
        term,
        ...history.filter(item => item !== term)
      ].slice(0, 10); // Son 10 aramayı sakla
      
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Arama geçmişi kaydedilirken hata oluştu:', error);
    }
  }, [saveHistory]);

  // Arama gönderimini işle
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Arama terimini geçmişe kaydet
    saveToHistoryFn(searchTerm.trim());
    
    // Eğer onSearch callback'i verilmişse çağır
    if (onSearch) {
      onSearch(searchTerm.trim());
    } else {
      // Yoksa arama sayfasına yönlendir
      router.push(`/arama?q=${encodeURIComponent(searchTerm.trim())}`);
    }
    
    // Önerileri kapat
    setShowSuggestions(false);
  }, [searchTerm, onSearch, router, saveToHistoryFn]);

  // Arama terimini temizle
  const handleClear = useCallback(() => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (autoSubmit && onSearch) {
      onSearch('');
    }
  }, [autoSubmit, onSearch]);

  // Öneri tıklamasını işle
  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      router.push(`/arama?q=${encodeURIComponent(suggestion)}`);
    }
  }, [onSearch, router]);

  // Local storage'dan arama geçmişini yükle
  useEffect(() => {
    if (saveHistory) {
      try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSuggestions(history.slice(0, 5)); // Son 5 aramayı göster
      } catch (error) {
        console.error('Arama geçmişi yüklenirken hata oluştu:', error);
        setSuggestions([]);
      }
    }
  }, [saveHistory]);

  // Debounce edilen arama terimi değiştiğinde, otomatik arama yap
  useEffect(() => {
    if (autoSubmit && debouncedSearchTerm.trim().length >= 2) {
      handleSubmit({ preventDefault: () => {} });
    }
  }, [debouncedSearchTerm, autoSubmit, handleSubmit]);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-500" />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              className="block w-full p-3 pl-10 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (saveHistory && e.target.value.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onFocus={() => {
                if (saveHistory && searchTerm.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Önerilere tıklamaya izin vermek için gecikmeli gizleme
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-0 bottom-0 flex items-center px-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white"
                aria-label="Temizle"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
          {showButton && (
            <button
              type="submit"
              className="p-3 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-500"
            >
              Ara
            </button>
          )}
        </div>
      </form>

      {/* Öneri dropdown'ı */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <FiSearch className="text-gray-400 mr-2" size={14} />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;