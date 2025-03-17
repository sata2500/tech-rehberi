// src/components/admin/ContentManagement.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  doc,
  where,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiAlertTriangle,
  FiCheck,
  FiDownload,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import Link from 'next/link';

export default function ContentManagement() {
  // Blog yazıları ve kategoriler
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  
  // Yükleme durumları
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Modallar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  // Filtreleme ve arama
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Toplu işlem
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Blog yazılarını al
  useEffect(() => {
    const fetchPosts = () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(postsQuery, (postsSnapshot) => {
          const postsData = postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setPosts(postsData);
          setFilteredPosts(postsData);
          setLoadingPosts(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Blog yazıları alınırken hata oluştu:', error);
        setLoadingPosts(false);
        return () => {};
      }
    };
    
    const unsubscribe = fetchPosts();
    
    return () => unsubscribe();
  }, []);

  // Kategorileri al
  useEffect(() => {
    const fetchCategories = () => {
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('name')
        );
        
        const unsubscribe = onSnapshot(categoriesQuery, (categoriesSnapshot) => {
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setCategories(categoriesData);
          setLoadingCategories(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Kategoriler alınırken hata oluştu:', error);
        setLoadingCategories(false);
        return () => {};
      }
    };
    
    const unsubscribe = fetchCategories();
    
    return () => unsubscribe();
  }, []);

  // Filtreleme
  useEffect(() => {
    if (searchTerm === '' && categoryFilter === 'all' && statusFilter === 'all') {
      setFilteredPosts(posts);
      return;
    }
    
    let filtered = posts;
    
    if (searchTerm !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(term) || 
        (post.content && post.content.toLowerCase().includes(term))
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(post => post.categoryId === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published';
      filtered = filtered.filter(post => post.published === isPublished);
    }
    
    setFilteredPosts(filtered);
  }, [searchTerm, categoryFilter, statusFilter, posts]);

  // Blog yazısı yayınlama durumunu değiştir
  const togglePublishStatus = async (postId, currentStatus) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        published: !currentStatus
      });
      
      // State güncelleme Firebase onSnapshot ile otomatik olarak yapılacak
    } catch (error) {
      console.error('Yayın durumu değiştirilirken hata oluştu:', error);
      alert('Yazının yayın durumu değiştirilirken bir hata oluştu.');
    }
  };

  // Blog yazısı silme işlemi
  const deletePost = async () => {
    if (!postToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      
      // State güncelleme Firebase onSnapshot ile otomatik olarak yapılacak
      
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Yazı silinirken hata oluştu:', error);
      alert('Yazı silinirken bir hata oluştu.');
    }
  };
  
  // Kategori silme işlemi
  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      // Bu kategoriye ait yazılar var mı kontrol et
      const postsQuery = query(
        collection(db, 'posts'),
        where('categoryId', '==', categoryToDelete)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      
      if (!postsSnapshot.empty) {
        alert('Bu kategoriye ait yazılar bulunuyor. Önce bu yazıları başka bir kategoriye taşıyın veya silin.');
        setCategoryToDelete(null);
        return;
      }
      
      await deleteDoc(doc(db, 'categories', categoryToDelete));
      
      // State güncelleme Firebase onSnapshot ile otomatik olarak yapılacak
      
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Kategori silinirken hata oluştu:', error);
      alert('Kategori silinirken bir hata oluştu.');
    }
  };
  
  // Toplu işlem uygula
  const applyBulkAction = async () => {
    if (selectedPosts.length === 0 || !bulkAction) return;
    
    try {
      const batch = writeBatch(db);
      
      if (bulkAction === 'publish' || bulkAction === 'unpublish') {
        const published = bulkAction === 'publish';
        
        selectedPosts.forEach(postId => {
          const postRef = doc(db, 'posts', postId);
          batch.update(postRef, { published });
        });
      } else if (bulkAction === 'delete') {
        selectedPosts.forEach(postId => {
          const postRef = doc(db, 'posts', postId);
          batch.delete(postRef);
        });
      }
      
      await batch.commit();
      
      // İşlem başarılı mesajı
      alert(`${selectedPosts.length} yazıya "${bulkAction}" işlemi başarıyla uygulandı.`);
      
      // Temizle
      setSelectedPosts([]);
      setBulkActionModalOpen(false);
      setBulkAction('');
    } catch (error) {
      console.error('Toplu işlem uygulanırken hata oluştu:', error);
      alert('Toplu işlem uygulanırken bir hata oluştu.');
    }
  };
  
  // CSV'ye dışa aktar
  const exportToCSV = () => {
    const exportData = posts.map(post => ({
      'ID': post.id,
      'Başlık': post.title,
      'Slug': post.slug,
      'Kategori': categories.find(cat => cat.id === post.categoryId)?.name || 'Kategorisiz',
      'Durum': post.published ? 'Yayında' : 'Taslak',
      'Yazar': post.authorName || 'Admin',
      'Görüntülenme': post.viewCount || 0,
      'Oluşturma Tarihi': post.createdAt?.toDate().toLocaleString('tr-TR') || '',
      'Güncelleme Tarihi': post.updatedAt?.toDate().toLocaleString('tr-TR') || ''
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
    link.setAttribute('download', 'blog-yazilari.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Blog Yazıları Bölümü */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Blog Yazıları</h2>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Yazı ara..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <div className="relative flex-1 md:flex-none">
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <div className="relative flex-1 md:flex-none">
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
              </select>
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiDownload className="mr-2" /> Dışa Aktar
            </button>
            
            {selectedPosts.length > 0 && (
              <button
                onClick={() => setBulkActionModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FiCheck className="mr-2" /> Toplu İşlem ({selectedPosts.length})
              </button>
            )}
          </div>
        </div>
        
        {loadingPosts ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPosts(filteredPosts.map(post => post.id));
                          } else {
                            setSelectedPosts([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Görüntülenme
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPosts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          checked={selectedPosts.includes(post.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPosts(prev => [...prev, post.id]);
                            } else {
                              setSelectedPosts(prev => prev.filter(id => id !== post.id));
                            }
                          }}
                        />
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {categories.find(cat => cat.id === post.categoryId)?.name || 'Kategorisiz'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {post.createdAt?.toDate().toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {post.published ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Yayında
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Taslak
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {post.viewCount || 0}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <Link 
                            href={`/blog/${post.slug}`} 
                            className="text-blue-600 hover:text-blue-800"
                            title="Görüntüle"
                          >
                            <FiEye />
                          </Link>
                          <Link 
                            href={`/admin/duzenle/${post.id}`} 
                            className="text-green-600 hover:text-green-800"
                            title="Düzenle"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            onClick={() => togglePublishStatus(post.id, post.published)}
                            className={post.published ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"}
                            title={post.published ? "Yayından Kaldır" : "Yayınla"}
                          >
                            {post.published ? <FiEyeOff /> : <FiEye />}
                          </button>
                          <button
                            onClick={() => {
                              setPostToDelete(post.id);
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">Aramanızla eşleşen yazı bulunamadı.</p>
            <Link 
              href="/admin/yeni-yazi" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Yeni Yazı Oluştur
            </Link>
          </div>
        )}
      </div>
      
      {/* Kategoriler Bölümü */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Kategoriler</h2>
          <Link 
            href="/admin/kategori/yeni" 
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <FiPlus className="mr-1" /> Kategori Ekle
          </Link>
        </div>
        
        {loadingCategories ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori Adı
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yazı Sayısı
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map(category => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {category.slug}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate">
                        {category.description ? 
                          (category.description.length > 50 ? 
                            category.description.substring(0, 50) + '...' : 
                            category.description) : 
                          '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {posts.filter(post => post.categoryId === category.id).length}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <Link 
                            href={`/kategori/${category.slug}`} 
                            className="text-blue-600 hover:text-blue-800"
                            title="Görüntüle"
                          >
                            <FiEye />
                          </Link>
                          <Link 
                            href={`/admin/kategori/duzenle/${category.id}`} 
                            className="text-green-600 hover:text-green-800"
                            title="Düzenle"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category.id);
                              if (confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
                                deleteCategory();
                              } else {
                                setCategoryToDelete(null);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Sil"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">Henüz hiç kategori bulunmuyor.</p>
            <Link 
              href="/admin/kategori/yeni" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              İlk Kategoriyi Oluştur
            </Link>
          </div>
        )}
      </div>
      
      {/* Silme Onay Modalı */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <FiAlertTriangle className="text-xl mr-2" />
              <h3 className="text-lg font-semibold">Yazıyı Sil</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Bu yazıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPostToDelete(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={deletePost}
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
              Seçili {selectedPosts.length} yazıya aşağıdaki işlemi uygulamak istediğinizden emin misiniz?
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
                <option value="publish">Yayınla</option>
                <option value="unpublish">Yayından Kaldır</option>
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