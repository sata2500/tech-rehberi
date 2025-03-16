// src/pages/blog/[slug].js - Updated with social sharing integration
import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/SEO';
import { SchemaUtils } from '../../components/SEO';
import Link from 'next/link';
import Image from 'next/image';
import { 
  collection, getDocs, query, where, getDoc, doc,
  updateDoc, increment, limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiCalendar, FiEye, FiClock,
  FiBookmark, FiHeart, FiMessageCircle,
  FiTwitter, FiLinkedin
} from 'react-icons/fi';
// Yorum bileşenlerini içe aktar
import CommentList from '../../components/blog/CommentList';
import { getPostComments } from '../../lib/comment-helpers';
// Sosyal medya paylaşım bileşeni
import ShareTools from '../../components/blog/ShareTools';

export default function BlogPost({ post, author, category, relatedPosts, initialComments }) {
  const { user } = useAuth();
  const [viewIncremented, setViewIncremented] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  // Yorum sayısı durumu
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  
  // Yeni yorum eklendiğinde sayacı güncelle
  const handleCommentAdded = () => {
    setCommentCount(prev => prev + 1);
  };
  
  // Sayfa yüklendikten sonra görüntülenme sayısını client-side artır
  useEffect(() => {
    const incrementViewCount = async () => {
      if (!viewIncremented && post?.id) {
        try {
          const postRef = doc(db, 'posts', post.id);
          await updateDoc(postRef, {
            viewCount: increment(1)
          });
          setViewIncremented(true);
        } catch (error) {
          console.error('Görüntülenme sayısı artırılırken hata:', error);
        }
      }
    };
    
    incrementViewCount();
  }, [post?.id, viewIncremented]);

  // Kullanıcı etkileşim fonksiyonları (demo)
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Gerçek uygulamada burada kullanıcı kaydedilmiş yazıları veritabanına yazabiliriz
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    // Gerçek uygulamada burada beğeni sayısını artırabiliriz
  };

  // Yazı bulunamadığında hata durumu
  if (!post) {
    return (
      <Layout>
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Yazı bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Aradığınız yazıya şu anda ulaşılamıyor veya silinmiş olabilir.
          </p>
          <Link 
            href="/blog"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Tüm Yazılara Dön
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {/* Blog yazısı için SEO ve meta verileri */}
      <SEO
        title={post.title}
        description={post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '')}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.coverImage || ''}
        ogTitle={post.title}
        ogDescription={post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '')}
        publishedTime={post.createdAt}
        modifiedTime={post.updatedAt}
        articleSection={category?.name || 'Genel'}
        articleTags={post.tags || []}
        author={author?.displayName || 'Tech Rehberi'}
        twitterCard="summary_large_image"
        twitterCreator={author?.twitter || '@techrehberi'}
        keywords={post.tags || []}
        jsonLd={SchemaUtils.createBlogPostingSchema({
          title: post.title,
          description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, ''),
          image: post.coverImage || '',
          datePublished: post.createdAt,
          dateModified: post.updatedAt || post.createdAt,
          authorName: author?.displayName || 'Tech Rehberi',
          authorUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/yazar/${author?.username || 'admin'}`,
          publisherName: 'Tech Rehberi',
          publisherLogo: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
          keywords: post.tags || [],
          category: category?.name || ''
        })}
      />
      
      <Layout>
        <div className="bg-gray-50 dark:bg-gray-900 py-4">
          <div className="container mx-auto px-4">
            {/* Breadcrumb - Responsive */}
            <nav className="flex flex-wrap text-sm text-gray-500 dark:text-gray-400 mb-4">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Ana Sayfa
              </Link>
              <span className="mx-2">/</span>
              <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Blog
              </Link>
              {category && (
                <>
                  <span className="mx-2">/</span>
                  <Link 
                    href={`/kategori/${category.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {category.name}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px] sm:max-w-xs">
                {post.title}
              </span>
            </nav>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Mobil için yüzen paylaşım butonları */}
          <ShareTools 
            url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`} 
            title={post.title} 
            description={post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} 
            image={post.coverImage || ''}
            hashtags={post.tags?.join(',')}
            position="floating"
          />

          {/* Kapak Resmi - responsive özellikler */}
          {post.coverImage && (
            <div className="mb-6 sm:mb-8 rounded-lg overflow-hidden relative aspect-video shadow-lg">
              <Image
                src={post.coverImage}
                alt={post.title}
                layout="fill"
                objectFit="cover"
                priority
                className="w-full h-full"
              />
            </div>
          )}
          
          {/* Meta Bilgileri */}
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center">
              <FiCalendar className="mr-1" />
              <time dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            
            {category && (
              <>
                <span className="hidden sm:inline-block">•</span>
                <Link 
                  href={`/kategori/${category.slug}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors inline-flex items-center"
                >
                  {category.name}
                </Link>
              </>
            )}
            
            <span className="hidden sm:inline-block">•</span>
            <div className="flex items-center">
              <FiEye className="mr-1" />
              <span>{post.viewCount || 0} görüntülenme</span>
            </div>

            <span className="hidden sm:inline-block">•</span>
            <div className="flex items-center">
              <FiClock className="mr-1" />
              <span>{post.readingTime || '5 dk okuma'}</span>
            </div>
          </div>
          
          {/* Başlık */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            {post.title}
          </h1>
          
          {/* Yazar Bilgisi */}
          {author && (
            <div className="flex items-center mb-8 space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {author.photoURL ? (
                  <Image 
                    src={author.photoURL}
                    alt={author.displayName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {author.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{author.displayName}</p>
                {author.bio && <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{author.bio}</p>}
              </div>
            </div>
          )}
          
          {/* Desktop için sidebar ve içerik düzeni */}
          <div className="flex flex-col md:flex-row">
            {/* Desktop için sidebar paylaşım butonları */}
            <div className="hidden md:block">
              <ShareTools 
                url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`} 
                title={post.title} 
                description={post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} 
                image={post.coverImage || ''}
                hashtags={post.tags?.join(',')}
                position="sidebar"
              />
            </div>
            
            <div className="flex-1">
              {/* Etkileşim Butonları */}
              <div className="flex flex-wrap items-center mb-6 gap-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button 
                    onClick={toggleLike} 
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isLiked 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiHeart className={isLiked ? 'fill-current' : ''} />
                    <span>{post.likes || 0}</span>
                  </button>
                  
                  <button 
                    onClick={toggleBookmark}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isBookmarked 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiBookmark className={isBookmarked ? 'fill-current' : ''} />
                    <span className="hidden sm:inline">Kaydet</span>
                  </button>
                  
                  <Link 
                    href={`#yorumlar`}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiMessageCircle />
                    <span className="hidden sm:inline">Yorumlar</span> 
                    <span>({commentCount})</span>
                  </Link>
                </div>
              </div>
              
              {/* Sosyal Medya Paylaşım Araçları - Üst */}
              <ShareTools 
                url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`} 
                title={post.title} 
                description={post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} 
                image={post.coverImage || ''}
                hashtags={post.tags?.join(',')}
                position="top"
              />
              
              {/* İçerik - prose sınıfını responsive hale getir */}
              <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-lg prose-img:mx-auto max-w-none mb-12">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
              
              {/* Sosyal Medya Paylaşım Araçları - Alt */}
              <ShareTools 
                url={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`} 
                title={post.title} 
                description={post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} 
                image={post.coverImage || ''}
                hashtags={post.tags?.join(',')}
                position="bottom"
              />
            </div>
          </div>
          
          {/* Etiketler - responsive wrap */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Etiketler</h2>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Link 
                    key={tag}
                    href={`/etiket/${tag}`}
                    className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full text-sm transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Yazar Hakkında (Kapsamlı) */}
          {author && (
            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {author.photoURL ? (
                      <Image 
                        src={author.photoURL}
                        alt={author.displayName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xl font-medium">
                        {author.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {author.displayName}
                    </h3>
                    {author.bio && <p className="text-gray-600 dark:text-gray-300 mb-4">{author.bio}</p>}
                    <div className="flex justify-center sm:justify-start space-x-3">
                      {author.twitter && (
                        <a 
                          href={`https://twitter.com/${author.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1DA1F2] hover:text-[#1a94e0] transition-colors"
                        >
                          <FiTwitter size={20} />
                        </a>
                      )}
                      {author.linkedin && (
                        <a 
                          href={author.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0077b5] hover:text-[#006aa3] transition-colors"
                        >
                          <FiLinkedin size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* İlgili Yazılar */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">İlgili Yazılar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link 
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="block group h-full"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col transition-transform hover:-translate-y-1 duration-300">
                      {relatedPost.coverImage && (
                        <div className="aspect-video relative overflow-hidden">
                          <Image
                            src={relatedPost.coverImage}
                            alt={relatedPost.title}
                            layout="fill"
                            objectFit="cover"
                            className="group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-gray-900 dark:text-white">
                          {relatedPost.title}
                        </h3>
                        {relatedPost.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
                            {relatedPost.excerpt}
                          </p>
                        )}
                        <div className="mt-auto text-sm text-gray-500 dark:text-gray-400">
                          {new Date(relatedPost.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Yorumlar Bölümü - Yeni Entegrasyon */}
          <div id="yorumlar" className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Yorumlar ({commentCount})
            </h2>
            
            {/* Yorum Listesi Bileşeni */}
            <CommentList 
              postId={post.id}
              user={user}
              isAdmin={user?.role === 'admin'}
              initialComments={initialComments}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </article>
      </Layout>
    </>
  );
}

/**
 * getStaticProps - derleme zamanında sayfa verileri
 */
export async function getStaticProps({ params }) {
  try {
    // Parametrelerden slug'ı al
    const { slug } = params;
    
    // Firestore'dan slug'a göre yazı verilerini getir
    const postsQuery = query(
      collection(db, 'posts'),
      where('slug', '==', slug),
      where('published', '==', true)
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    
    if (postsSnapshot.empty) {
      return {
        notFound: true // Bu, 404 sayfasını gösterecek
      };
    }
    
    const postDoc = postsSnapshot.docs[0];
    const postData = {
      id: postDoc.id,
      ...postDoc.data()
    };
    
    // Firebase zaman damgalarını serileştirme için ISO dizelerine dönüştür
    if (postData.createdAt) {
      postData.createdAt = postData.createdAt.toDate().toISOString();
    }
    if (postData.updatedAt) {
      postData.updatedAt = postData.updatedAt.toDate().toISOString();
    }
    
    // Yazar verilerini al
    let authorData = null;
    if (postData.authorId) {
      const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
      if (authorDoc.exists()) {
        authorData = authorDoc.data();
      }
    }
    
    // Kategori verilerini al
    let categoryData = null;
    if (postData.categoryId) {
      const categoryDoc = await getDoc(doc(db, 'categories', postData.categoryId));
      if (categoryDoc.exists()) {
        categoryData = categoryDoc.data();
      }
    }
    
    // İlgili yazıları al
    let relatedPosts = [];
    if (postData.categoryId) {
      const relatedQuery = query(
        collection(db, 'posts'),
        where('categoryId', '==', postData.categoryId),
        where('published', '==', true),
        where('slug', '!=', slug),
        limit(3)
      );
      
      const relatedSnapshot = await getDocs(relatedQuery);
      
      relatedPosts = relatedSnapshot.docs.map(doc => {
        const data = doc.data();
        // Firebase zaman damgalarını ISO dizelerine dönüştür
        if (data.createdAt) {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt) {
          data.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return {
          id: doc.id,
          ...data
        };
      });
    }
    
    // Yazının ilk yorumlarını getir
    let initialComments = [];
    try {
      initialComments = await getPostComments(postDoc.id);
    } catch (error) {
      console.error('Yorumlar alınırken hata:', error);
      // Yorumlar alınamazsa devam et
    }
    
    // Verileri prop olarak döndür
    return {
      props: {
        post: postData,
        author: authorData,
        category: categoryData,
        relatedPosts,
        initialComments,
      },
      // Sayfayı her saat yeniden doğrula (ISR kullanarak)
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Yazı verileri alınırken hata:', error);
    return {
      notFound: true
    };
  }
}

/**
 * getStaticPaths - prerender edilecek sayfaları belirt
 */
export async function getStaticPaths() {
  try {
    // Yayınlanmış tüm yazıları al
    const postsQuery = query(
      collection(db, 'posts'),
      where('published', '==', true),
      limit(20) // Derleme zamanında en son 20 yazıyla sınırla
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    
    // Yazılara göre önceden oluşturmak istediğimiz yolları al
    const paths = postsSnapshot.docs.map(doc => ({
      params: { slug: doc.data().slug }
    }));
    
    // Derleme zamanında yalnızca bu yolları önceden oluşturacağız.
    // { fallback: 'blocking' }, diğer rotaların sunucuda oluşturulacağı anlamına gelir
    return { 
      paths, 
      fallback: 'blocking' // Kalan sayfaları ilk istek üzerine oluşturur
    };
  } catch (error) {
    console.error('getStaticPaths içinde hata:', error);
    return { paths: [], fallback: 'blocking' };
  }
}