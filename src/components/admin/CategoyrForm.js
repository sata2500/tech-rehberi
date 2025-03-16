// src/components/admin/CategoryForm.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CategoryForm({ categoryId }) {
  const router = useRouter();
  const isEditMode = !!categoryId;
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Kategori verisini yükle (düzenleme modu için)
  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId) return;
      
      setIsLoading(true);
      
      try {
        const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
        
        if (categoryDoc.exists()) {
          const categoryData = categoryDoc.data();
          setFormData({
            name: categoryData.name || '',
            slug: categoryData.slug || '',
            description: categoryData.description || '',
          });
        } else {
          setErrors({ general: 'Kategori bulunamadı.' });
          router.push('/admin/kategoriler');
        }
      } catch (error) {
        console.error('Kategori yüklenirken hata oluştu:', error);
        setErrors({ general: 'Kategori yüklenirken bir hata oluştu.' });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isEditMode) {
      loadCategory();
    }
  }, [categoryId, isEditMode, router]);
  
  // Form alanı değişikliği işleyicisi
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Slug alanını otomatik olarak güncelle
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        slug: value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      }));
    }
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Form doğrulama
  const validateForm = async () => {
    const newErrors = {};
    
    // Gerekli alanları kontrol et
    if (!formData.name.trim()) {
      newErrors.name = 'Kategori adı zorunludur.';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Kategori slug\'ı zorunludur.';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug sadece küçük harfler, rakamlar ve tire (-) içerebilir.';
    }
    
    // Slug benzersizliğini kontrol et (düzenleme modunda, kendi slug'ı hariç)
    if (formData.slug && !newErrors.slug) {
      try {
        const slugQuery = query(
          collection(db, 'categories'),
          where('slug', '==', formData.slug)
        );
        
        const querySnapshot = await getDocs(slugQuery);
        
        const isSlugExists = querySnapshot.docs.some(doc => {
          // Düzenleme modunda, kendi kimliği hariç kontrol et
          return isEditMode ? doc.id !== categoryId : true;
        });
        
        if (isSlugExists) {
          newErrors.slug = 'Bu slug zaten kullanılıyor. Lütfen başka bir slug seçin.';
        }
      } catch (error) {
        console.error('Slug kontrolü sırasında hata:', error);
        newErrors.general = 'Slug kontrolü sırasında bir hata oluştu.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Form gönderme işleyicisi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      const isValid = await validateForm();
      
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }
      
      if (isEditMode) {
        // Kategoriyi güncelle
        const categoryRef = doc(db, 'categories', categoryId);
        
        await updateDoc(categoryRef, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          updatedAt: serverTimestamp()
        });
        
        setSuccessMessage('Kategori başarıyla güncellendi.');
      } else {
        // Yeni kategori oluştur
        const newCategoryRef = await addDoc(collection(db, 'categories'), {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Kategori ID'sini kategori belgesine ekle
        await updateDoc(newCategoryRef, {
          id: newCategoryRef.id
        });
        
        setSuccessMessage('Kategori başarıyla oluşturuldu.');
        
        // Formu sıfırla (isteğe bağlı)
        setFormData({
          name: '',
          slug: '',
          description: ''
        });
      }
      
      // Başarı mesajını gösterdikten sonra kategoriler sayfasına yönlendir
      setTimeout(() => {
        router.push('/admin/kategoriler');
      }, 1500);
      
    } catch (error) {
      console.error('Kategori kaydedilirken hata oluştu:', error);
      setErrors({ general: 'Kategori kaydedilirken bir hata oluştu.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        {isEditMode ? 'Kategori Düzenle' : 'Yeni Kategori Oluştur'}
      </h2>
      
      {/* Hata Mesajı */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}
      
      {/* Başarı Mesajı */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 flex items-start">
          <FiCheck className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Kategori Formu */}
      <form onSubmit={handleSubmit}>
        {/* Kategori Adı */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategori Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isSubmitting}
            placeholder="Örn. Teknoloji"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>
        
        {/* Kategori Slug */}
        <div className="mb-4">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.slug ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isSubmitting}
            placeholder="Örn. teknoloji"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            URL'de görünecek benzersiz tanımlayıcı. Sadece küçük harfler, rakamlar ve tire (-) içerebilir.
          </p>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug}</p>
          )}
        </div>
        
        {/* Kategori Açıklaması */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Açıklama <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(isteğe bağlı)</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isSubmitting}
            placeholder="Bu kategorinin kısa bir açıklaması"
          />
        </div>
        
        {/* Form Butonları */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/kategoriler')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            İptal
          </button>
          
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Kaydediliyor...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                {isEditMode ? 'Güncelle' : 'Kaydet'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}