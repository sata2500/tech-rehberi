// src/pages/admin/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiGrid, 
  FiFileText, 
  FiUsers, 
  FiMessageCircle, 
  FiTrendingUp, 
  FiSettings,
  FiPlus
} from 'react-icons/fi';

// Admin bileşenleri
import Dashboard from '../../components/admin/Dashboard';
import Statistics from '../../components/admin/Statistics';
import UserManagement from '../../components/admin/UserManagement';
import ContentManagement from '../../components/admin/ContentManagement';
import CommentManagement from '../../components/admin/CommentManagement';
import Settings from '../../components/admin/Settings';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Aktif sekme
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Admin kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Tab içeriğini göster
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'content':
        return <ContentManagement />;
      case 'users':
        return <UserManagement />;
      case 'comments':
        return <CommentManagement />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

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
    <Layout title="Admin Panel">
      <div className="mb-12 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin/yeni-yazi" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiPlus className="mr-2" /> Yeni Yazı Ekle
            </Link>
          </div>
        </div>
        
        {/* Sekmeler */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto pb-1">
            <button
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-t-md ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              <FiGrid className="mr-2" /> Gösterge Paneli
            </button>
            <button
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-t-md ${
                activeTab === 'content' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('content')}
            >
              <FiFileText className="mr-2" /> İçerik Yönetimi
            </button>
            <button
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-t-md ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <FiUsers className="mr-2" /> Kullanıcı Yönetimi
            </button>
            <button
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-t-md ${
                activeTab === 'comments' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('comments')}
            >
              <FiMessageCircle className="mr-2" /> Yorum Yönetimi
            </button>
            <button
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-t-md ${
                activeTab === 'statistics' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('statistics')}
            >
              <FiTrendingUp className="mr-2" /> İstatistikler
            </button>
            <button
              className={`px-4 py-2 flex items-center text-sm font-medium rounded-t-md ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              <FiSettings className="mr-2" /> Ayarlar
            </button>
          </div>
        </div>
        
        {/* Sekme İçeriği */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
}