import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        {/* PWA için gerekli meta etiketleri */}
        <meta name='application-name' content='Tech Rehberi' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Tech Rehberi' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-TileColor' content='#3B82F6' />
        <meta name='msapplication-tap-highlight' content='no' />
        
        {/* Web App Manifest bağlantısı */}
        <link rel='manifest' href='/manifest.json' />
        
        {/* iOS için simge bağlantıları */}
        <link rel='apple-touch-icon' href='/icons/apple-touch-icon-120x120.png' />
        <link rel='apple-touch-icon' sizes='152x152' href='/icons/apple-touch-icon-152x152.png' />
        <link rel='apple-touch-icon' sizes='180x180' href='/icons/apple-touch-icon-180x180.png' />
        
        {/* Windows için simge bağlantıları */}
        <link rel='icon' type='image/png' sizes='32x32' href='/icons/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/icons/favicon-16x16.png' />
        <link rel='shortcut icon' href='/favicon.ico' />
        
        {/* Microsoft Tiles için meta etiketleri */}
        <meta name='msapplication-config' content='/browserconfig.xml' />
      </Head>
      <body className="antialiased">
        {/* Erken tema belirleme scripti - sayfa yüklenmeden önce çalışır */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Tema tercihini belirle
                  var storedTheme = localStorage.getItem('theme');
                  var theme = storedTheme;

                  // localStorage'da tema yoksa sistem tercihine bak
                  if (!theme && window.matchMedia) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark'
                      : 'light';
                  }

                  // Varsayılan tema light
                  if (!theme) theme = 'light';

                  // HTML elemanına data-theme ve dark class (gerekirse) ekle
                  var root = document.documentElement;
                  root.setAttribute('data-theme', theme);
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                } catch (e) {
                  // localStorage erişim hatası olabilir, varsayılan temayı kullan
                  console.error('Tema belirleme hatası:', e);
                }
              })();
            `,
          }}
          // Erken yüklenmesi ve kritik render engellemesini önleme
          strategy="beforeInteractive"
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}