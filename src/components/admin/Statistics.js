// src/components/admin/Statistics.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Statistics() {
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'year'
  const [viewData, setViewData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewData = async () => {
      try {
        setLoading(true);
        
        // Zaman aralığına göre tarih hesapla
        const now = new Date();
        let startDate;
        let interval;
        let format;
        
        switch(timeRange) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            interval = 'hour';
            format = 'HH:mm';
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            interval = 'day';
            format = 'dd/MM';
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            interval = 'day';
            format = 'dd/MM';
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            interval = 'month';
            format = 'MM/yyyy';
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            interval = 'day';
            format = 'dd/MM';
        }
        
        const firestoreStartDate = Timestamp.fromDate(startDate);
        
        // Görüntülenme verilerini al
        // Not: Gerçek uygulamada, görüntülenmelerin zamanla ilgili verilerini tutmanız gerekecek
        // Bu örnekte, örnek verilerle dolduruyoruz
        
        // Zaman aralığını periyodlara böl
        const periods = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= now) {
          periods.push(new Date(currentDate));
          
          if (interval === 'hour') {
            currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
          } else if (interval === 'day') {
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          } else if (interval === 'month') {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
          }
        }
        
        // Örnek görüntülenme verileri oluştur
        const mockViewData = periods.map((date) => {
          return {
            date: date.toLocaleDateString('tr-TR', { 
              day: '2-digit', 
              month: '2-digit',
              year: interval === 'month' ? 'numeric' : undefined,
              hour: interval === 'hour' ? '2-digit' : undefined,
              minute: interval === 'hour' ? '2-digit' : undefined
            }),
            views: Math.floor(Math.random() * 500) + 100,
            uniqueVisitors: Math.floor(Math.random() * 300) + 50,
          };
        });
        
        setViewData(mockViewData);
        
        // Örnek etkileşim verileri oluştur
        const mockEngagementData = periods.map((date) => {
          return {
            date: date.toLocaleDateString('tr-TR', { 
              day: '2-digit', 
              month: '2-digit',
              year: interval === 'month' ? 'numeric' : undefined,
              hour: interval === 'hour' ? '2-digit' : undefined,
              minute: interval === 'hour' ? '2-digit' : undefined
            }),
            comments: Math.floor(Math.random() * 20),
            likes: Math.floor(Math.random() * 50) + 10,
          };
        });
        
        setEngagementData(mockEngagementData);
        
        // En popüler yazıları al
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('viewCount', 'desc'),
          limit(5)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        const popularPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          viewCount: doc.data().viewCount || 0,
          commentCount: doc.data().commentCount || 0,
          likeCount: doc.data().likeCount || 0
        }));
        
        setTopPosts(popularPosts);
        
        // En popüler kategorileri al
        // Not: Kategorilerin görüntülenme sayısını tutmanız gerekecek
        // Bu örnekte, örnek kategorilerle dolduruyoruz
        const categoriesQuery = query(
          collection(db, 'categories'),
          limit(5)
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        const categories = categoriesSnapshot.docs.map((doc, index) => ({
          id: doc.id,
          name: doc.data().name,
          viewCount: Math.floor(Math.random() * 1000) + 500,
        }));
        
        setTopCategories(categories);
        
        setLoading(false);
      } catch (error) {
        console.error('İstatistikler alınırken hata oluştu:', error);
        setLoading(false);
      }
    };
    
    fetchViewData();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Site İstatistikleri</h2>
        
        <div className="flex bg-gray-100 rounded-md">
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${timeRange === 'day' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTimeRange('day')}
          >
            Günlük
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTimeRange('week')}
          >
            Haftalık
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTimeRange('month')}
          >
            Aylık
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium rounded-md ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTimeRange('year')}
          >
            Yıllık
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4 h-80 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 h-80 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 h-80 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 h-80 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Görüntülenme Grafiği */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Görüntülenme İstatistikleri</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={viewData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="uniqueVisitors" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Etkileşim Grafiği */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Etkileşim İstatistikleri</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={engagementData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="comments" fill="#8884d8" />
                  <Bar dataKey="likes" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* En Popüler İçerikler */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">En Popüler İçerikler</h3>
            {topPosts.length > 0 ? (
              <div className="space-y-4">
                {topPosts.map((post, index) => (
                  <div key={post.id} className="flex items-center">
                    <div className="bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{post.title}</h4>
                      <div className="flex text-xs text-gray-500">
                        <span className="mr-4">{post.viewCount} görüntülenme</span>
                        <span className="mr-4">{post.commentCount} yorum</span>
                        <span>{post.likeCount} beğeni</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Henüz veri yok</p>
            )}
          </div>
          
          {/* En Popüler Kategoriler */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kategori Dağılımı</h3>
            {topCategories.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="viewCount"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Henüz veri yok</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}