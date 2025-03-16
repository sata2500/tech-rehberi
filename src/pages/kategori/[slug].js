// src/pages/kategori/[slug].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FiChevronLeft } from 'react-icons/fi';

export default function CategoryPosts() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 9;

  // Kategori ve yazıları al
  useEffect(() => {
    const fetchCategoryAndPosts = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Slug'a göre kategoriyi bul
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('slug', '==', slug)
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        if (categoriesSnapshot.empty) {
          setError('Kategori bulunamadı.');
          setLoading(false);
          return;
        }
        
        const categoryData = {
          id: categoriesSnapshot.docs[0].id,
          ...categoriesSnapshot.docs[0].data()
        };
        
        setCategory(categoryData);
        
        // Kategoriye ait yazıları al
        const postsQuery = query(
          collection(db, 'posts'),
          where('categoryId', '==', categoryData.id),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(postsPerPage)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        if (!postsSnapshot.empty) {
          const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
          setLastVisible(lastVisibleDoc);
          
          const postsData = postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setPosts(postsData);
          setHasMore(postsSnapshot.docs.length === postsPerPage);
        } else {
          setPosts([]);
          setHasMore(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Kategori verileri alınırken hata oluştu:', error);
        setError('Kategori yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };
    
    fetchCategoryAndPosts();
  }, [slug]);

  // Daha fazla yazı yükle
  const loadMore = async () => {
    if (!lastVisible || !category) return;
    
    try {
      setLoading(true);
      
      const postsQuery = query(
        collection(db, 'posts'),
        where('categoryId', '==', category.id),
        where('published', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(postsPerPage)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      
      if (!postsSnapshot.empty) {
        const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);
        
        const newPostsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPosts(prevPosts => [...prevPosts, ...newPostsData]);
        setHasMore(postsSnapshot.docs.length === postsPerPage);
      } else {
        setHasMore(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Daha fazla yazı alınırken hata oluştu:', error);
      setLoading(false);
    }
  };

  // Yükleniyor durumu
  if (loading && !category) {
    return (
      <Layout title="Kategori Yükleniyor">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Hata durumu
  if (error || !category) {
    return (
      <Layout title="Hata">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Kategori bulunamadı'}
          </h1>
          <p className="text-gray-600 mb-6">
            Aradığınız kategoriye şu anda ulaşılamıyor veya silinmiş olabilir.
          </p>
          <Link 
            href="/kategoriler"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Tüm Kategorilere Dön
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={category.name}
      description={category.description || `Tech Rehberi - ${category.name} kategorisindeki yazılar`}
    >
      <div className="mb-12">
        <div className="mb-6">
          <Link 
            href="/kategoriler" 
            className="text-blue-600 hover:text-blue-800 inline-flex items-center mb-2"
          >
            <FiChevronLeft className="mr-1" /> Tüm Kategoriler
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          
          {category.description && (
            <p className="text-gray-600">
              {category.description}
            </p>
          )}
        </div>
        
        {/* Kategori Görseli */}
        {category.image && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <image 
              src={category.image} 
              alt={category.name} 
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
        
        {/* Yazılar */}
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <div 
                  key={post.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition duration-200"
                >
                  {post.coverImage && (
                    <div className="h-48 overflow-hidden">
                      <image 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover hover:scale-105 transition duration-200"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {post.createdAt?.toDate().toLocaleDateString('tr-TR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      {post.excerpt || post.content.substring(0, 100) + '...'}
                    </p>
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Devamını Oku
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:bg-blue-300"
                >
                  {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Bu Kategoride Henüz Yazı Bulunmuyor
            </h3>
            <p className="text-gray-600 mb-4">
              {category.name} kategorisinde henüz bir içerik paylaşılmadı.
            </p>
            <Link 
              href="/blog"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Tüm Yazıları Görüntüle
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}