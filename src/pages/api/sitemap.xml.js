// src/pages/api/sitemap.xml.js
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * Firestore'daki içeriğe dayalı dinamik bir site haritası oluşturur
 * Bu, arama motorlarının tüm sayfalarınızı keşfetmesine yardımcı olur
 */
const generateSiteMap = (posts, categories, authors) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      <!-- Ana Sayfalar -->
      <url>
        <loc>${siteUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${siteUrl}/blog</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      <url>
        <loc>${siteUrl}/kategoriler</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${siteUrl}/hakkimizda</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
      </url>
      <url>
        <loc>${siteUrl}/iletisim</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
      </url>
      
      <!-- Kategori Sayfaları -->
      ${categories
        .map(category => {
          return `
            <url>
              <loc>${siteUrl}/kategori/${category.slug}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.7</priority>
            </url>
          `;
        })
        .join('')}
        
      <!-- Yazar Sayfaları -->
      ${authors
        .map(author => {
          return `
            <url>
              <loc>${siteUrl}/yazar/${author.username || author.id}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.6</priority>
            </url>
          `;
        })
        .join('')}
        
      <!-- Blog Yazıları -->
      ${posts
        .map(post => {
          // Varsa görseli site haritasına ekle
          const imageTag = post.coverImage 
            ? `<image:image>
                <image:loc>${post.coverImage}</image:loc>
                <image:title>${post.title}</image:title>
              </image:image>` 
            : '';
            
          // Yeni yazılar için (son 2 gün) haber site haritası etiketlerini ekle
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          
          const postDate = post.updatedAt?.toDate() || post.createdAt?.toDate();
          const isRecent = postDate && postDate > twoDaysAgo;
          
          const newsTag = isRecent
            ? `<news:news>
                <news:publication>
                  <news:name>Tech Rehberi</news:name>
                  <news:language>tr</news:language>
                </news:publication>
                <news:publication_date>${postDate.toISOString()}</news:publication_date>
                <news:title>${post.title}</news:title>
              </news:news>`
            : '';
            
          return `
            <url>
              <loc>${siteUrl}/blog/${post.slug}</loc>
              <lastmod>${postDate ? postDate.toISOString() : new Date().toISOString()}</lastmod>
              <changefreq>monthly</changefreq>
              <priority>0.6</priority>
              ${imageTag}
              ${newsTag}
            </url>
          `;
        })
        .join('')}
    </urlset>
  `;
};

export default async function handler(req, res) {
  try {
    // Yayınlanmış tüm yazıları getir
    const postsQuery = query(
      collection(db, 'posts'),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    const posts = postsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
      
    // Tüm kategorileri getir
    const categoriesQuery = query(collection(db, 'categories'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categories = categoriesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    // Tüm yazarları getir (yazarların users koleksiyonunda saklandığını varsayıyoruz)
    const authorsQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'author'])
    );
    const authorsSnapshot = await getDocs(authorsQuery);
    const authors = authorsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    // Site haritası oluştur
    const sitemap = generateSiteMap(posts, categories, authors);
    
    // Uygun başlıkları ayarla
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=1200, stale-while-revalidate=600');
    
    // Site haritası XML'ini gönder
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Site haritası oluşturulurken hata:', error);
    res.status(500).json({ error: 'Site haritası oluşturulurken hata' });
  }
}