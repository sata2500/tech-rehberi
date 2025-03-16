// src/pages/hakkimizda.js
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { FiBookOpen, FiUsers, FiTrendingUp, FiTarget, FiCode } from 'react-icons/fi';

export default function About() {
  return (
    <Layout
      title="Hakkımızda"
      description="Tech Rehberi hakkında bilgi edinin. Misyonumuz, vizyonumuz ve değerlerimiz."
    >
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Bölümü */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">Hakkımızda</h1>
          
          {/* Hero Görseli (Yeni) */}
          <div className="relative h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden mb-8 shadow-lg">
            <Image
              src="/images/about-hero.jpg" 
              alt="Tech Rehberi Ekibi"
              layout="fill"
              objectFit="cover"
              className="w-full h-full"
              priority
            />
            {/* Alternatif: eğer resim yoksa renk geçişli arkaplan */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <h2 className="text-white text-2xl sm:text-3xl font-bold px-4 text-center">
                Teknoloji Dünyasında Rehberiniz
              </h2>
            </div>
          </div>
          
          {/* Hakkımızda İçeriği */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p>
              <strong>Tech Rehberi</strong>, 2025 yılında teknoloji ve yazılım dünyasındaki en güncel gelişmeleri, ipuçları ve rehberleri okuyucularımızla paylaşmak için kurulmuş bir blog platformudur. Amacımız, sektördeki karmaşık kavramları herkesin anlayabileceği şekilde aktarmak ve okuyucularımıza değer katmaktır.
            </p>
            
            <p>
              Günümüzde teknoloji her geçen gün gelişmekte ve hayatımızın her alanında daha fazla yer almaktadır. Bu hızlı değişim içerisinde güncel kalmak ve yeni teknolojileri takip etmek giderek zorlaşıyor. <strong>Tech Rehberi</strong> olarak misyonumuz, bu karmaşık dünyada okuyucularımıza rehberlik etmek ve teknoloji yolculuklarında onlara destek olmaktır.
            </p>
            
            <p>
              Platformumuzda yazılım geliştirme, web teknolojileri, mobil uygulamalar, yapay zeka, veri bilimi, siber güvenlik ve daha birçok teknik konuda içerikler bulabilirsiniz. Ayrıca, teknoloji dünyasındaki en son gelişmeleri ve haberleri de düzenli olarak paylaşıyoruz.
            </p>
            
            <p>
              Tech Rehberi&apos;ni özel kılan en önemli özellik, içeriklerin sektör profesyonelleri tarafından hazırlanması ve karmaşık konuların anlaşılır bir dille aktarılmasıdır. Amacımız sadece bilgi vermek değil, aynı zamanda okuyucularımızın bu bilgileri uygulamalarına ve kendi projelerinde kullanmalarına yardımcı olmaktır.
            </p>
          </div>
        </div>
        
        {/* Değerlerimiz Bölümü */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Değerlerimiz</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4 mr-4">
                  <FiBookOpen className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Eğitim Odaklı</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Karmaşık teknolojik kavramları herkesin anlayabileceği şekilde aktarmayı hedefliyoruz.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4 mr-4">
                  <FiUsers className="text-green-600 dark:text-green-400 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Topluluk Odaklı</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Teknoloji meraklıları ve profesyonelleri bir araya getirerek bilgi paylaşımını teşvik ediyoruz.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-4 mr-4">
                  <FiTrendingUp className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Güncel ve Doğru</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Teknoloji dünyasındaki en son gelişmeleri takip ediyor ve doğru bilgileri sunuyoruz.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 mr-4">
                  <FiTarget className="text-red-600 dark:text-red-400 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Uygulama Odaklı</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Teorik bilginin yanında pratik uygulamaları önemsiyoruz. İçeriklerimiz pratiğe dönüktür.
              </p>
            </div>
          </div>
        </div>
        
        {/* Ekibimiz Bölümü */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Ekibimiz</h2>
          
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Tech Rehberi, teknoloji ve yazılım alanında uzman bir ekip tarafından desteklenmektedir. Her bir ekip üyemiz, kendi uzmanlık alanlarında değerli içerikler üreterek platformumuza katkı sağlamaktadır.
          </p>
          
          {/* Ekip üyeleri burada listelenecek - daha estetik görünüm */}
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-inner">
            <div className="w-24 h-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <FiUsers className="text-gray-400 dark:text-gray-500 text-4xl" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Ekip üyeleri yakında burada listelenecek. Şu anda içerik oluşturma aşamasındayız.
            </p>
          </div>
        </div>
        
        {/* Katkıda Bulunma Bölümü */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 sm:p-8 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-full p-4 w-16 h-16 mx-auto mb-6 shadow-md flex items-center justify-center">
              <FiCode className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Katkıda Bulunmak İster misiniz?</h2>
            
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Tech Rehberi&apos;ne içerik üreterek katkıda bulunmak ister misiniz? Teknoloji ve yazılım alanında uzmanlığınızı paylaşmak için bizimle iletişime geçin.
            </p>
            
            <Link 
              href="/iletisim"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-block transition-colors"
            >
              Bizimle İletişime Geçin
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}