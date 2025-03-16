// src/components/blog/CommentList.js
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FiEdit2, FiTrash2, FiFlag, FiThumbsUp, FiMessageSquare, FiAlertTriangle } from 'react-icons/fi';
import { getPostComments, getUsersForComments, deleteComment, canModifyComment, likeComment, reportComment, hardDeleteComment } from '../../lib/comment-helpers';
import CommentForm from './CommentForm';

// Yorum bileşeni - hem yorumları hem yanıtları gösterir
const Comment = ({ 
  comment, 
  commentUser, 
  user, 
  isAdmin, 
  onDelete, 
  onEdit, 
  onLike, 
  onReport, 
  onReply,
  isReplying,
  onCancelReply,
  formatDate,
  replies = [],
  users = {}
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div className="flex items-start">
        {/* Kullanıcı avatarı */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-4">
          {commentUser?.photoURL ? (
            <Image 
              src={commentUser.photoURL}
              alt={commentUser.displayName || 'Kullanıcı'}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {(commentUser?.displayName || 'A')?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Yorum içeriği */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {commentUser?.displayName || 'Anonim Kullanıcı'}
                {commentUser?.role === 'admin' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
                {comment.isEdited && ' (düzenlendi)'}
              </p>
            </div>
            
            {/* Yorum işlemleri */}
            {user && (
              <div className="flex space-x-2">
                {/* Düzenle butonu (sadece yazar veya admin) */}
                {canModifyComment(comment, user.uid, isAdmin) && (
                  <button 
                    onClick={() => onEdit(comment.id)}
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="Düzenle"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
                
                {/* Sil butonu (sadece yazar veya admin) */}
                {canModifyComment(comment, user.uid, isAdmin) && (
                  <button 
                    onClick={() => onDelete(comment.id)}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Sil"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
                
                {/* Tam sil butonu (sadece admin) */}
                {isAdmin && (
                  <button 
                    onClick={() => onDelete(comment.id, true)}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Kalıcı Olarak Sil"
                  >
                    <FiAlertTriangle size={16} />
                  </button>
                )}
                
                {/* Bildir butonu (giriş yapmış kullanıcılar için) */}
                {user && user.uid !== comment.userId && (
                  <button 
                    onClick={() => onReport(comment.id)}
                    className="text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
                    title="Bildir"
                  >
                    <FiFlag size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Yorum metni */}
          <div className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {comment.content}
          </div>
          
          {/* Yorum etkileşim butonları (beğen, yanıtla) */}
          <div className="mt-3 flex space-x-4 items-center">
            <button 
              onClick={() => onLike(comment.id)}
              className="flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <FiThumbsUp size={14} className={`mr-1 ${comment.liked ? 'text-blue-500 fill-current' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>
            
            {user && (
              <button 
                onClick={() => onReply(comment.id, commentUser?.displayName)}
                className="flex items-center text-sm text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
              >
                <FiMessageSquare size={14} className="mr-1" />
                <span>Yanıtla</span>
              </button>
            )}
          </div>
          
          {/* Yanıt formu */}
          {isReplying === comment.id && (
            <div className="mt-4">
              <CommentForm 
                postId={comment.postId}
                user={user}
                replyToId={comment.id}
                replyToUser={commentUser?.displayName}
                onCancelReply={onCancelReply}
                onCommentAdded={onReply}
              />
            </div>
          )}
          
          {/* Yanıtlar */}
          {replies && replies.length > 0 && (
            <div className="mt-4 ml-6 space-y-4">
              {replies.map(reply => {
                const replyUser = users[reply.userId] || {};
                
                return (
                  <div key={reply.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div className="flex items-start">
                      {/* Yanıt avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-3">
                        {replyUser.photoURL ? (
                          <Image 
                            src={replyUser.photoURL}
                            alt={replyUser.displayName || 'Kullanıcı'}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {(replyUser.displayName || 'A')?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Yanıt içeriği */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                              {replyUser.displayName || 'Anonim Kullanıcı'}
                              {replyUser.role === 'admin' && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(reply.createdAt)}
                              {reply.isEdited && ' (düzenlendi)'}
                            </p>
                          </div>
                          
                          {/* Yanıt işlemleri */}
                          {user && (
                            <div className="flex space-x-2">
                              {canModifyComment(reply, user.uid, isAdmin) && (
                                <button 
                                  onClick={() => onEdit(reply.id)}
                                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                  title="Düzenle"
                                >
                                  <FiEdit2 size={14} />
                                </button>
                              )}
                              
                              {canModifyComment(reply, user.uid, isAdmin) && (
                                <button 
                                  onClick={() => onDelete(reply.id)}
                                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                  title="Sil"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              )}
                              
                              {isAdmin && (
                                <button 
                                  onClick={() => onDelete(reply.id, true)}
                                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                  title="Kalıcı Olarak Sil"
                                >
                                  <FiAlertTriangle size={14} />
                                </button>
                              )}
                              
                              {user && user.uid !== reply.userId && (
                                <button 
                                  onClick={() => onReport(reply.id)}
                                  className="text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
                                  title="Bildir"
                                >
                                  <FiFlag size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Yanıt metni */}
                        <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {reply.content}
                        </div>
                        
                        {/* Yanıt etkileşim butonları */}
                        <div className="mt-2 flex space-x-4 items-center">
                          <button 
                            onClick={() => onLike(reply.id)}
                            className="flex items-center text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                          >
                            <FiThumbsUp size={12} className={`mr-1 ${reply.liked ? 'text-blue-500 fill-current' : ''}`} />
                            <span>{reply.likes || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CommentList({ 
  postId, 
  user, 
  isAdmin = false,
  initialComments = [],
  onCommentAdded
}) {
  const [comments, setComments] = useState(initialComments);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [localLikes, setLocalLikes] = useState({});
  
  // Yorumları getir - useCallback ile sarmala
  const fetchComments = useCallback(async () => {
    // İlk yorumlar geldiyse ve yerel yorumlar boşsa, onları kullan
    if (initialComments.length > 0 && comments.length === 0) {
      setComments(initialComments);
      
      try {
        // Kullanıcı verilerini getir
        const userData = await getUsersForComments(initialComments);
        setUsers(userData);
      } catch (error) {
        console.error('Kullanıcı verileri alınırken hata:', error);
      }
      
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
      
      // Kullanıcı verilerini getir
      if (fetchedComments.length > 0) {
        const userData = await getUsersForComments(fetchedComments);
        setUsers(userData);
      }
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
      setError('Yorumlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [postId, initialComments, comments.length]);
  
  // Bileşen yüklendiğinde yorumları getir
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Yeni yorum eklendiğinde
  const handleCommentAdded = useCallback((newComment) => {
    // Yeni yorum eklendiğinde tüm yorumları yeniden getir
    fetchComments();
    
    // Yanıtlama modunu kapat
    setReplyingToId(null);
    
    // Dışarıdan gelen callback'i çağır
    if (onCommentAdded) {
      onCommentAdded(newComment);
    }
  }, [fetchComments, onCommentAdded]);
  
  // Yorum düzenleme
  const handleEditComment = useCallback((commentId) => {
    setEditingCommentId(commentId);
  }, []);
  
  // Düzenlemeyi iptal etme
  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
  }, []);
  
  // Yorum silme
  const handleDeleteComment = useCallback(async (commentId, hardDelete = false) => {
    const confirmMessage = hardDelete 
      ? 'Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!'
      : 'Bu yorumu silmek istediğinizden emin misiniz?';
      
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      if (hardDelete && isAdmin) {
        await hardDeleteComment(commentId);
      } else {
        await deleteComment(commentId);
      }
      
      // Yorumları yeniden getir
      fetchComments();
    } catch (error) {
      console.error('Yorum silinirken hata:', error);
      alert('Yorum silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [isAdmin, fetchComments]);
  
  // Yorumu beğenme
  const handleLikeComment = useCallback(async (commentId) => {
    // Aynı yorumu tekrar beğenmeyi engelle
    if (localLikes[commentId]) return;
    
    try {
      await likeComment(commentId);
      
      // Yerel beğeni durumunu güncelle
      setLocalLikes(prev => ({ ...prev, [commentId]: true }));
      
      // Yerel yorum durumunu güncelle
      setComments(prevComments => {
        const updateComment = (comment) => {
          if (comment.id === commentId) {
            return { ...comment, likes: (comment.likes || 0) + 1, liked: true };
          }
          
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, likes: (reply.likes || 0) + 1, liked: true } 
                : reply
            );
            
            return { ...comment, replies: updatedReplies };
          }
          
          return comment;
        };
        
        return prevComments.map(updateComment);
      });
    } catch (error) {
      console.error('Yorum beğenilirken hata:', error);
    }
  }, [localLikes]);
  
  // Yorumu şikayet etme
  const handleReportComment = useCallback(async (commentId) => {
    if (!window.confirm('Bu yorumu uygunsuz içerik olarak bildirmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await reportComment(commentId);
      alert('Yorumu bildirdiğiniz için teşekkürler. Ekibimiz en kısa sürede inceleyecektir.');
    } catch (error) {
      console.error('Yorum raporlanırken hata:', error);
      alert('Yorum raporlanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, []);
  
  // Yoruma yanıt verme
  const handleReplyToComment = useCallback((commentId, userName) => {
    // Zaten bu yoruma yanıt veriyorsak, yanıtlama modunu kapat
    if (replyingToId === commentId) {
      setReplyingToId(null);
    } else {
      // Düzenleme modunu kapat ve yanıtlama modunu aç
      setEditingCommentId(null);
      setReplyingToId(commentId);
    }
  }, [replyingToId]);
  
  // Tarih formatlama
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Son 24 saat içindeyse saat göster
    if (diffDays < 1) {
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // 7 günden eskiyse tam tarih göster
    if (diffDays > 7) {
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // 1-7 gün arasındaysa gün adını göster
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Hata durumu
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }
  
  // Düzenleme veya yanıtlama sırasındaki mevcut yorumu bul
  const activeComment = editingCommentId ? 
    comments.find(c => c.id === editingCommentId) || 
    comments.flatMap(c => c.replies || []).find(r => r.id === editingCommentId) 
    : null;
  
  return (
    <div>
      {/* Düzenleme formu */}
      {editingCommentId && activeComment && (
        <CommentForm 
          postId={postId} 
          user={user} 
          editingComment={activeComment} 
          onCancelEdit={handleCancelEdit} 
          onCommentAdded={handleCommentAdded} 
        />
      )}
      
      {/* Yanıtlama formu yoksa yeni yorum formu göster */}
      {!editingCommentId && !replyingToId && (
        <CommentForm 
          postId={postId} 
          user={user} 
          onCommentAdded={handleCommentAdded} 
        />
      )}
      
      {/* Yorumlar listesi */}
      {comments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            Henüz yorum yapılmamış. İlk yorumu siz yapın!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => {
            const commentUser = users[comment.userId] || {};
            
            return (
              <Comment 
                key={comment.id}
                comment={comment}
                commentUser={commentUser}
                user={user}
                isAdmin={isAdmin}
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
                onLike={handleLikeComment}
                onReport={handleReportComment}
                onReply={handleReplyToComment}
                isReplying={replyingToId}
                onCancelReply={() => setReplyingToId(null)}
                formatDate={formatDate}
                replies={comment.replies}
                users={users}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}