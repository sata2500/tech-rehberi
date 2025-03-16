// src/pages/iletisim.js
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useForm } from 'react-hook-form';
import { FiMail, FiMapPin, FiPhone, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Form gönderme
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Firestore'a iletişim formu verilerini ekle
      await addDoc(collection(db, 'contactMessages'), {
        ...data,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      
      // Form başarıyla gönderildi
      setSubmitSuccess(true);
      reset();
    } catch (error) {
      console.error('Form gönderilirken hata oluştu:', error);
      setSubmitError('Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="İletişim"
      description="Tech Rehberi ile iletişime geçin. Sorularınızı, önerilerinizi veya işbirliği tekliflerinizi bize iletin."
    >
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Bizimle İletişime Geçin</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* İletişim Bilgileri */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">İletişim Bilgilerimiz</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <FiMail className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">E-posta</h3>
                  <p className="text-gray-600">info@techrehberi.com</p>
                  <p className="text-gray-500 text-sm mt-1">7/24 yanıt veriyoruz</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <FiMapPin className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Adres</h3>
                  <p className="text-gray-600">
                    Tech Plaza, Kat 5<br />
                    Kozyatağı, İstanbul<br />
                    Türkiye
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 rounded-full p-3 mr-4">
                  <FiPhone className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Telefon</h3>
                  <p className="text-gray-600">+90 (505) 799 49 26</p>
                  <p className="text-gray-500 text-sm mt-1">Pazartesi - Cuma, 09:00 - 18:00</p>
                </div>
              </div>
            </div>
            
            {/* Sosyal Medya (Şimdilik Yer Tutucu) */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bizi Takip Edin</h3>
              <div className="flex space-x-4">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* İletişim Formu */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bize Mesaj Gönderin</h2>
            
            {/* Başarı Mesajı */}
            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6 flex items-start">
                <FiCheckCircle className="text-green-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium">Mesajınız İletildi!</h3>
                  <p className="mt-1 text-sm">
                    Mesajınız için teşekkür ederiz. En kısa sürede size geri dönüş yapacağız.
                  </p>
                </div>
              </div>
            )}
            
            {/* Hata Mesajı */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 flex items-start">
                <FiAlertCircle className="text-red-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium">Bir Hata Oluştu!</h3>
                  <p className="mt-1 text-sm">{submitError}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Adınız*
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Adınızı girmeniz gerekiyor.' })}
                  className={`block w-full rounded-md shadow-sm ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresiniz*
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { 
                    required: 'E-posta adresinizi girmeniz gerekiyor.',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir e-posta adresi giriniz.'
                    }
                  })}
                  className={`block w-full rounded-md shadow-sm ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Konu*
                </label>
                <input
                  type="text"
                  id="subject"
                  {...register('subject', { required: 'Konu girmeniz gerekiyor.' })}
                  className={`block w-full rounded-md shadow-sm ${errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mesajınız*
                </label>
                <textarea
                  id="message"
                  rows={5}
                  {...register('message', { required: 'Mesajınızı girmeniz gerekiyor.' })}
                  className={`block w-full rounded-md shadow-sm ${errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center justify-center disabled:bg-blue-300"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" /> Mesajı Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Harita (Yer tutucu olarak) */}
        <div className="bg-gray-200 rounded-lg h-80 flex items-center justify-center">
          <div className="text-center p-8">
            <FiMapPin className="text-gray-500 text-4xl mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Harita burada gösterilecek</p>
            <p className="text-gray-500 text-sm mt-2">
              Google Maps veya başka bir harita servisini entegre edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}