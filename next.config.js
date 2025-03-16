// next.config.js
const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',  // Geliştirme ortamında devre dışı bırak
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        // API istekleri için cache-first stratejisi
        urlPattern: /^https:\/\/techrehberi\.com\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24  // 24 saat
          },
          networkTimeoutSeconds: 10
        }
      },
      {
        // Makaleler için cache-first stratejisi
        urlPattern: /^https:\/\/techrehberi\.com\/makaleler\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'posts-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7  // 7 gün
          }
        }
      },
      {
        // Görseller için cache-first stratejisi
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30  // 30 gün
          }
        }
      },
      {
        // Statik varlıklar için cache-first stratejisi
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7  // 7 gün
          }
        }
      },
      {
        // Google Fonts için cache-first stratejisi
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365  // 1 yıl
          }
        }
      },
      {
        // Diğer tüm istekler için
        urlPattern: /.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'others',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24  // 24 saat
          },
          networkTimeoutSeconds: 10
        }
      }
    ]
  });
  
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
      formats: ['image/webp', 'image/avif'], // Modern görsel formatlarını etkinleştir
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Duyarlı boyutlandırma için cihaz genişlikleri
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Daha küçük görseller için boyutlar
      minimumCacheTTL: 60 * 60 * 24, // Görsel önbelleği - 1 gün (saniye cinsinden)
      dangerouslyAllowSVG: true, // SVG görsellerini işlemeye izin ver (gerekirse)
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // SVG güvenliği için CSP
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'firebasestorage.googleapis.com',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
          pathname: '/**',
        },
      ], // Güvenlik için daha ayrıntılı domain yapılandırması
    },
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com',
    },
    i18n: {
      locales: ['tr'],
      defaultLocale: 'tr',
    },
    // Sayfa yükleme performansını artırmak için
    swcMinify: true, // Daha hızlı minification
    compiler: {
      // Gereksiz console.log ifadelerini kaldır (production ortamında)
      removeConsole: process.env.NODE_ENV === 'production' ? {
        exclude: ['error', 'warn'],
      } : false,
    },
    
    // SEO için sitemap.xml ve robots.txt API rotalarını yeniden yönlendir
    async rewrites() {
      return [
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap.xml',
        },
        {
          source: '/robots.txt',
          destination: '/api/robots.txt',
        },
      ];
    },
  }
  
  module.exports = withPWA(nextConfig);