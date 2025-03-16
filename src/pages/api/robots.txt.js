// src/pages/api/robots.txt.js

/**
 * Ortama göre dinamik robots.txt dosyası oluşturur
 * Üretim ortamında normal taramaya izin verirken, test/geliştirme ortamında taramayı engeller
 */
export default function handler(req, res) {
    // Ortamın üretim mi yoksa geliştirme mi olduğunu belirle
    const isProduction = process.env.NODE_ENV === 'production';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com';
    
    // Hazırlık/geliştirme ortamları için tüm taramayı engelle
    const robotsTxt = isProduction 
      ? `# www.robotstxt.org
  
  User-agent: *
  Allow: /
  
  # Özel ve yönetici sayfalarına erişimi engelle
  Disallow: /admin/
  Disallow: /hesap/
  Disallow: /giris
  Disallow: /kayit
  Disallow: /_next/
  
  # Googlebot'un her şeyi görmesine izin ver
  User-agent: Googlebot
  Allow: /
  
  # Bingbot'un her şeyi görmesine izin ver
  User-agent: Bingbot
  Allow: /
  
  # Site haritası konumu
  Sitemap: ${siteUrl}/sitemap.xml
  
  # Ana Sunucu
  Host: ${siteUrl.replace(/^https?:\/\//, '')}`
      : `User-agent: *
  Disallow: /`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.write(robotsTxt);
    res.end();
  }