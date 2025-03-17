// src/components/admin/CommentManagement.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  updateDoc, 
  where,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FiMessageCircle,
  FiCheck, 
  FiX, 
  FiTrash2, 
  FiEye, 
  FiFilter,
  FiSearch,
  FiAlertTriangle,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import Link from 'next/link';

export default function CommentManagement() {
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [postFilter, setPostFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const [selectedComments, setSelectedComments] = useState([]);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  
  const COMMENTS_PER_PAGE = 10;

  // Yorumları getir
  useEffect(() => {
    let unsubscribeListener = null;
    
    const fetchComments = async () => {
      try {
        setLoading(true);
        
        const commentsQuery = query(
          collection(db, 'comments'),
          orderBy('createdAt', 'desc'),
          limit(COMMENTS_PER_PAGE)
        );
        
        unsubscribeListener = onSnapshot(commentsQuery, (snapshot) => {
          if (snapshot.empty) {
            setComments([]);
            setFilteredComments([]);
            setHasMore(false);
            setLoading(false);
            return;
          }
          
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setComments(commentsData);
          setFilteredComments(commentsData);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === COMMENTS_PER_PAGE);
          setLoading(false);
        });
      } catch (error) {
        console.error('Yorumlar alınırken hata oluştu:', error);
        setLoading(false);
      }
    };
    
    fetchComments();
    
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, []);

  // Blog yazılarını getir
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('title')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPosts(postsData);
      } catch (error) {
        console.error('Blog yazıları alınırken hata oluştu:', error);
      }
    };
    
    fetchPosts();
  }, []);

  // Filtreleme
  useEffect(() => {
    if (statusFilter === 'all' && postFilter === 'all' && searchTerm === '' && dateFilter === 'all') {
      setFilteredComments(comments);
      return;
    }
    
    let filtered = comments;
    
    if (statusFilter !== 'all') {
      const isApproved = statusFilter === 'approved';
      filtered = filtered.filter(comment => comment.approved === isApproved);
    }
    
    if (postFilter !== 'all') {
      filtered = filtered.filter(comment => comment.postId === postFilter);
    }
    
    if (searchTerm !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(comment => 
        (comment.content && comment.content.toLowerCase().includes(term)) || 
        (comment.authorName && comment.authorName.toLowerCase().includes(term)) ||
        (comment.authorEmail && comment.authorEmail.toLowerCase().includes(term))
      );
    }
    
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch(dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(comment => 
          comment.createdAt && comment.createdAt.toDate() >= startDate
        );
      }
    }
    
    setFilteredComments(filtered);
  }, [statusFilter, postFilter, searchTerm, dateFilter, comments]);

  // Daha fazla yorum yükle
  const loadMoreComments = async () => {
    if (!hasMore || !lastVisible) return;
    
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(COMMENTS_PER_PAGE)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      if (commentsSnapshot.empty) {
        setHasMore(false);
        return;
      }
      
      const newCommentsData = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setComments(prevComments => [...prevComments, ...newCommentsData]);
      setLastVisible(commentsSnapshot.docs[commentsSnapshot.docs.length - 1]);
      setHasMore(commentsSnapshot.docs.length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error('Daha fazla yorum yüklenirken hata oluştu:', error);
    }
  };

  // Yorum onaylama durumunu değiştir
  const toggleApproveStatus = async (commentId, currentStatus) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        approved: !currentStatus
      });
      
      // Firebase onSnapshot ile otomatik güncellenecek
    } catch (error) {
      console.error('Yorum onay durumu değiştirilirken hata oluştu:', error);
      alert('Yorum onay durumu değiştirilirken bir hata oluştu.');
    }
  };

  // Yorum silme işlemi
  const deleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'comments', commentToDelete));
      
      // Firebase onSnapshot ile otomatik güncellenecek
      
      setDeleteModalOpen(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Yorum silinirken hata oluştu:', error);
      alert('Yorum silinirken bir hata oluştu.');
    }
  };

  // Toplu işlem uygula
  const applyBulkAction = async () => {
    if (selectedComments.length === 0 || !bulkAction) return;
    
    try {
      const batch = writeBatch(db);
      
      if (bulkAction === 'approve' || bulkAction === 'reject') {
        const approved = bulkAction === 'approve';
        
        selectedComments.forEach(commentId => {
          const commentRef = doc(db, 'comments', commentId);
          batch.update(commentRef, { approved });
        });
      } else if (bulkAction === 'delete') {
        selectedComments.forEach(commentId => {
          const commentRef = doc(db, 'comments', commentId);
          batch.delete(commentRef);
        });
      }
      
      await batch.commit();
      
      // İşlem başarılı mesajı
      alert(`${selectedComments.length} yoruma "${bulkAction}" işlemi başarıyla uygulandı.`);
      
      // Temizle
      setSelectedComments([]);
      setBulkActionModalOpen(false);
      setBulkAction('');
    } catch (error) {
      console.error('Toplu işlem uygulanırken hata oluştu:', error);
      alert('Toplu işlem uygulanırken bir hata oluştu.');
    }
  };
  
  // CSV'ye dışa aktar
  const exportToCSV = () => {
    const exportData = comments.map(comment => ({
      'ID': comment.id,
      'İçerik': comment.content || '',
      'Yazar': comment.authorName || 'Anonim',
      'E-posta': comment.authorEmail || '',
      'Yazı': comment.postTitle || '',
      'Durum': comment.approved ? 'Onaylandı' : 'Beklemede',
      'Tarih': comment.createdAt?.toDate().toLocaleString('tr-TR') || ''
    }));
    
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'yorumlar.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Yorum Yönetimi</h2>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Yorum ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="relative flex-1 md:flex-none">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="approved">Onaylanmış</option>
              <option value="pending">Beklemede</option>
            </select>
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="relative flex-1 md:flex-none">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none"
              value={postFilter}
              onChange={(e) => setPostFilter(e.target.value)}
            >
              <option value="all">Tüm Yazılar</option>
              {posts.map(post => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="relative flex-1 md:flex-none">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="today">Bugün</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Son 30 Gün</option>
            </select>
            <FiRefreshCw className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiDownload className="mr-2" /> Dışa Aktar
          </button>
          
          {selectedComments.length > 0 && (
            <button
              onClick={() => setBulkActionModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiCheck className="mr-2" /> Toplu İşlem ({selectedComments.length})
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-14 bg-gray-100 rounded-t-lg"></div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-50 border-t border-gray-100"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedComments(filteredComments.map(comment => comment.id));
                      } else {
                        setSelectedComments([]);
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yazar
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yorum
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yazı
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredComments.length > 0 ? (
                filteredComments.map(comment => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={selectedComments.includes(comment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedComments(prev => [...prev, comment.id]);
                          } else {
                            setSelectedComments(prev => prev.filter(id => id !== comment.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{comment.authorName || 'Anonim'}</p>
                        <p className="text-gray-500 text-xs">{comment.authorEmail || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-2">{comment.content}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      <Link href={`/blog/${comment.postSlug}`} className="hover:text-blue-600 hover:underline line-clamp-1">
                        {comment.postTitle}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {comment.createdAt?.toDate().toLocaleString('tr-TR')}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {comment.approved ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Onaylandı
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Beklemede
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => toggleApproveStatus(comment.id, comment.approved)}
                          className={comment.approved ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"}
                          title={comment.approved ? "Onayı Kaldır" : "Onayla"}
                        >
                          {comment.approved ? <FiX /> : <FiCheck />}
                        </button>
                        <button
                          onClick={() => {
                            setCommentToDelete(comment.id);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    Yorum bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {hasMore && (
            <div className="py-4 text-center">
              <button
                onClick={loadMoreComments}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Silme Onay Modalı */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <FiAlertTriangle className="text-xl mr-2" />
              <h3 className="text-lg font-semibold">Yorumu Sil</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCommentToDelete(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={deleteComment}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toplu İşlem Modalı */}
      {bulkActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Toplu İşlem Uygula
            </h3>
            <p className="text-gray-700 mb-4">
              Seçili {selectedComments.length} yoruma aşağıdaki işlemi uygulamak istediğinizden emin misiniz?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşlem
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">İşlem Seçin</option>
                <option value="approve">Onayla</option>
                <option value="reject">Onayı Kaldır</option>
                <option value="delete">Sil</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBulkActionModalOpen(false);
                  setBulkAction('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={applyBulkAction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                disabled={!bulkAction}
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}