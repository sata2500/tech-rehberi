// src/pages/404.js
import Layout from '../components/layout/Layout';
import Link from 'next/link';

export default function Custom404() {
  return (
    <Layout 
      title="Sayfa Bulunamadı" 
      description="Aradığınız sayfa bulunamadı. Tech Rehberi'ne geri dönün ve diğer içerikleri keşfedin."
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Sayfa Bulunamadı</h2>
        <p className="text-lg text-gray-600 max-w-md mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönün ve diğer içerikleri keşfedin.
        </p>
        <div className="space-x-4">
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Ana Sayfaya Dön
          </Link>
          <Link 
            href="/blog"
            className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-6 py-3 rounded-md font-medium"
          >
            Blog Yazılarına Git
          </Link>
        </div>
      </div>
    </Layout>
  );
}