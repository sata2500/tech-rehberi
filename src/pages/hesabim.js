// src/pages/hesabim.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiLogOut, 
  FiEdit, 
  FiBookmark,
  FiSettings,
  FiThumbsUp,
  FiMessageSquare,
  FiHome,
  FiMonitor 
} from 'react-icons/fi';

// Yeni eklenen bileşenleri içe aktar
import ProfileForm from '../components/user/ProfileForm';
import BookmarkedPosts from '../components/user/BookmarkedPosts';
import UserComments from '../components/user/UserComments';
import ProfileThemeSettings from '../components/user/ProfileThemeSettings';

export default function Account() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // URL tabını izle
  useEffect(() => {
    const { tab } = router.query;
    if (tab && ['profile', 'bookmarks', 'likes', 'comments', 'settings', 'theme'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router.query]);
  
  // Tab değiştir ve URL'yi güncelle
  const changeTab = (tab) => {
    setActiveTab(tab);
    router.push({
      pathname: router.pathname,
      query: { tab }
    }, undefined, { shallow: true });
  };

  // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
  useEffect(() => {
    if (!loading && !user) {
      router.push('/giris');
    }
  }, [user, loading, router]);

  // Kullanıcının yazılarını al (admin değilse boş array dönecek)
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;
      
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUserPosts(postsData);
      } catch (error) {
        console.error('Kullanıcı yazıları alınırken hata oluştu:', error);
      } finally {
        setLoadingPosts(false);
      }
    };
    
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  // Çıkış yapma işlevi
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Kullanıcı yüklenirken gösterilecek içerik
  if (loading || !user) {
    return (
      <Layout title="Hesabım - Yükleniyor">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Hesabım"
      description="Tech Rehberi kullanıcı hesap bilgileriniz ve yazılarınız."
    >
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Hesabım</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Yan Menü (Sol Kenar Çubuğu) */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 sticky top-8">
              <div className="flex flex-col items-center text-center mb-6">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || 'Kullanıcı'} 
                    width={96}
                    height={96}
                    className="rounded-full mb-4"
                    priority
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                    <FiUser className="text-blue-500 dark:text-blue-300 text-3xl" />
                  </div>
                )}
                
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {user.displayName || 'İsimsiz Kullanıcı'}
                </h2>
                
                {user.role === 'admin' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs mt-2">
                    Admin
                  </span>
                )}
              </div>
              
              {/* Sekmeler */}
              <nav className="space-y-1">
                <button
                  onClick={() => changeTab('profile')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiUser className="mr-3" />
                  <span>Profil</span>
                </button>
                
                <button
                  onClick={() => changeTab('bookmarks')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'bookmarks'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiBookmark className="mr-3" />
                  <span>Kaydedilenler</span>
                </button>
                
                <button
                  onClick={() => changeTab('likes')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'likes'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiThumbsUp className="mr-3" />
                  <span>Beğeniler</span>
                </button>
                
                <button
                  onClick={() => changeTab('comments')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'comments'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiMessageSquare className="mr-3" />
                  <span>Yorumlar</span>
                </button>
                
                <button
                  onClick={() => changeTab('theme')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'theme'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiMonitor className="mr-3" />
                  <span>Tema</span>
                </button>
                
                <button
                  onClick={() => changeTab('settings')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-md ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FiSettings className="mr-3" />
                  <span>Ayarlar</span>
                </button>
                
                {user.role === 'admin' && (
                  <Link 
                    href="/admin"
                    className="w-full flex items-center px-4 py-2 text-left rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiEdit className="mr-3" />
                    <span>Admin Paneli</span>
                  </Link>
                )}
                
                <Link 
                  href="/"
                  className="w-full flex items-center px-4 py-2 text-left rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiHome className="mr-3" />
                  <span>Anasayfa</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-left rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <FiLogOut className="mr-3" />
                  <span>Çıkış Yap</span>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Ana İçerik (Sağ Taraf) */}
          <div className="md:col-span-3">
            {/* Profil Sekmesi */}
            {activeTab === 'profile' && (
              <ProfileForm user={user} />
            )}
            
            {/* Kaydedilenler Sekmesi */}
            {activeTab === 'bookmarks' && (
              <BookmarkedPosts user={user} type="bookmark" />
            )}
            
            {/* Beğeniler Sekmesi */}
            {activeTab === 'likes' && (
              <BookmarkedPosts user={user} type="like" />
            )}
            
            {/* Yorumlar Sekmesi */}
            {activeTab === 'comments' && (
              <UserComments user={user} />
            )}

            {/* Tema Sekmesi */}
            {activeTab === 'theme' && (
              <ProfileThemeSettings />
            )}
            
            {/* Ayarlar Sekmesi */}
            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <FiSettings />
                  <span className="ml-2">Hesap Ayarları</span>
                </h3>
                
                <div className="space-y-6">
                  {/* E-posta Değiştirme */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">E-posta Adresi</h4>
                    
                    <div className="flex items-center mb-4">
                      <FiMail className="text-gray-500 dark:text-gray-400 mr-3" />
                      <span className="text-gray-800 dark:text-gray-200">{user.email}</span>
                      
                      {user.emailVerified ? (
                        <span className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                          Doğrulanmış
                        </span>
                      ) : (
                        <span className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                          Doğrulanmamış
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Şu anda e-posta değiştirme özelliği aktif değildir. Bu özellik yakında eklenecektir.
                    </p>
                  </div>
                  
                  {/* Şifre Değiştirme */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Şifre Değiştir</h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Şifrenizi değiştirmek için aşağıdaki butona tıklayın. Size şifre sıfırlama bağlantısı içeren bir e-posta göndereceğiz.
                    </p>
                    
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                      onClick={() => alert('Bu özellik yakında eklenecektir.')}
                    >
                      Şifremi Sıfırla
                    </button>
                  </div>
                  
                  {/* Hesap Silme */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Hesabımı Sil</h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Hesabınızı sildiğinizde, tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                    </p>
                    
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                      onClick={() => alert('Bu özellik yakında eklenecektir.')}
                    >
                      Hesabımı Sil
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Admin için Yazıları Gösterme (Profil Sekmesinde) */}
            {activeTab === 'profile' && user.role === 'admin' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Son Yazılarım</h3>
                
                {loadingPosts ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                ) : userPosts.length > 0 ? (
                  <div className="space-y-4">
                    {userPosts.map(post => (
                      <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {post.createdAt?.toDate().toLocaleDateString('tr-TR')}
                              {post.published 
                                ? ' • Yayında' 
                                : ' • Taslak'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Link 
                              href={`/admin/duzenle/${post.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title="Düzenle"
                            >
                              <FiEdit />
                            </Link>
                            <Link 
                              href={`/blog/${post.slug}`}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                              title="Görüntüle"
                            >
                              <FiBookmark />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {userPosts.length > 0 && (
                      <div className="mt-4">
                        <Link 
                          href="/admin"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Tüm Yazılarımı Görüntüle →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Henüz hiç yazınız bulunmuyor.</p>
                    <Link 
                      href="/admin/yeni-yazi"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      İlk Yazını Oluştur
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}