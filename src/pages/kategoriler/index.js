// src/pages/kategoriler/index.js
import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiFolder, FiPlus } from 'react-icons/fi';

export default function Categories() {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kategorileri al
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('name')
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(categoriesData);
      } catch (error) {
        console.error('Kategoriler alınırken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  return (
    <Layout
      title="Kategoriler"
      description="Tech Rehberi blog kategorileri - İlgilendiğiniz konulara göre içerikleri keşfedin."
    >
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Kategoriler</h1>
          
          {user && user.role === 'admin' && (
            <Link 
              href="/admin" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiPlus className="mr-2" /> Kategori Ekle
            </Link>
          )}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div 
                key={index} 
                className="bg-gray-100 rounded-lg p-4 h-40 animate-pulse"
              ></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <Link 
                key={category.id} 
                href={`/kategori/${category.slug}`} 
                className="group"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200 h-full border border-gray-200">
                  {category.image ? (
                    <div className="h-40 overflow-hidden">
                      <image 
                        src={category.image} 
                        alt={category.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-blue-50 flex items-center justify-center">
                      <FiFolder className="text-5xl text-blue-500" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition duration-200">
                      {category.name}
                    </h2>
                    
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="text-blue-600 font-medium group-hover:text-blue-800 transition duration-200">
                      Bu kategorideki yazıları görüntüle →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Henüz Hiç Kategori Bulunmuyor
            </h2>
            <p className="text-gray-600 mb-4">
              İçeriklerimiz yakında kategorilerle daha düzenli hale gelecek.
            </p>
            
            {user && user.role === 'admin' && (
              <Link 
                href="/admin" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Kategori Ekle
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}