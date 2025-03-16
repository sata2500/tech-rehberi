// src/components/OfflineNotification.js
import { useState, useEffect } from 'react';

/**
 * Kullanıcının çevrimdışı olduğunu bildiren ve önbelleğe alınmış içeriği gösterme olanağı sağlayan bildirim bileşeni
 */
const OfflineNotification = () => {
  // Animasyon için state
  const [isVisible, setIsVisible] = useState(false);
  // Bildirimi kapatmak için state
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // Bildirim animasyonu için zamanlayıcı
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Bildirimi kapatma fonksiyonu
  const closeNotification = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsClosed(true);
    }, 300); // Geçiş animasyonu süresi
  };

  if (isClosed) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 shadow-md z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">
            Şu anda çevrimdışısınız. Bazı içerikler önbelleğe alınmış olarak görüntüleniyor.
          </span>
        </div>
        <button
          onClick={closeNotification}
          className="text-white hover:text-gray-100 focus:outline-none"
          aria-label="Bildirimi kapat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OfflineNotification;