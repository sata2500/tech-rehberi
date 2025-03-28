// src/pages/admin/duzenle/[id].js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import PostForm from '../../../components/admin/PostForm';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function EditPost() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  // Admin kontrolü
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || !id) {
    return (
      <Layout title="Yükleniyor...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Yazı Düzenle">
      <div className="mb-12 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mr-4">
            <FiArrowLeft className="inline-block mr-1" /> Admin Paneline Dön
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Yazı Düzenle</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <PostForm postId={id} />
        </div>
      </div>
    </Layout>
  );
}