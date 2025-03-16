// src/pages/admin/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  doc,
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiAlertTriangle 
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Admin kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Blog yazılarını al
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPosts(postsData);
      } catch (error) {
        console.error('Blog yazıları alınırken hata oluştu:', error);
      } finally {
        setLoadingPosts(false);
      }
    };
    
    if (user && user.role === 'admin') {
      fetchPosts();
    }
  }, [user]);

  // Kategorileri al
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('name')
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(categoriesData);
      } catch (error) {
        console.error('Kategoriler alınırken hata oluştu:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    if (user && user.role === 'admin') {
      fetchCategories();
    }
  }, [user]);

  // Blog yazısı yayınlama durumunu değiştir
  const togglePublishStatus = async (postId, currentStatus) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        published: !currentStatus
      });
      
      // State güncelle
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, published: !currentStatus } 
            : post
        )
      );
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
      
      // State güncelle
      setPosts(prevPosts => 
        prevPosts.filter(post => post.id !== postToDelete)
      );
      
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
      
      // State güncelle
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== categoryToDelete)
      );
      
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Kategori silinirken hata oluştu:', error);
      alert('Kategori silinirken bir hata oluştu.');
    }
  };

  // Admin değilse veya henüz yükleniyor ise
  if (authLoading || !user || user.role !== 'admin') {
    return (
      <Layout title="Yükleniyor...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Panel">
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin/yeni-yazi" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiPlus className="mr-2" /> Yeni Yazı Ekle
            </Link>
          </div>
        </div>
        
        {/* Blog Yazıları Tablosu */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Blog Yazıları</h2>
          
          {loadingPosts ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Başlık
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
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {post.title}
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
                        <div className="flex space-x-2">
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
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">Henüz hiç blog yazısı bulunmuyor.</p>
              <Link 
                href="/admin/yeni-yazi" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                İlk Yazını Oluştur
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
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
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
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {category.description ? 
                          (category.description.length > 50 ? 
                            category.description.substring(0, 50) + '...' : 
                            category.description) : 
                          '-'}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex space-x-2">
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
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
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
    </Layout>
  );
}