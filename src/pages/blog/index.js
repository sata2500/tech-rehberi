// src/pages/blog/index.js
import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter,
  where 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/router';
import SearchBar from '../../components/ui/SearchBar';
import { useCache } from '../../contexts/CacheContext';

export default function Blog() {
  const router = useRouter();
  const { getQuery, setQuery, isQueryStale } = useCache();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 9;

  // İlk blog yazılarını al
  const fetchPosts = async (lastPost = null) => {
    try {
      setLoading(true);
      
      // Önbellek anahtarı oluştur
      const cacheKey = lastPost ? `posts_after_${lastPost.id}` : 'posts_first_page';
      
      // Önbellekte var mı kontrol et
      const cachedPosts = getQuery(cacheKey);
      
      if (cachedPosts && !isQueryStale(cacheKey)) {
        // Önbellekten al
        if (lastPost) {
          setPosts(prev => [...prev, ...cachedPosts]);
        } else {
          setPosts(cachedPosts);
        }
        
        if (cachedPosts.length > 0) {
          setLastVisible(cachedPosts[cachedPosts.length - 1]);
        }
        
        setHasMore(cachedPosts.length === postsPerPage);
        setLoading(false);
        return;
      }
      
      // Firestore'dan getir
      let postsQuery;
      
      if (lastPost) {
        postsQuery = query(
          collection(db, 'posts'),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastPost),
          limit(postsPerPage)
        );
      } else {
        postsQuery = query(
          collection(db, 'posts'),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(postsPerPage)
        );
      }
      
      const postsSnapshot = await getDocs(postsQuery);
      
      if (postsSnapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      
      const newPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Önbelleğe kaydet
      setQuery(cacheKey, newPosts, 5 * 60 * 1000); // 5 dakika
      
      if (lastPost) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(postsSnapshot.docs.length === postsPerPage);
    } catch (error) {
      console.error('Blog yazıları alınırken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchPosts();
  }, []);

  // Daha fazla yükle
  const loadMore = () => {
    if (lastVisible && !loading) {
      fetchPosts(lastVisible);
    }
  };

  // Arama işlevi - arama sayfasına yönlendir
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      router.push(`/arama?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <Layout
      title="Blog"
      description="Tech Rehberi blog yazıları - Teknoloji ve yazılım hakkında en güncel makaleler."
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog Yazıları</h1>
        
        {/* Arama Formu */}
        <div className="max-w-xl mb-8">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Blog yazılarında ara..." 
            saveHistory={true}
          />
        </div>
        
        {/* Blog Yazıları */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div 
                key={index} 
                className="bg-gray-100 rounded-lg p-4 h-64 animate-pulse"
              ></div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <div 
                  key={post.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition duration-200"
                >
                  {post.coverImage && (
                    <div className="h-48 overflow-hidden relative">
                      <Image 
                        src={post.coverImage} 
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover hover:scale-105 transition duration-200"
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
              Yazı Bulunamadı
            </h3>
            <p className="text-gray-600 mb-4">
              Blog yazısı bulunamadı.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}