// src/components/blog/ShareTools.js
import { useState, useEffect } from 'react';
import ShareButtons from './ShareButtons';
import { FiShare2 } from 'react-icons/fi';

/**
 * Paylaşım butonları için çeşitli görünüm ve pozisyonlama seçenekleri sunan wrapper bileşen
 * 
 * @param {Object} props
 * @param {string} props.url - Paylaşılacak URL
 * @param {string} props.title - Paylaşım başlığı
 * @param {string} props.description - Paylaşım açıklaması
 * @param {string} props.image - Paylaşım görseli URL'i
 * @param {string} props.via - Twitter için kaynak (@ işareti olmadan)
 * @param {string} props.hashtags - Twitter için hashtagler (virgülle ayrılmış)
 * @param {string} props.position - Görünüm pozisyonu ('top', 'bottom', 'floating', 'sidebar')
 * @param {string} props.className - Ek CSS sınıfları
 */
export default function ShareTools({
  url,
  title,
  description,
  image,
  via = 'techrehberi',
  hashtags = '',
  position = 'top',
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(position !== 'floating');
  const [showFloating, setShowFloating] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);

  // Scroll pozisyonunu izle (floating paylaşım için)
  useEffect(() => {
    if (position === 'floating') {
      const handleScroll = () => {
        const currentPos = window.scrollY;
        setScrollPos(currentPos);
        
        // Sayfanın %20'si kaydırıldığında görünür hale getir
        const pageHeight = document.body.scrollHeight;
        const viewportHeight = window.innerHeight;
        const threshold = Math.min(viewportHeight * 0.2, 200);
        
        setShowFloating(currentPos > threshold);
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [position]);

  // Pozisyona göre container stilleri
  const getContainerStyles = () => {
    switch(position) {
      case 'floating':
        return `fixed ${showFloating ? 'left-4 sm:left-6 opacity-100' : '-left-20 opacity-0'} transition-all duration-300 top-1/3 z-40`;
      
      case 'sidebar':
        return 'hidden lg:flex flex-col sticky top-32 left-0 space-y-2 mr-4';
      
      case 'bottom':
        return 'mt-8 pt-4 border-t border-gray-200 dark:border-gray-700';
      
      case 'top':
      default:
        return 'mb-6';
    }
  };

  // Paylaşım sayılarını izleme (opsiyonel)
  const handleShare = (platform) => {
    console.log(`İçerik ${platform} üzerinden paylaşıldı`);
    // Burada paylaşım istatistiklerini server'a gönderebilirsiniz
  };

  // Pozisyona göre farklı görünüm
  if (position === 'floating' && !showFloating) {
    return null;
  }

  return (
    <div className={`share-tools ${getContainerStyles()} ${className}`}>
      {position === 'floating' && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2">
          {isExpanded ? (
            <ShareButtons
              url={url}
              title={title}
              description={description}
              image={image}
              via={via}
              hashtags={hashtags}
              compact={true}
              vertical={true}
              onShare={handleShare}
            />
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              aria-label="Paylaşım seçeneklerini göster"
            >
              <FiShare2 size={20} />
            </button>
          )}
        </div>
      )}
      
      {position !== 'floating' && (
        <div className="w-full">
          {/* Paylaşım başlığı - sadece top ve bottom pozisyonlarında */}
          {(position === 'top' || position === 'bottom') && (
            <div className="flex items-center mb-3">
              <FiShare2 className="mr-2 text-blue-600 dark:text-blue-400" size={18} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bu içeriği paylaş</h3>
            </div>
          )}
          
          <ShareButtons
            url={url}
            title={title}
            description={description}
            image={image}
            via={via}
            hashtags={hashtags}
            compact={position === 'sidebar'}
            vertical={position === 'sidebar'}
            onShare={handleShare}
          />
        </div>
      )}
    </div>
  );
}