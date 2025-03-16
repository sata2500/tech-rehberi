// src/pages/index.js
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO'; // SEO bileşenini içe aktarıyoruz
import { SchemaUtils } from '../components/SEO'; // Şema yardımcılarını içe aktarıyoruz
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // En son yazıları ve kategorileri al
  useEffect(() => {
    const fetchData = async () => {
      try {
        // En son 6 yazıyı al
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeaturedPosts(postsData);

        // Kategorileri al
        const categoriesQuery = query(
          collection(db, 'categories'),
          limit(10)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Veriler alınırken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Ana sayfa için schema.org yapılandırılmış verisi oluştur
  const homePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'url': process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com',
    'name': 'Tech Rehberi',
    'description': 'Teknoloji ve yazılım dünyasındaki en son gelişmeleri, ipuçlarını ve rehberleri keşfedin.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com'}/arama?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
  
  // Daha iyi marka varlığı için kuruluş şeması oluştur
  const organizationSchema = SchemaUtils.createOrganizationSchema({
    name: 'Tech Rehberi',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com',
    logoUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com'}/images/logo.png`,
    socialProfiles: [
      'https://facebook.com/techrehberi',
      'https://twitter.com/techrehberi',
      'https://instagram.com/techrehberi',
      'https://linkedin.com/company/techrehberi'
    ],
    telephone: '+901234567890', // Gerçek telefon numarası ile değiştirin
    email: 'iletisim@techrehberi.com' // Gerçek e-posta ile değiştirin
  });

  return (
    <>
      {/* Ana sayfa için özel SEO: anahtar kelimeler ve yapılandırılmış veri ile */}
      <SEO
        title="Ana Sayfa"
        description="Tech Rehberi - Teknoloji ve yazılım dünyasındaki en son gelişmeleri, ipuçlarını ve rehberleri keşfedin."
        canonical="/"
        ogType="website"
        keywords={[
          'teknoloji rehberi', 'yazılım rehberi', 'tech blog',
          'programlama', 'kodlama', 'web geliştirme', 'mobil uygulama',
          'teknoloji haberleri', 'yazılım geliştirme', 'teknoloji ipuçları'
        ]}
        ogImage={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://techrehberi.com'}/images/home-og.png`}
        twitterCard="summary_large_image"
        jsonLd={[homePageSchema, organizationSchema]}
      />
      
      <Layout>
        {/* Hero Section */}
        <section className="bg-blue-50 rounded-lg p-8 mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tech Rehberi
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Teknoloji ve yazılım dünyasındaki en son gelişmeleri, ipuçlarını ve rehberleri keşfedin.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/blog" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Blog Yazıları
              </Link>
              <Link 
                href="/kategoriler" 
                className="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-6 py-3 rounded-md font-medium"
              >
                Kategoriler
              </Link>
            </div>
          </div>
        </section>

        {/* Diğer bileşenler aynı kalır */}
        {/* Öne Çıkan Yazılar */}
        <section className="mb-12">
          {/* Öne çıkan yazılar içeriği */}
        </section>

        {/* Kategoriler */}
        <section className="mb-12">
          {/* Kategoriler içeriği */}
        </section>

        {/* Bülten */}
        <section className="bg-gray-100 rounded-lg p-8">
          {/* Bülten içeriği */}
        </section>
      </Layout>
    </>
  );
}