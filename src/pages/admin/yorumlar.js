// src/pages/admin/yorumlar.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  collection, query, where, orderBy, limit, 
  getDocs, doc, getDoc, updateDoc, deleteDoc, startAfter 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { 
  FiEdit2, FiTrash2, FiEye, FiAlertCircle, 
  FiCheckCircle, FiFlag, FiMessageCircle 
} from 'react-icons/fi';

export default function CommentsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, reported, deleted
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const COMMENTS_PER_PAGE = 20;

  // Admin değilse ana sayfaya yönlendir
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Yorumları getir - useCallback ile sarmala
  const fetchComments = useCallback(async (filterType = filter, clearPrevious = true) => {
    if (authLoading) return;
    
    setLoading(true);
    
    try {
      let commentsQuery;
      
      // Filtre tipine göre sorgu oluştur
      if (filterType === 'reported') {
        commentsQuery = query(
          collection(db, 'comments'),
          where('reportCount', '>', 0),
          orderBy('reportCount', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(COMMENTS_PER_PAGE)
        );
      } else if (filterType === 'deleted') {
        commentsQuery = query(
          collection(db, 'comments'),
          where('isDeleted', '==', true),
          orderBy('createdAt', 'desc'),
          limit(COMMENTS_PER_PAGE)
        );
      } else {
        // Tüm yorumlar
        commentsQuery = query(
          collection(db, 'comments'),
          orderBy('createdAt', 'desc'),
          limit(COMMENTS_PER_PAGE)
        );
      }
      
      // Sayfalama için son görülen belgeyi ekle
      if (!clearPrevious && lastVisible) {
        commentsQuery = query(
          commentsQuery,
          startAfter(lastVisible)
        );
      }
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      if (commentsSnapshot.empty) {
        setHasMore(false);
        if (clearPrevious) {
          setComments([]);
        }
        setLoading(false);
        return;
      }
      
      // Son görünen belgeyi kaydet
      setLastVisible(commentsSnapshot.docs[commentsSnapshot.docs.length - 1]);
      
      // Yorumları dönüştür
      const commentsData = commentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null
        };
      });
      
      // Yeni yorumları ekle veya tüm yorumları değiştir
      if (clearPrevious) {
        setComments(commentsData);
      } else {
        setComments(prev => [...prev, ...commentsData]);
      }
      
      // Benzersiz kullanıcı ve yazı ID'lerini topla
      const userIds = new Set();
      const postIds = new Set();
      
      commentsData.forEach(comment => {
        userIds.add(comment.userId);
        postIds.add(comment.postId);
      });
      
      // Kullanıcı verilerini getir
      const usersData = { ...users };
      for (const userId of userIds) {
        if (!usersData[userId]) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            usersData[userId] = {
              id: userId,
              ...userDoc.data()
            };
          }
        }
      }
      setUsers(usersData);
      
      // Yazı verilerini getir
      const postsData = { ...posts };
      for (const postId of postIds) {
        if (!postsData[postId]) {
          const postDoc = await getDoc(doc(db, 'posts', postId));
          if (postDoc.exists()) {
            postsData[postId] = {
              id: postId,
              ...postDoc.data()
            };
          }
        }
      }
      setPosts(postsData);
      
      setHasMore(commentsSnapshot.docs.length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, filter, lastVisible, posts, users, COMMENTS_PER_PAGE]);

  // Filtre değiştiğinde yorumları yeniden getir
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchComments(filter, true);
      setLastVisible(null);
    }
  }, [filter, user, fetchComments]);

  // Daha fazla yorum getir
  const loadMoreComments = useCallback(() => {
    if (!loading && hasMore) {
      fetchComments(filter, false);
    }
  }, [loading, hasMore, fetchComments, filter]);

  // Yorumu geri yükle
  const restoreComment = useCallback(async (commentId) => {
    if (!window.confirm('Bu yorumu geri yüklemek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        isDeleted: false,
        content: comments.find(c => c.id === commentId)?.content || '',
        updatedAt: new Date()
      });
      
      // Yorumları güncelle
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, isDeleted: false } 
          : comment
      ));
      
      alert('Yorum başarıyla geri yüklendi.');
    } catch (error) {
      console.error('Yorum geri yüklenirken hata:', error);
      alert('Yorum geri yüklenirken bir hata oluştu.');
    }
  }, [comments]);

  // Yorumu kalıcı olarak sil
  const permanentlyDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm('Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }
    
    try {
      // Önce yanıtları kontrol et
      const repliesQuery = query(
        collection(db, 'comments'),
        where('parentId', '==', commentId)
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      
      if (!repliesSnapshot.empty) {
        if (!window.confirm(`Bu yoruma ait ${repliesSnapshot.size} yanıt var. Tüm yanıtlarla birlikte silmek istediğinizden emin misiniz?`)) {
          return;
        }
        
        // Yanıtları sil
        const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
      
      // Ana yorumu sil
      await deleteDoc(doc(db, 'comments', commentId));
      
      // Yerel durumu güncelle
      setComments(comments.filter(comment => comment.id !== commentId));
      
      alert('Yorum kalıcı olarak silindi.');
    } catch (error) {
      console.error('Yorum kalıcı olarak silinirken hata:', error);
      alert('Yorum silinirken bir hata oluştu.');
    }
  }, [comments]);

  // Raporları temizle
  const clearReports = useCallback(async (commentId) => {
    if (!window.confirm('Bu yoruma ait tüm raporları temizlemek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        reportCount: 0
      });
      
      // Yorumları güncelle
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, reportCount: 0 } 
          : comment
      ));
      
      alert('Raporlar başarıyla temizlendi.');
    } catch (error) {
      console.error('Raporlar temizlenirken hata:', error);
      alert('Raporlar temizlenirken bir hata oluştu.');
    }
  }, [comments]);

  // Tarih formatlama
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Yükleniyor durumu
  if (authLoading || (loading && comments.length === 0)) {
    return (
      <AdminLayout title="Yorumlar">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Yorumlar Yönetimi">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Yorumlar Yönetimi
          </h1>
          
          {/* Filtreler */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-md ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('reported')}
              className={`px-3 py-2 rounded-md flex items-center ${
                filter === 'reported'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiFlag className="mr-1" />
              Raporlananlar
            </button>
            <button
              onClick={() => setFilter('deleted')}
              className={`px-3 py-2 rounded-md flex items-center ${
                filter === 'deleted'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiTrash2 className="mr-1" />
              Silinenler
            </button>
          </div>
        </div>
        
        {/* Yorumlar tablosu */}
        {comments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-200">Yazar</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-200">İçerik</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-200">Yazı</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-200">Tarih</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-200">Durum</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-600 dark:text-gray-200">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comments.map(comment => {
                  const user = users[comment.userId] || {};
                  const post = posts[comment.postId] || {};
                  
                  return (
                    <tr key={comment.id} className={
                      comment.isDeleted 
                        ? 'bg-red-50 dark:bg-red-900/20' 
                        : comment.reportCount > 0 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                          : ''
                    }>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {user.displayName || 'Bilinmeyen Kullanıcı'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs overflow-hidden">
                          <p className={`text-sm ${
                            comment.isDeleted 
                              ? 'text-red-600 dark:text-red-400 italic' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {comment.content}
                          </p>
                          {comment.parentId && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              <FiMessageCircle className="inline mr-1" />
                              Yanıt
                            </p>
                          )}
                          {comment.reportCount > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              <FiFlag className="inline mr-1" />
                              {comment.reportCount} rapor
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {post ? (
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {post.title || 'Yazı bulunamadı'}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Yazı bulunamadı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(comment.createdAt)}
                        </p>
                        {comment.isEdited && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Düzenlenmiş
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {comment.isDeleted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <FiTrash2 className="mr-1" />
                            Silindi
                          </span>
                        ) : comment.reportCount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <FiAlertCircle className="mr-1" />
                            Raporlandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <FiCheckCircle className="mr-1" />
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <Link
                            href={`/blog/${post?.slug || ''}#yorumlar`}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Görüntüle"
                          >
                            <FiEye size={18} />
                          </Link>
                          
                          {comment.isDeleted ? (
                            <button
                              onClick={() => restoreComment(comment.id)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Geri Yükle"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          ) : (
                            <>
                              {comment.reportCount > 0 && (
                                <button
                                  onClick={() => clearReports(comment.id)}
                                  className="p-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                  title="Raporları Temizle"
                                >
                                  <FiFlag size={18} />
                                </button>
                              )}
                            </>
                          )}
                          
                          <button
                            onClick={() => permanentlyDeleteComment(comment.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Kalıcı Olarak Sil"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' 
                ? 'Henüz yorum yok.' 
                : filter === 'reported' 
                  ? 'Raporlanan yorum yok.' 
                  : 'Silinen yorum yok.'}
            </p>
          </div>
        )}
        
        {/* Daha fazla yükle butonu */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreComments}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}