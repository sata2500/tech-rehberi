// src/pages/sitemap.xml.js
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Sitemap = () => {
  // Bu bir Next.js API rotasıdır ve doğrudan bir sayfa oluşturmak için kullanılmaz
  return null;
};

export async function getServerSideProps({ res }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com';
  
  // Sabit sayfalar
  const staticPages = [
    '',
    '/blog',
    '/kategoriler',
    '/hakkimizda',
    '/iletisim',
  ];
  
  // Blog yazıları
  const postsQuery = query(collection(db, 'posts'));
  const postsSnapshot = await getDocs(postsQuery);
  const posts = postsSnapshot.docs
    .map(doc => doc.data())
    .filter(post => post.published);
  
  // Kategoriler
  const categoriesQuery = query(collection(db, 'categories'));
  const categoriesSnapshot = await getDocs(categoriesQuery);
  const categories = categoriesSnapshot.docs.map(doc => doc.data());
  
  // XML başlığı
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(page => {
      return `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('')}
  
  ${posts
    .map(post => {
      const lastmod = post.updatedAt 
        ? new Date(post.updatedAt.toDate()).toISOString() 
        : new Date().toISOString();
      
      return `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('')}
    
  ${categories
    .map(category => {
      return `
  <url>
    <loc>${baseUrl}/kategori/${category.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

  // HTTP başlıklarını ayarla
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default Sitemap;