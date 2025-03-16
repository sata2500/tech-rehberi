// src/components/layout/Footer.js
import Link from 'next/link';
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Hakkımızda Bölümü */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-4">Tech Rehberi</h3>
            <p className="text-gray-300 mb-4">
              Teknoloji ve yazılım dünyasındaki en son gelişmeleri, ipuçlarını ve rehberleri keşfedin.
            </p>
          </div>

          {/* Hızlı Bağlantılar */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors inline-block py-1">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors inline-block py-1">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/kategoriler" className="text-gray-300 hover:text-white transition-colors inline-block py-1">
                  Kategoriler
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="text-gray-300 hover:text-white transition-colors inline-block py-1">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="text-gray-300 hover:text-white transition-colors inline-block py-1">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Sosyal Medya */}
          <div className="text-center lg:text-left">
            <h3 className="text-xl font-bold mb-4">Bizi Takip Edin</h3>
            <div className="flex justify-center lg:justify-start space-x-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="GitHub"
              >
                <FiGithub size={28} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Twitter"
              >
                <FiTwitter size={28} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="LinkedIn"
              >
                <FiLinkedin size={28} />
              </a>
              <a
                href="mailto:info@techrehberi.com"
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Email"
              >
                <FiMail size={28} />
              </a>
            </div>
          </div>
        </div>

        {/* Abone ol bölümü (yeni) */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-center">Bültenimize Abone Olun</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="E-posta adresiniz" 
                className="flex-1 px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap">
                Abone Ol
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {currentYear} Tech Rehberi. Tüm Hakları Saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}