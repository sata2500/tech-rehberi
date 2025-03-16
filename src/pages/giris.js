// src/pages/giris.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // Başarılı giriş sonrası yönlendirme auth context'te otomatik yapılacak
    } catch (error) {
      console.error('Giriş sırasında hata:', error);
      alert('Giriş yapılırken bir hata oluştu: ' + error.message);
    }
  };

  return (
    <Layout
      title="Giriş Yap"
      description="Tech Rehberi hesabınıza giriş yapın ve en son blog yazılarına erişin."
    >
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6 md:p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Giriş Yap
        </h1>

        <div className="mb-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md py-3 px-4 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FcGoogle className="text-xl" />
            Google ile Giriş Yap
          </button>
        </div>

        <div className="relative flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-600">veya</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* E-posta/Şifre Girişi (Daha sonra eklenebilir) */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="ornek@email.com"
                disabled={true}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                id="password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="••••••••"
                disabled={true}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={true}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Beni hatırla
              </label>
            </div>

            <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
              Şifremi unuttum
            </a>
          </div>

          <button
            type="button"
            className="w-full bg-gray-300 text-gray-700 rounded-md py-2 px-4 mt-4"
            disabled={true}
          >
            Giriş Yap
          </button>
        </div>

        <div className="flex items-center justify-center mt-8 p-4 bg-blue-50 rounded-md text-sm">
          <FiAlertCircle className="text-blue-500 mr-2" />
          <span className="text-blue-800">
            Şu anda yalnızca Google ile giriş aktif. E-posta/şifre girişi yakında eklenecek.
          </span>
        </div>
      </div>
    </Layout>
  );
}