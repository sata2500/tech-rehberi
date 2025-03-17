// src/pages/admin/kullanicilar.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from '../../components/admin/UserManagement';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Admin kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Admin değilse veya henüz yükleniyor ise
  if (authLoading || !user || user.role !== 'admin') {
    return (
      <Layout title="Yükleniyor...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kullanıcı Yönetimi - Admin Panel">
      <div className="mb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
        </div>
        
        <UserManagement />
      </div>
    </Layout>
  );
}