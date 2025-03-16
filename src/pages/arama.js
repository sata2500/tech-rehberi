// src/pages/arama.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import SearchBar from '../components/ui/SearchBar';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FiClock, FiTag } from 'react-icons/fi';

/**
 * Metindeki arama terimlerini vurgula
 * 
 * @param {string} text - Vurgulanacak metin
 * @param {string} searchTerm - Arama terimi
 * @returns {JSX.Element} - Vurgulanmış metin
 */
const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  try {
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? 
            <mark key={i} className="bg-yellow-200 rounded px-1">{part}</mark> : 
            part
        )}
      </>
    );
  } catch (e) {
    return text;
  }
};

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tags: []
  });
  const [availableTags, setAvailableTags] = useState([]);

  // Client-side filtreleme ile arama yap
  const performSearch = useCallback((term) => {
    if (!term?.trim() || !allPosts.length) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const searchTermLower = term.toLowerCase();
      
      // Client-side arama implementasyonu
      const filtered = allPosts.filter(post => {
        const titleMatch = post.title && post.title.toLowerCase().includes(searchTermLower);
        const contentMatch = post.content && post.content.toLowerCase().includes(searchTermLower);
        const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(searchTermLower);
        const tagsMatch = post.tags && Array.isArray(post.tags) && 
          post.tags.some(tag => tag.toLowerCase().includes(searchTermLower));
        
        return titleMatch || contentMatch || excerptMatch || tagsMatch;
      });
      
      // Ek filtreleri uygula
      let filteredResults = filtered;
      
      // Etiketlerle filtrele
      if (filters.tags.length > 0) {
        filteredResults = filteredResults.filter(post => 
          post.tags && Array.isArray(post.tags) && 
          filters.tags.some(tag => post.tags.includes(tag))
        );
      }
      
      setResults(filteredResults);
    } catch (error) {
      console.error('Arama sırasında hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }, [allPosts, filters]);

  // İlk yüklemede tüm postları getir
  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        setLoading(true);
        const postsQuery = query(
          collection(db, 'posts'),
          where('published', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAllPosts(posts);
        
        // Tüm benzersiz etiketleri çıkar
        const tags = new Set();
        posts.forEach(post => {
          if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(tag => tags.add(tag));
          }
        });
        
        setAvailableTags(Array.from(tags));
        
      } catch (error) {
        console.error('Yazılar alınırken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllPosts();
  }, []);

  // URL sorgu parametresi değiştiğinde aramayı yap
  useEffect(() => {
    if (q) {
      setSearchTerm(q);
      performSearch(q);
    }
  }, [q, performSearch]);

  // Arama çubuğundan arama
  const handleSearch = (term) => {
    router.push({
      pathname: '/arama',
      query: { q: term }
    }, undefined, { shallow: true });
  };

  // Etiket filtreleme
  const toggleTagFilter = (tag) => {
    setFilters(prev => {
      const newTags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      
      return { ...prev, tags: newTags };
    });
  };

  // Filtreler değiştiğinde sonuçları güncelle
  useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm);
    }
  }, [filters, performSearch, searchTerm]);

  return (
    <Layout
      title={`&quot;${searchTerm}&quot; için arama sonuçları - Tech Rehberi`}
      description={`Tech Rehberi blog sitesinde &quot;${searchTerm}&quot; araması için sonuçlar.`}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Arama</h1>
        
        {/* Arama Çubuğu */}
        <div className="mb-8">
          <SearchBar 
            initialValue={searchTerm} 
            onSearch={handleSearch} 
            placeholder="Blog yazılarında ara..."
            saveHistory={true}
          />
        </div>
        
        {/* Arama İstatistikleri */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-gray-600">
              <span className="font-medium">&quot;{searchTerm}&quot;</span> için {results.length} sonuç bulundu
            </p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filtreler Kenar Çubuğu */}
          <div className="w-full md:w-64 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-3">Filtreler</h3>
              
              {availableTags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Etiketler</h4>
                  <div className="space-y-1">
                    {availableTags.map((tag, index) => (
                      <div key={index} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`tag-${index}`}
                          checked={filters.tags.includes(tag)}
                          onChange={() => toggleTagFilter(tag)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`tag-${index}`} className="ml-2 text-sm text-gray-700">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {filters.tags.length > 0 && (
                <button 
                  onClick={() => setFilters(prev => ({...prev, tags: []}))}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          </div>
          
          {/* Arama Sonuçları */}
          <div className="flex-1">
            {loading ? (
              // Yükleniyor durumu
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-6">
                {results.map(post => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-200">
                    <div className="p-5">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link href={`/blog/${post.slug}`}>
                          {highlightText(post.title, searchTerm)}
                        </Link>
                      </h2>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <FiClock className="mr-1" />
                        <span>
                          {post.createdAt?.toDate().toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">
                        {highlightText(post.excerpt || post.content.substring(0, 200) + '...', searchTerm)}
                      </p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <FiTag className="text-gray-400" />
                          {post.tags.map((tag, i) => (
                            <span 
                              key={i} 
                              className={`text-xs px-2 py-1 rounded-full ${
                                filters.tags.includes(tag) 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                              } cursor-pointer hover:bg-blue-100`}
                              onClick={() => toggleTagFilter(tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="inline-block text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Devamını Oku
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Sonuç Bulunamadı
                </h3>
                <p className="text-gray-600 mb-4">
                  &quot;{searchTerm}&quot; için herhangi bir sonuç bulunamadı. Lütfen farklı anahtar kelimelerle tekrar deneyin.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Arama Yapmak İçin
                </h3>
                <p className="text-gray-600">
                  Yukarıdaki arama çubuğunu kullanarak blog yazılarında arama yapabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}