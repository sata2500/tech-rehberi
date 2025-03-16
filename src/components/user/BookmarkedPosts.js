// src/components/user/BookmarkedPosts.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiBookmark, 
  FiThumbsUp, 
  FiEye, 
  FiCalendar, 
  FiFilter, 
  FiX, 
  FiTrash2,
  FiSearch,
  FiGrid,
  FiList,
  FiClock
} from 'react-icons/fi';
import { 
  getUserInteractions, 
  removeUserInteraction 
} from '../../lib/user-helpers';

export default function BookmarkedPosts({ user, type = 'bookmark' }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // list veya grid
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Etkileşim türüne göre başlık belirleme
  const typeTitle = type === 'bookmark' ? 'Kaydedilen Yazılar' : 'Beğenilen Yazılar';
  const emptyMessage = type === 'bookmark' 
    ? 'Henüz kaydedilmiş yazınız bulunmuyor.' 
    : 'Henüz beğendiğiniz yazı bulunmuyor.';
  const icon = type === 'bookmark' ? <FiBookmark /> : <FiThumbsUp />;
  
  // Yazıları yükle
  useEffect(() => {
    const loadPosts = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUserInteractions(user.uid, type, {
          sortBy,
          sortDirection
        });
        
        if (result.success) {
          setPosts(result.posts);
          
          // Kategorileri çıkar
          const categories = result.posts.reduce((acc, post) => {
            if (post.categories && Array.isArray(post.categories)) {
              post.categories.forEach(category => {
                if (!acc.includes(category)) {
                  acc.push(category);
                }
              });
            }
            return acc;
          }, []);
          
          setAvailableCategories(categories);
        } else {
          setError(result.error);
        }
      } catch (error) {
        console.error(`${typeTitle} yüklenirken hata oluştu:`, error);
        setError('Yazılar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPosts();
  }, [user, type, sortBy, sortDirection, typeTitle]);
  
  // Etkileşimi kaldır (kayıt veya beğeni)
  const handleRemoveInteraction = async (postId) => {
    if (!user?.uid) return;
    
    try {
      const result = await removeUserInteraction(user.uid, postId, type);
      
      if (result.success) {
        // Başarılı ise listeden kaldır
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        console.error('Etkileşim kaldırılırken hata oluştu:', result.error);
      }
    } catch (error) {
      console.error('Etkileşim kaldırılırken hata oluştu:', error);
    }
  };
  
  // Arama ve filtreleme
  const filteredPosts = posts.filter(post => {
    // Arama terimine göre filtrele
    const matchesSearch = searchTerm.trim() === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Kategorilere göre filtrele
    const matchesCategories = selectedCategories.length === 0 ||
      (post.categories && post.categories.some(category => selectedCategories.includes(category)));
    
    return matchesSearch && matchesCategories;
  });
  
  // Kategori seçme/kaldırma
  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Görünüm değiştirme (liste/grid)
  const toggleView = (newView) => {
    setView(newView);
  };
  
  // Sıralama değiştirme
  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === 'title_asc') {
      setSortBy('title');
      setSortDirection('asc');
    } else if (value === 'title_desc') {
      setSortBy('title');
      setSortDirection('desc');
    } else if (value === 'createdAt_asc') {
      setSortBy('createdAt');
      setSortDirection('asc');
    } else {
      setSortBy('createdAt');
      setSortDirection('desc');
    }
  };
  
  // Kategorileri sıfırla
  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchTerm('');
  };
  
  // Tarih formatı
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          {icon} <span className="ml-2">{typeTitle}</span>
        </h3>
        
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex space-x-4">
              <div className="bg-gray-200 h-24 w-24 rounded"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          {icon} <span className="ml-2">{typeTitle}</span>
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredPosts.length})
          </span>
        </h3>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {!isLoading && posts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-2">
              {type === 'bookmark' ? <FiBookmark size={36} className="mx-auto mb-2" /> : <FiThumbsUp size={36} className="mx-auto mb-2" />}
            </div>
            <p className="text-gray-600 mb-4">{emptyMessage}</p>
            <Link 
              href="/blog"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Yazıları Keşfedin
            </Link>
          </div>
        ) : (
          <>
            {/* Arama ve Filtre Araçları */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
                {/* Arama */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Yazı ara..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Sıralama */}
                <div className="w-full md:w-48">
                  <select
                    value={`${sortBy}_${sortDirection}`}
                    onChange={handleSortChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt_desc">En Yeni</option>
                    <option value="createdAt_asc">En Eski</option>
                    <option value="title_asc">İsme Göre (A-Z)</option>
                    <option value="title_desc">İsme Göre (Z-A)</option>
                  </select>
                </div>
                
                {/* Görünüm Değiştirme */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => toggleView('list')}
                    className={`p-2 rounded-md ${view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    title="Liste görünümü"
                  >
                    <FiList />
                  </button>
                  <button
                    onClick={() => toggleView('grid')}
                    className={`p-2 rounded-md ${view === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    title="Grid görünümü"
                  >
                    <FiGrid />
                  </button>
                </div>
                
                {/* Filtreleme Butonu */}
                <button
                  onClick={() => setShowFilterOptions(!showFilterOptions)}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    showFilterOptions || selectedCategories.length > 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiFilter className="mr-1" />
                  <span>Filtrele</span>
                  {selectedCategories.length > 0 && (
                    <span className="ml-1.5 bg-white text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Filtre Seçenekleri */}
              {showFilterOptions && (
                <div className="mt-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Kategoriler</h4>
                    
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FiX className="mr-1" />
                        Filtreleri Temizle
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedCategories.includes(category)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                    
                    {availableCategories.length === 0 && (
                      <p className="text-sm text-gray-500 italic">Kategori bulunamadı.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {filteredPosts.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">Arama kriterlerinize uygun yazı bulunamadı.</p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <>
                {/* Liste Görünümü */}
                {view === 'list' && (
                  <div className="space-y-4">
                    {filteredPosts.map(post => (
                      <div key={post.id} className="flex border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                        {/* Yazı Resmi */}
                        <div className="flex-shrink-0 mr-4">
                          <Link href={`/blog/${post.slug}`}>
                            <div className="relative w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                              {post.featuredImage ? (
                                <Image
                                  src={post.featuredImage}
                                  alt={post.title}
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <FiBookmark size={24} />
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                        
                        {/* Yazı İçeriği */}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 mb-1 hover:text-blue-700">
                                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                              </h4>
                              
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {post.excerpt || 'Özet bulunmuyor.'}
                              </p>
                              
                              <div className="flex items-center text-xs text-gray-500 space-x-3">
                                <span className="flex items-center">
                                  <FiCalendar className="mr-1" />
                                  {formatDate(post.createdAt)}
                                </span>
                                
                                {post.categories && post.categories.length > 0 && (
                                  <span>
                                    {post.categories.slice(0, 2).join(', ')}
                                    {post.categories.length > 2 && '...'}
                                  </span>
                                )}
                                
                                {post.viewCount !== undefined && (
                                  <span className="flex items-center">
                                    <FiEye className="mr-1" />
                                    {post.viewCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveInteraction(post.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title={type === 'bookmark' ? 'Kayıttan Kaldır' : 'Beğeniyi Kaldır'}
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Grid Görünümü */}
                {view === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPosts.map(post => (
                      <div key={post.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                        {/* Yazı Resmi */}
                        <Link href={`/blog/${post.slug}`} className="block relative h-40 bg-gray-200 overflow-hidden">
                          {post.featuredImage ? (
                            <Image
                              src={post.featuredImage}
                              alt={post.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              <FiBookmark size={36} />
                            </div>
                          )}
                        </Link>
                        
                        {/* Yazı İçeriği */}
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-700 line-clamp-1">
                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                          </h4>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                            {post.excerpt || 'Özet bulunmuyor.'}
                          </p>
                          
                          <div className="flex justify-between items-center mt-auto">
                            <div className="flex items-center text-xs text-gray-500">
                              <FiClock className="mr-1" />
                              {formatDate(post.createdAt)}
                            </div>
                            
                            <button
                              onClick={() => handleRemoveInteraction(post.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title={type === 'bookmark' ? 'Kayıttan Kaldır' : 'Beğeniyi Kaldır'}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}