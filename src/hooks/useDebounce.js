// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Debounce hook - belirli bir değer değişikliklerini geciktirmek için
 * 
 * @param {any} value - Debounce edilecek değer
 * @param {number} delay - Gecikme süresi (ms cinsinden)
 * @returns {any} - Debounce edilmiş değer
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Belirtilen gecikmeden sonra değeri ayarla
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // useEffect her yeniden çağrıldığında cleanup fonksiyonu çalışır
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;