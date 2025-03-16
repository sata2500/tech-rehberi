// src/pages/500.js
import Layout from '../components/layout/Layout';
import Link from 'next/link';

export default function Custom500() {
  return (
    <Layout 
      title="Sunucu Hatası" 
      description="Bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin."
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-9xl font-bold text-red-600 mb-4">500</h1>
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Sunucu Hatası</h2>
        <p className="text-lg text-gray-600 max-w-md mb-8">
          Bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin veya ana sayfaya dönün.
        </p>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Sayfayı Yenile
          </button>
          <Link 
            href="/"
            className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-6 py-3 rounded-md font-medium"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </Layout>
  );
}