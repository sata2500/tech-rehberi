// src/components/blog/ShareButtons.js
import { useState, useEffect } from 'react';
import { 
  FiTwitter, FiLinkedin, FiFacebook, 
  FiMail, FiMessageSquare, FiLink, FiShare2
} from 'react-icons/fi';
import { MdContentCopy, MdCheck } from 'react-icons/md';

/**
 * Sosyal medya paylaşım butonları bileşeni
 * 
 * @param {Object} props
 * @param {string} props.url - Paylaşılacak URL
 * @param {string} props.title - Paylaşım başlığı
 * @param {string} props.description - Paylaşım açıklaması
 * @param {string} props.image - Paylaşım görseli URL'i
 * @param {string} props.via - Twitter için kaynak (@ işareti olmadan)
 * @param {string} props.hashtags - Twitter için hashtagler (virgülle ayrılmış)
 * @param {boolean} props.compact - Kompakt görünüm (sadece ikonlar)
 * @param {boolean} props.vertical - Dikey yerleşim
 * @param {string} props.className - Ek CSS sınıfları
 * @param {Function} props.onShare - Paylaşım gerçekleştiğinde çalışacak callback
 */
export default function ShareButtons({
  url,
  title = '',
  description = '',
  image = '',
  via = 'techrehberi',
  hashtags = '',
  compact = false,
  vertical = false,
  className = '',
  onShare
}) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareStats, setShareStats] = useState({
    total: 0,
    platforms: {}
  });

  // Component yüklendiğinde URL'i ayarla
  useEffect(() => {
    // SSR durumunda window olmayabilir
    if (typeof window !== 'undefined') {
      setShareUrl(url || window.location.href);
    }
  }, [url]);

  // Kopyalama durumunu sıfırla
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Paylaşım istatistiklerini güncelle (demo)
  const trackShare = (platform) => {
    setShareStats(prev => ({
      total: prev.total + 1,
      platforms: {
        ...prev.platforms,
        [platform]: (prev.platforms[platform] || 0) + 1
      }
    }));
    
    // Onshare callback'i varsa çalıştır
    if (onShare && typeof onShare === 'function') {
      onShare(platform);
    }
  };

  // URL'i panoya kopyala
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare('copy');
    } catch (err) {
      console.error('URL kopyalanırken hata oluştu:', err);
      // Fallback kopyalama yöntemi
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      trackShare('copy');
    }
  };

  // Sosyal medya paylaşım linkleri oluştur
  const getShareLink = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    const encodedHashtags = encodeURIComponent(hashtags);
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${via}${hashtags ? `&hashtags=${encodedHashtags}` : ''}`;
      
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`;
      
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
      
      default:
        return shareUrl;
    }
  };

  // Paylaşım fonksiyonu
  const share = (platform) => {
    const shareLink = getShareLink(platform);
    trackShare(platform);
    
    // Navigator Share API desteği varsa kullan (mobil cihazlar)
    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: shareUrl,
      }).catch(err => console.error('Paylaşım sırasında hata:', err));
      return;
    }
    
    // Email dışındaki platformlar için yeni pencerede aç
    if (platform !== 'email') {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = shareLink;
    }
  };

  // Paylaşım butonları için ortak stil sınıfları
  const buttonBaseClass = `flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`;
  
  const buttonClass = compact 
    ? `${buttonBaseClass} w-9 h-9 rounded-full` 
    : `${buttonBaseClass} px-3 py-2 rounded-md`;

  // Ana container için stil sınıfları
  const containerClass = `flex ${vertical ? 'flex-col space-y-2' : 'flex-wrap items-center space-x-2'} ${className}`;

  return (
    <div className={containerClass} aria-label="İçeriği paylaş">
      {/* Native Share API (mobil cihazlar için) */}
      {navigator && navigator.share && (
        <button
          type="button"
          onClick={() => share('native')}
          className={`${buttonClass} bg-gray-700 hover:bg-gray-600 text-white`}
          aria-label="Paylaş"
        >
          <FiShare2 size={compact ? 18 : 16} />
          {!compact && <span className="ml-2">Paylaş</span>}
        </button>
      )}
      
      {/* Twitter */}
      <button
        type="button"
        onClick={() => share('twitter')}
        className={`${buttonClass} bg-[#1DA1F2] hover:bg-[#1a94e0] text-white`}
        aria-label="Twitter'da paylaş"
      >
        <FiTwitter size={compact ? 18 : 16} />
        {!compact && <span className="ml-2">Twitter</span>}
      </button>
      
      {/* Facebook */}
      <button
        type="button"
        onClick={() => share('facebook')}
        className={`${buttonClass} bg-[#1877F2] hover:bg-[#166fe5] text-white`}
        aria-label="Facebook'ta paylaş"
      >
        <FiFacebook size={compact ? 18 : 16} />
        {!compact && <span className="ml-2">Facebook</span>}
      </button>
      
      {/* LinkedIn */}
      <button
        type="button"
        onClick={() => share('linkedin')}
        className={`${buttonClass} bg-[#0077b5] hover:bg-[#006aa3] text-white`}
        aria-label="LinkedIn'de paylaş"
      >
        <FiLinkedin size={compact ? 18 : 16} />
        {!compact && <span className="ml-2">LinkedIn</span>}
      </button>
      
      {/* WhatsApp */}
      <button
        type="button"
        onClick={() => share('whatsapp')}
        className={`${buttonClass} bg-[#25D366] hover:bg-[#22c15e] text-white`}
        aria-label="WhatsApp'ta paylaş"
      >
        <FiMessageSquare size={compact ? 18 : 16} />
        {!compact && <span className="ml-2">WhatsApp</span>}
      </button>
      
      {/* Email */}
      <button
        type="button"
        onClick={() => share('email')}
        className={`${buttonClass} bg-gray-600 hover:bg-gray-500 text-white`}
        aria-label="Email ile paylaş"
      >
        <FiMail size={compact ? 18 : 16} />
        {!compact && <span className="ml-2">Email</span>}
      </button>
      
      {/* URL Kopyala */}
      <button
        type="button"
        onClick={copyToClipboard}
        className={`${buttonClass} ${copied ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
        aria-label="Link kopyala"
      >
        {copied ? (
          <>
            <MdCheck size={compact ? 18 : 16} />
            {!compact && <span className="ml-2">Kopyalandı</span>}
          </>
        ) : (
          <>
            <FiLink size={compact ? 18 : 16} />
            {!compact && <span className="ml-2">Kopyala</span>}
          </>
        )}
      </button>
      
      {/* Paylaşım istatistikleri (opsiyonel) */}
      {shareStats.total > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Bu içerik {shareStats.total} kez paylaşıldı
        </div>
      )}
    </div>
  );
}