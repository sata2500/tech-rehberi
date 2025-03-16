// src/components/blog/PostInteractions.js
import { useState, useEffect } from 'react';
import { FiBookmark, FiThumbsUp, FiShare2, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/Notification';
import { getUserProfile, saveUserInteraction, removeUserInteraction } from '../../lib/user-helpers';

export default function PostInteractions({ postId, postTitle, commentCount = 0, onCommentClick }) {
  const { user } = useAuth();
  const { success, error, info } = useNotification();
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Kullanıcı etkileşimlerini ve yazı istatistiklerini yükle
  useEffect(() => {
    const loadInteractions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Kullanıcı bilgilerini al
        const { success, profile } = await getUserProfile(user.uid);
        
        if (success && profile) {
          // Kullanıcının etkileşimlerini kontrol et
          setIsBookmarked(profile.bookmarkedPosts?.includes(postId) || false);
          setIsLiked(profile.likedPosts?.includes(postId) || false);
        }
        
        // Yazı istatistiklerini Firebase'den al (burada gerçek verileri alacak kod olacak)
        // Şimdilik dummy değerler kullanıyoruz
        setBookmarkCount(Math.floor(Math.random() * 50));
        setLikeCount(Math.floor(Math.random() * 100));
        
      } catch (err) {
        console.error('Etkileşimler yüklenirken hata:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInteractions();
  }, [user, postId]);
  
  // Kaydetme işlemi
  const handleBookmark = async () => {
    if (!user) {
      info('Yazıyı kaydetmek için giriş yapmalısınız.');
      return;
    }
    
    try {
      if (isBookmarked) {
        // Kaydı kaldır
        const result = await removeUserInteraction(user.uid, postId, 'bookmark');
        
        if (result.success) {
          setIsBookmarked(false);
          setBookmarkCount(prev => Math.max(0, prev - 1));
          success('Yazı kaydedilenlerden kaldırıldı.');
        } else {
          throw new Error(result.error);
        }
      } else {
        // Kaydet
        const result = await saveUserInteraction(user.uid, postId, 'bookmark');
        
        if (result.success) {
          setIsBookmarked(true);
          setBookmarkCount(prev => prev + 1);
          success('Yazı kaydedildi.');
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('Kaydetme işlemi sırasında hata:', err);
      error('İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };
  
  // Beğenme işlemi
  const handleLike = async () => {
    if (!user) {
      info('Yazıyı beğenmek için giriş yapmalısınız.');
      return;
    }
    
    try {
      if (isLiked) {
        // Beğeniyi kaldır
        const result = await removeUserInteraction(user.uid, postId, 'like');
        
        if (result.success) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
          success('Beğeni kaldırıldı.');
        } else {
          throw new Error(result.error);
        }
      } else {
        // Beğen
        const result = await saveUserInteraction(user.uid, postId, 'like');
        
        if (result.success) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
          success('Yazı beğenildi.');
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('Beğenme işlemi sırasında hata:', err);
      error('İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };
  
  // Paylaşma işlemi
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        url: window.location.href
      })
        .then(() => success('Yazı paylaşıldı!'))
        .catch((err) => {
          console.error('Paylaşım hatası:', err);
          if (err.name !== 'AbortError') {
            error('Paylaşım sırasında bir hata oluştu.');
          }
        });
    } else {
      // Tarayıcı paylaşım API'sini desteklemiyorsa
      const url = window.location.href;
      navigator.clipboard.writeText(url)
        .then(() => success('Bağlantı panoya kopyalandı!'))
        .catch(() => error('Bağlantı kopyalanamadı.'));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4 space-x-8 animate-pulse">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full mb-1"></div>
            <div className="w-10 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center py-4 border-t border-b border-gray-200 dark:border-gray-700 my-6 space-x-8 md:space-x-12">
      {/* Beğeni Butonu */}
      <button 
        onClick={handleLike}
        className="flex flex-col items-center group"
        aria-label={isLiked ? 'Beğeniyi kaldır' : 'Beğen'}
      >
        <div className={`p-2 rounded-full ${
          isLiked 
            ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900' 
            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
        } transition-colors`}>
          <FiThumbsUp size={20} className={isLiked ? 'fill-current' : ''} />
        </div>
        <span className={`text-xs mt-1 ${
          isLiked 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {likeCount}
        </span>
      </button>
      
      {/* Yorum Butonu */}
      <button 
        onClick={onCommentClick}
        className="flex flex-col items-center group"
        aria-label="Yorumlar"
      >
        <div className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">
          <FiMessageSquare size={20} />
        </div>
        <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          {commentCount}
        </span>
      </button>
      
      {/* Kaydetme Butonu */}
      <button 
        onClick={handleBookmark}
        className="flex flex-col items-center group"
        aria-label={isBookmarked ? 'Kayıttan kaldır' : 'Kaydet'}
      >
        <div className={`p-2 rounded-full ${
          isBookmarked 
            ? 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900' 
            : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/50'
        } transition-colors`}>
          <FiBookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
        </div>
        <span className={`text-xs mt-1 ${
          isBookmarked 
            ? 'text-purple-600 dark:text-purple-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {bookmarkCount}
        </span>
      </button>
      
      {/* Paylaşma Butonu */}
      <button 
        onClick={handleShare}
        className="flex flex-col items-center group"
        aria-label="Paylaş"
      >
        <div className="p-2 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/50 transition-colors">
          <FiShare2 size={20} />
        </div>
        <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          Paylaş
        </span>
      </button>
    </div>
  );
}