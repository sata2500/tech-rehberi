// src/components/user/UserComments.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiMessageSquare, 
  FiCalendar, 
  FiTrash2, 
  FiEdit2, 
  FiExternalLink,
  FiAlertCircle,
  FiCheck,
  FiFilter
} from 'react-icons/fi';
import { getUserComments } from '../../lib/user-helpers';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function UserComments({ user }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedCommentId, setExpandedCommentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Yorumları yükle
  useEffect(() => {
    const loadComments = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUserComments(user.uid, {
          sortBy,
          sortDirection
        });
        
        if (result.success) {
          setComments(result.comments);
        } else {
          setError(result.error);
        }
      } catch (error) {
        console.error('Yorumlar yüklenirken hata oluştu:', error);
        setError('Yorumlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadComments();
  }, [user, sortBy, sortDirection]);
  
  // Tarih formatı
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Yorumu sil
  const handleDeleteComment = async (commentId) => {
    if (!user?.uid || isDeleting) return;
    
    if (!window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      setSuccessMessage('Yorum başarıyla silindi.');
      
      // 3 saniye sonra başarı mesajını kaldır
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Yorum silinirken hata oluştu:', error);
      setError('Yorum silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      
      // 3 saniye sonra hata mesajını kaldır
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Genişletilmiş yorumu göster/gizle
  const toggleExpandComment = (commentId) => {
    setExpandedCommentId(expandedCommentId === commentId ? null : commentId);
  };
  
  // Sıralama değiştirme
  const handleSortChange = (e) => {
    const value = e.target.value;
    
    if (value === 'oldest') {
      setSortBy('createdAt');
      setSortDirection('asc');
    } else if (value === 'newest') {
      setSortBy('createdAt');
      setSortDirection('desc');
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <FiMessageSquare />
          <span className="ml-2">Yorumlarım</span>
        </h3>
        
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FiMessageSquare />
            <span className="ml-2">Yorumlarım</span>
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({comments.length})
            </span>
          </h3>
          
          <div className="flex items-center">
            <label htmlFor="sortComments" className="mr-2 text-sm text-gray-600">
              <FiFilter className="inline mr-1" />
              Sırala:
            </label>
            <select
              id="sortComments"
              value={sortDirection === 'desc' ? 'newest' : 'oldest'}
              onChange={handleSortChange}
              className="text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1.5"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 flex items-start">
            <FiAlertCircle className="flex-shrink-0 mr-2 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-start">
            <FiCheck className="flex-shrink-0 mr-2 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}
        
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FiMessageSquare size={36} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 mb-4">Henüz hiç yorum yapmadınız.</p>
            <Link 
              href="/blog"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Yazıları Keşfedin
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      <Link href={`/blog/${comment.postSlug}`} className="hover:text-blue-700">
                        {comment.postTitle || 'Bilinmeyen Yazı'}
                      </Link>
                    </h4>
                    
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <span className="flex items-center mr-3">
                        <FiCalendar className="mr-1" />
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/blog/${comment.postSlug}#comment-${comment.id}`}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Yorumu Görüntüle"
                    >
                      <FiExternalLink size={18} />
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Yorumu Sil"
                      disabled={isDeleting}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div 
                  className={`text-gray-700 ${
                    expandedCommentId === comment.id ? '' : 'line-clamp-2'
                  }`}
                >
                  {comment.content}
                </div>
                
                {comment.content && comment.content.length > 150 && (
                  <button
                    onClick={() => toggleExpandComment(comment.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                  >
                    {expandedCommentId === comment.id ? 'Daha az göster' : 'Devamını göster'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}