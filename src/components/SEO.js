// src/components/SEO.js
import Head from 'next/head';

/**
 * Geliştirilmiş SEO bileşeni: Arama motoru görünürlüğünü ve sosyal medya 
 * paylaşımlarını iyileştirmek için kapsamlı meta etiketler ve yapılandırılmış veri sağlar.
 *
 * Sosyal Medya Görsel Boyutları:
 * - Facebook/Instagram: 1200x630 piksel (1.91:1 oranı)
 * - Twitter: 1200x600 piksel (2:1 oranı)
 * - LinkedIn: 1200x627 piksel (1.91:1 oranı)
 * - Pinterest: 1000x1500 piksel (2:3 oranı)
 * - WhatsApp: 300x200 piksel (1.5:1 oranı)
 * 
 * Genel kullanım için: 1200x630 piksel boyutundaki görseller çoğu platform için uyumludur.
 */
export default function SEO({ 
  title, 
  description, 
  canonical, 
  ogType = 'website',
  ogImage,
  ogTitle,
  ogDescription,
  ogLocale = 'tr_TR',
  twitterCard = 'summary_large_image',
  twitterSite = '@techrehberi',
  twitterCreator,
  noindex = false,
  nofollow = false,
  jsonLd,
  alternateLanguages = [],
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  articleSection,
  articleTags,
  favicon = '/favicon.ico',
  themeColor = '#3B82F6', // Varsayılan mavi renk
  viewport = 'width=device-width, initial-scale=1, shrink-to-fit=no'
}) {
  // Site temel bilgileri
  const siteName = 'Tech Rehberi';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com';
  
  // Varsayılan değerler
  const pageTitle = title ? `${title} - ${siteName}` : siteName;
  const pageDescription = description || 'Tech Rehberi - Teknoloji ve yazılım hakkında güncel bilgiler, rehberler ve ipuçları.';
  const pageCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  
  // Open Graph
  const pageOgTitle = ogTitle || pageTitle;
  const pageOgDescription = ogDescription || pageDescription;
  const pageOgImage = ogImage || `${siteUrl}/images/og-default.png`;
  
  // Twitter
  const pageTwitterCreator = twitterCreator || twitterSite;
  
  // Meta robots
  const robots = [];
  if (noindex) robots.push('noindex');
  if (nofollow) robots.push('nofollow');
  const robotsContent = robots.length > 0 ? robots.join(', ') : 'index, follow';
  
  // JSON-LD yapılandırılmış veri dizi desteği (birden fazla şema öğesi kabul edebilir)
  const structuredData = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);

  return (
    <Head>
      {/* Temel Meta Etiketleri */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={robotsContent} />
      <meta name="author" content={author || siteName} />
      
      {/* Mobil Optimizasyonu */}
      <meta name="viewport" content={viewport} />
      <meta name="theme-color" content={themeColor} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Favicon */}
      <link rel="icon" href={favicon} />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageCanonical} />
      
      {/* Alternatif Diller */}
      {alternateLanguages.map((lang) => (
        <link 
          key={lang.hrefLang}
          rel="alternate" 
          hrefLang={lang.hrefLang} 
          href={lang.href} 
        />
      ))}
      
      {/* Open Graph Temel */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageCanonical} />
      <meta property="og:title" content={pageOgTitle} />
      <meta property="og:description" content={pageOgDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={ogLocale} />
      
      {/* Open Graph Image Dimensions (for Facebook) */}
      {ogImage && (
        <>
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={pageOgTitle} />
        </>
      )}
      
      {/* Facebook App ID (if you have one) */}
      {/* <meta property="fb:app_id" content="YOUR_FACEBOOK_APP_ID" /> */}
      
      {/* Pinterest Verification (if needed) */}
      {/* <meta name="p:domain_verify" content="YOUR_PINTEREST_VERIFICATION_CODE" /> */}
      
      {/* Open Graph Makale (uygulanabilirse) */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && articleSection && (
        <meta property="article:section" content={articleSection} />
      )}
      {ogType === 'article' && articleTags && articleTags.length > 0 && 
        articleTags.map((tag, index) => (
          <meta key={`article:tag:${index}`} property="article:tag" content={tag} />
        ))
      }
      {ogType === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={pageTwitterCreator} />
      <meta name="twitter:title" content={pageOgTitle} />
      <meta name="twitter:description" content={pageOgDescription} />
      <meta name="twitter:image" content={pageOgImage} />
      <meta name="twitter:image:alt" content={pageOgTitle} />
      <meta name="twitter:domain" content={siteUrl.replace(/^https?:\/\//, '')} />
      
      {/* Yapılandırılmış Veri (JSON-LD) */}
      {structuredData.map((data, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </Head>
  );
}

/**
 * Şema yardımcı fonksiyonları: Yaygın yapılandırılmış veri nesneleri oluşturmak için
 */
export const SchemaUtils = {
  // Breadcrumb (ekmek kırıntısı) şeması oluşturma
  createBreadcrumbSchema: (items) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    };
  },
  
  // BlogPosting şeması oluşturma
  createBlogPostingSchema: (post) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.description,
      'image': post.image || '',
      'datePublished': post.datePublished,
      'dateModified': post.dateModified || post.datePublished,
      'author': {
        '@type': 'Person',
        'name': post.authorName,
        'url': post.authorUrl
      },
      'publisher': {
        '@type': 'Organization',
        'name': post.publisherName || 'Tech Rehberi',
        'logo': {
          '@type': 'ImageObject',
          'url': post.publisherLogo || 'https://techrehberi.com/images/logo.png'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': post.url
      },
      'keywords': post.keywords,
      'articleSection': post.category
    };
  },
  
  // Organization (kuruluş) şeması oluşturma
  createOrganizationSchema: (org) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': org.name,
      'url': org.url,
      'logo': org.logoUrl,
      'sameAs': org.socialProfiles,
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'telephone': org.telephone,
          'contactType': 'customer service',
          'email': org.email
        }
      ]
    };
  },
  
  // Yerel SEO için LocalBusiness şeması oluşturma
  createLocalBusinessSchema: (business) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': business.name,
      'image': business.image,
      'url': business.url,
      'telephone': business.telephone,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': business.address.street,
        'addressLocality': business.address.locality,
        'addressRegion': business.address.region,
        'postalCode': business.address.postalCode,
        'addressCountry': business.address.country
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': business.geo.latitude,
        'longitude': business.geo.longitude
      },
      'openingHoursSpecification': business.openingHours.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': hours.dayOfWeek,
        'opens': hours.opens,
        'closes': hours.closes
      }))
    };
  },
  
  // SSS (FAQ) şeması oluşturma
  createFAQSchema: (faqs) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
  },
  
  // Makale şeması oluşturma (BlogPosting'den daha genel)
  createArticleSchema: (article) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.title,
      'description': article.description,
      'image': article.image,
      'datePublished': article.datePublished,
      'dateModified': article.dateModified || article.datePublished,
      'author': {
        '@type': 'Person',
        'name': article.authorName
      },
      'publisher': {
        '@type': 'Organization',
        'name': article.publisherName,
        'logo': {
          '@type': 'ImageObject',
          'url': article.publisherLogo
        }
      }
    };
  },
  
  // WebPage şeması oluşturma
  createWebPageSchema: (page) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': page.title,
      'description': page.description,
      'url': page.url,
      'datePublished': page.datePublished,
      'dateModified': page.dateModified,
      'breadcrumb': page.breadcrumb ? {
        '@type': 'BreadcrumbList',
        'itemListElement': page.breadcrumb
      } : undefined
    };
  }
};