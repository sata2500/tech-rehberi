// src/components/blog/CommentForm.js
import { useState, useEffect } from 'react';
import { FiEdit, FiX, FiSend } from 'react-icons/fi';
import { addComment, updateComment, replyToComment } from '../../lib/comment-helpers';
import Link from 'next/link';

export default function CommentForm({ 
  postId, 
  user, 
  onCommentAdded, 
  editingComment = null, 
  onCancelEdit = null,
  replyToId = null,
  replyToUser = null,
  onCancelReply = null
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Düzenlenecek yorum varsa, içeriğini forma doldur
  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content);
    } else {
      setContent(replyToUser ? `@${replyToUser} ` : '');
    }
  }, [editingComment, replyToUser]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Lütfen bir yorum yazın.');
      return;
    }
    
    if (!user) {
      setError('Yorum yapabilmek için giriş yapmalısınız.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingComment) {
        // Mevcut yorumu güncelle
        await updateComment(editingComment.id, content);
        if (onCancelEdit) onCancelEdit();
        if (onCommentAdded) onCommentAdded();
      } else if (replyToId) {
        // Yanıt ekle
        const newReply = await replyToComment(postId, replyToId, user.uid, content);
        if (onCancelReply) onCancelReply();
        if (onCommentAdded) onCommentAdded(newReply);
        setContent('');
      } else {
        // Yeni yorum ekle
        const newComment = await addComment(postId, user.uid, content);
        if (onCommentAdded) onCommentAdded(newComment);
        setContent('');
      }
    } catch (error) {
      console.error('Yorum gönderilirken hata:', error);
      setError('Yorum gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Kullanıcı giriş yapmamışsa, sadece giriş formu göster (düzenleme/yanıtlama modu değilse)
  if (!user && !editingComment && !replyToId) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center mb-8">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Yorum yapmak için giriş yapmalısınız.
        </p>
        <Link 
          href="/giris" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-8 ${
      (editingComment || replyToId) ? 'border border-blue-300 dark:border-blue-700' : ''
    }`}>
      <form onSubmit={handleSubmit}>
        {/* Düzenleme başlığı */}
        {editingComment && (
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Yorumu Düzenle
            </h4>
            <button 
              type="button"
              onClick={onCancelEdit}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Düzenlemeyi İptal Et"
            >
              <FiX size={20} />
            </button>
          </div>
        )}
        
        {/* Yanıtlama başlığı */}
        {replyToId && !editingComment && (
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              {replyToUser ? `${replyToUser} kullanıcısına yanıt ver` : 'Yoruma Yanıt Ver'}
            </h4>
            <button 
              type="button"
              onClick={onCancelReply}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Yanıtlamayı İptal Et"
            >
              <FiX size={20} />
            </button>
          </div>
        )}
        
        {/* Yorum metin alanı */}
        <textarea 
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          placeholder={replyToId ? "Yanıtınızı yazın..." : "Yorumunuzu yazın..."}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          required
        ></textarea>
        
        {/* Hata mesajı */}
        {error && (
          <div className="text-red-500 dark:text-red-400 text-sm mb-3">
            {error}
          </div>
        )}
        
        {/* Form alt bölümü */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            * Yorumunuz incelendikten sonra yayınlanacaktır.
          </span>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Gönderiliyor</span>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : (
              <>
                <FiSend className="mr-2" />
                {editingComment ? 'Güncelle' : replyToId ? 'Yanıtla' : 'Gönder'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}