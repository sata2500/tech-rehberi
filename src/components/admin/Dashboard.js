// src/components/admin/Dashboard.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where, 
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FiEye, 
  FiUsers, 
  FiFileText, 
  FiMessageCircle,
  FiTrendingUp,
  FiCalendar,
  FiPlus
} from 'react-icons/fi';
import Link from 'next/link';

const StatCard = ({ icon, title, value, change, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-md bg-${color}-100`}>
          {icon}
        </div>
        {change && (
          <div className={`text-sm font-medium ${change > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
            <FiTrendingUp className={`mr-1 ${change < 0 && 'transform rotate-180'}`} />
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const ActivityItem = ({ type, user, content, time }) => {
  const getActivityIcon = () => {
    switch (type) {
      case 'comment':
        return <div className="p-2 bg-blue-100 rounded-full"><FiMessageCircle className="text-blue-500" /></div>;
      case 'post':
        return <div className="p-2 bg-green-100 rounded-full"><FiFileText className="text-green-500" /></div>;
      case 'user':
        return <div className="p-2 bg-purple-100 rounded-full"><FiUsers className="text-purple-500" /></div>;
      default:
        return <div className="p-2 bg-gray-100 rounded-full"><FiEye className="text-gray-500" /></div>;
    }
  };

  return (
    <div className="flex items-start mb-4">
      <div className="mr-3">
        {getActivityIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800 mb-1">
          <span className="font-medium">{user}</span> {content}
        </p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    views: 0,
    users: 0,
    comments: 0
  });
  
  const [weeklyStats, setWeeklyStats] = useState({
    posts: 0,
    views: 0,
    users: 0,
    comments: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Toplam yazı sayısı
        const postsQuery = query(collection(db, 'posts'));
        const postsSnapshot = await getDocs(postsQuery);
        const totalPosts = postsSnapshot.size;
        
        // Toplam görüntülenme
        const totalViews = postsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().viewCount || 0), 0);
        
        // Toplam kullanıcı sayısı
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const totalUsers = usersSnapshot.size;
        
        // Toplam yorum sayısı
        const commentsQuery = query(collection(db, 'comments'));
        const commentsSnapshot = await getDocs(commentsQuery);
        const totalComments = commentsSnapshot.size;
        
        setStats({
          posts: totalPosts,
          views: totalViews,
          users: totalUsers,
          comments: totalComments
        });
        
        // Son bir haftanın istatistikleri
        const oneWeekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        
        // Haftalık yazı sayısı
        const weeklyPostsQuery = query(
          collection(db, 'posts'),
          where('createdAt', '>=', oneWeekAgo)
        );
        const weeklyPostsSnapshot = await getDocs(weeklyPostsQuery);
        
        // Haftalık kullanıcı sayısı
        const weeklyUsersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', oneWeekAgo)
        );
        const weeklyUsersSnapshot = await getDocs(weeklyUsersQuery);
        
        // Haftalık yorum sayısı
        const weeklyCommentsQuery = query(
          collection(db, 'comments'),
          where('createdAt', '>=', oneWeekAgo)
        );
        const weeklyCommentsSnapshot = await getDocs(weeklyCommentsQuery);
        
        setWeeklyStats({
          posts: weeklyPostsSnapshot.size,
          views: 0, // Bu veriyi hesaplamak için ek bir sorgu gerekebilir
          users: weeklyUsersSnapshot.size,
          comments: weeklyCommentsSnapshot.size
        });
      } catch (error) {
        console.error('İstatistikler alınırken hata oluştu:', error);
      }
    };
    
    const fetchRecentActivity = () => {
      // Son yorumları dinle
      const commentsQuery = query(
        collection(db, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
        const commentsActivity = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'comment',
            user: data.authorName || 'Anonim Kullanıcı',
            content: `"${data.postTitle}" yazısına yorum yaptı`,
            time: data.createdAt?.toDate().toLocaleString('tr-TR') || 'Bilinmeyen tarih',
            timestamp: data.createdAt
          };
        });
        
        // Son yazıları dinle
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
          const postsActivity = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: 'post',
              user: data.authorName || 'Admin',
              content: `"${data.title}" başlıklı yeni bir yazı yayınladı`,
              time: data.createdAt?.toDate().toLocaleString('tr-TR') || 'Bilinmeyen tarih',
              timestamp: data.createdAt
            };
          });
          
          // Son kullanıcıları dinle
          const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          
          const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersActivity = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                type: 'user',
                user: data.displayName || data.email || 'Yeni Kullanıcı',
                content: 'siteye üye oldu',
                time: data.createdAt?.toDate().toLocaleString('tr-TR') || 'Bilinmeyen tarih',
                timestamp: data.createdAt
              };
            });
            
            // Tüm aktiviteleri birleştir, tarihe göre sırala ve ilk 10'unu al
            const allActivity = [...commentsActivity, ...postsActivity, ...usersActivity]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 10);
            
            setRecentActivity(allActivity);
            setLoading(false);
          });
          
          return () => {
            unsubComments();
            unsubPosts();
            unsubUsers();
          };
        });
      });
    };
    
    fetchStats();
    fetchRecentActivity();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Sol Bölüm - İstatistikler */}
      <div className="md:col-span-2 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Genel Bakış</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<FiFileText className="text-blue-500" />} 
            title="Toplam Yazı" 
            value={stats.posts} 
            change={stats.posts > 0 ? ((weeklyStats.posts / stats.posts) * 100).toFixed(1) : 0} 
            color="blue" 
          />
          <StatCard 
            icon={<FiEye className="text-green-500" />} 
            title="Görüntülenme" 
            value={stats.views} 
            color="green" 
          />
          <StatCard 
            icon={<FiUsers className="text-purple-500" />} 
            title="Kullanıcılar" 
            value={stats.users} 
            change={stats.users > 0 ? ((weeklyStats.users / stats.users) * 100).toFixed(1) : 0} 
            color="purple" 
          />
          <StatCard 
            icon={<FiMessageCircle className="text-yellow-500" />} 
            title="Yorumlar" 
            value={stats.comments} 
            change={stats.comments > 0 ? ((weeklyStats.comments / stats.comments) * 100).toFixed(1) : 0} 
            color="yellow" 
          />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Erişim</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/yeni-yazi" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition">
              <FiPlus className="text-blue-500 text-xl mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-800">Yeni Yazı</span>
            </Link>
            <Link href="/admin/yorumlar" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition">
              <FiMessageCircle className="text-purple-500 text-xl mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-800">Yorumlar</span>
            </Link>
            <Link href="/admin/kullanicilar" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition">
              <FiUsers className="text-green-500 text-xl mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-800">Kullanıcılar</span>
            </Link>
            <Link href="/admin/istatistikler" className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition">
              <FiTrendingUp className="text-yellow-500 text-xl mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-800">İstatistikler</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Takvim</h3>
            <Link href="/admin/yeni-yazi" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
              <FiCalendar className="mr-1" /> İçerik Planı
            </Link>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-center py-8">İçerik takvimi burada görünecek</p>
          </div>
        </div>
      </div>
      
      {/* Sağ Bölüm - Son Aktiviteler */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <ActivityItem 
                  key={index}
                  type={activity.type}
                  user={activity.user}
                  content={activity.content}
                  time={activity.time}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Henüz aktivite yok</p>
          )}
        </div>
      </div>
    </div>
  );
}