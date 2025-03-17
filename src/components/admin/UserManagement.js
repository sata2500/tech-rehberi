// src/components/admin/UserManagement.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  updateDoc, 
  where,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiUserCheck, 
  FiUserX,
  FiDownload,
  FiFilter,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiEye
} from 'react-icons/fi';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userActivities, setUserActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [viewUserModalOpen, setViewUserModalOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  const USERS_PER_PAGE = 10;

  // Kullanıcıları getir
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(USERS_PER_PAGE)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
          setUsers([]);
          setFilteredUsers([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
        
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLastVisible(usersSnapshot.docs[usersSnapshot.docs.length - 1]);
        setHasMore(usersSnapshot.docs.length === USERS_PER_PAGE);
        setLoading(false);
      } catch (error) {
        console.error('Kullanıcılar alınırken hata oluştu:', error);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filtreleme ve arama
  useEffect(() => {
    if (searchTerm === '' && roleFilter === 'all') {
      setFilteredUsers(users);
      return;
    }
    
    let filtered = users;
    
    if (searchTerm !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(term)) || 
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  // Daha fazla kullanıcı yükle
  const loadMoreUsers = async () => {
    if (!hasMore || !lastVisible) return;
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(USERS_PER_PAGE)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        setHasMore(false);
        return;
      }
      
      const newUsersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(prevUsers => [...prevUsers, ...newUsersData]);
      setLastVisible(usersSnapshot.docs[usersSnapshot.docs.length - 1]);
      setHasMore(usersSnapshot.docs.length === USERS_PER_PAGE);
    } catch (error) {
      console.error('Daha fazla kullanıcı yüklenirken hata oluştu:', error);
    }
  };

  // Kullanıcı etkinliklerini getir
  const fetchUserActivities = async (userId) => {
    if (userActivities[userId]) return;
    
    try {
      // Kullanıcının yazılarını al
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', userId),
        limit(5)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'post',
        title: doc.data().title,
        createdAt: doc.data().createdAt?.toDate().toLocaleString('tr-TR')
      }));
      
      // Kullanıcının yorumlarını al
      const commentsQuery = query(
        collection(db, 'comments'),
        where('authorId', '==', userId),
        limit(5)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'comment',
        content: doc.data().content,
        postTitle: doc.data().postTitle,
        createdAt: doc.data().createdAt?.toDate().toLocaleString('tr-TR')
      }));
      
      // Tüm etkinlikleri birleştir ve tarihe göre sırala
      const activities = [...posts, ...comments].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setUserActivities(prev => ({
        ...prev,
        [userId]: activities
      }));
    } catch (error) {
      console.error('Kullanıcı etkinlikleri alınırken hata oluştu:', error);
    }
  };

  // Kullanıcı rolünü değiştir
  const changeUserRole = async () => {
    if (!userToChangeRole || !newRole) return;
    
    try {
      const userRef = doc(db, 'users', userToChangeRole.id);
      
      await updateDoc(userRef, {
        role: newRole
      });
      
      // State'i güncelle
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userToChangeRole.id 
            ? { ...user, role: newRole } 
            : user
        )
      );
      
      setRoleModalOpen(false);
      setUserToChangeRole(null);
      setNewRole('');
      
      // Başarı mesajı göster
      alert(`${userToChangeRole.displayName || userToChangeRole.email} kullanıcısının rolü ${newRole} olarak değiştirildi.`);
    } catch (error) {
      console.error('Kullanıcı rolü değiştirilirken hata oluştu:', error);
      alert('Kullanıcı rolü değiştirilirken bir hata oluştu.');
    }
  };

  // Kullanıcı sil
  const deleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      
      // State'i güncelle
      setUsers(prevUsers => 
        prevUsers.filter(user => user.id !== userToDelete.id)
      );
      
      setDeleteModalOpen(false);
      setUserToDelete(null);
      
      // Başarı mesajı göster
      alert(`${userToDelete.displayName || userToDelete.email} kullanıcısı silindi.`);
    } catch (error) {
      console.error('Kullanıcı silinirken hata oluştu:', error);
      alert('Kullanıcı silinirken bir hata oluştu.');
    }
  };

  // Tüm seçili kullanıcıları sil
  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!confirm(`${selectedUsers.length} kullanıcıyı silmek istediğinizden emin misiniz?`)) {
      return;
    }
    
    try {
      // Tüm seçili kullanıcıları silme işlemi
      for (const userId of selectedUsers) {
        await deleteDoc(doc(db, 'users', userId));
      }
      
      // State'i güncelle
      setUsers(prevUsers => 
        prevUsers.filter(user => !selectedUsers.includes(user.id))
      );
      
      setSelectedUsers([]);
      
      // Başarı mesajı göster
      alert(`${selectedUsers.length} kullanıcı başarıyla silindi.`);
    } catch (error) {
      console.error('Kullanıcılar silinirken hata oluştu:', error);
      alert('Kullanıcılar silinirken bir hata oluştu.');
    }
  };

  // CSV'ye dışa aktar
  const exportToCSV = () => {
    const exportData = users.map(user => ({
      'ID': user.id,
      'Ad Soyad': user.displayName || '',
      'E-posta': user.email || '',
      'Rol': user.role || '',
      'Kayıt Tarihi': user.createdAt?.toDate().toLocaleString('tr-TR') || ''
    }));
    
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'kullanicilar.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kullanıcı detaylarını görüntüle
  const viewUserDetails = (user) => {
    setSelectedUserDetails(user);
    fetchUserActivities(user.id);
    setViewUserModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="relative flex-1 md:flex-none">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tüm Roller</option>
              <option value="admin">Admin</option>
              <option value="editor">Editör</option>
              <option value="author">Yazar</option>
              <option value="user">Kullanıcı</option>
            </select>
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <FiDownload className="mr-2" /> Dışa Aktar
          </button>
          
          {selectedUsers.length > 0 && (
            <button
              onClick={deleteSelectedUsers}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <FiTrash2 className="mr-2" /> Seçilenleri Sil ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-100 rounded-t-lg"></div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-50 border-t border-gray-100"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-posta
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium uppercase">
                            {user.displayName ? user.displayName[0] : user.email ? user.email[0] : 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'İsimsiz Kullanıcı'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {user.email || 'E-posta yok'}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {user.role === 'admin' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Admin
                        </span>
                      ) : user.role === 'editor' ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Editör
                        </span>
                      ) : user.role === 'author' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Yazar
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          Kullanıcı
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {user.createdAt?.toDate().toLocaleDateString('tr-TR') || 'Bilinmiyor'}
                    </td>
                    <td className="py-4 px-4 text-sm text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => viewUserDetails(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Detayları Görüntüle"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => {
                            setUserToChangeRole(user);
                            setNewRole(user.role || 'user');
                            setRoleModalOpen(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Rol Değiştir"
                        >
                          <FiUserCheck />
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Kullanıcıyı Sil"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Kullanıcı bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {hasMore && (
            <div className="py-4 text-center">
              <button
                onClick={loadMoreUsers}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Rol Değiştirme Modalı */}
      {roleModalOpen && userToChangeRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kullanıcı Rolünü Değiştir
            </h3>
            <p className="text-gray-700 mb-4">
              <span className="font-medium">{userToChangeRole.displayName || userToChangeRole.email}</span> kullanıcısının rolünü değiştirmek istediğinizden emin misiniz?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Rol
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="user">Kullanıcı</option>
                <option value="author">Yazar</option>
                <option value="editor">Editör</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRoleModalOpen(false);
                  setUserToChangeRole(null);
                  setNewRole('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={changeUserRole}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Silme Onay Modalı */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <FiAlertTriangle className="text-xl mr-2" />
              <h3 className="text-lg font-semibold">Kullanıcıyı Sil</h3>
            </div>
            <p className="text-gray-700 mb-6">
              <span className="font-medium">{userToDelete.displayName || userToDelete.email}</span> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={deleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Kullanıcı Detayları Modalı */}
      {viewUserModalOpen && selectedUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Kullanıcı Detayları
                </h3>
                <p className="text-gray-500">
                  {selectedUserDetails.displayName || 'İsimsiz Kullanıcı'}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewUserModalOpen(false);
                  setSelectedUserDetails(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiXCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">E-posta</h4>
                  <p className="text-gray-900">{selectedUserDetails.email || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Rol</h4>
                  <p className="text-gray-900">{selectedUserDetails.role || 'Kullanıcı'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Kayıt Tarihi</h4>
                  <p className="text-gray-900">
                    {selectedUserDetails.createdAt?.toDate().toLocaleString('tr-TR') || 'Bilinmiyor'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Son Giriş</h4>
                  <p className="text-gray-900">
                    {selectedUserDetails.lastLogin?.toDate().toLocaleString('tr-TR') || 'Bilinmiyor'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Durum</h4>
                  {selectedUserDetails.isActive ? (
                    <div className="flex items-center text-green-600">
                      <FiCheckCircle className="mr-1" /> Aktif
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <FiXCircle className="mr-1" /> Pasif
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Biyografi</h4>
                  <p className="text-gray-900">{selectedUserDetails.bio || 'Belirtilmemiş'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Kullanıcı Etkinlikleri</h4>
              
              {userActivities[selectedUserDetails.id]?.length > 0 ? (
                <div className="space-y-4">
                  {userActivities[selectedUserDetails.id].map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`p-2 rounded-full mr-3 ${activity.type === 'post' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {activity.type === 'post' ? (
                          <FiFileText className={activity.type === 'post' ? 'text-green-500' : 'text-blue-500'} />
                        ) : (
                          <FiMessageCircle className={activity.type === 'post' ? 'text-green-500' : 'text-blue-500'} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">
                          {activity.type === 'post' ? (
                            <span>Yazı oluşturdu: <strong>{activity.title}</strong></span>
                          ) : (
                            <span>Yorum yaptı: <strong>{activity.postTitle}</strong></span>
                          )}
                        </p>
                        {activity.type === 'comment' && (
                          <p className="text-sm text-gray-600 mt-1">{activity.content}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{activity.createdAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Kullanıcı etkinliği bulunamadı veya yükleniyor...
                </p>
              )}
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  setViewUserModalOpen(false);
                  setSelectedUserDetails(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setViewUserModalOpen(false);
                  setUserToChangeRole(selectedUserDetails);
                  setNewRole(selectedUserDetails.role || 'user');
                  setRoleModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FiEdit2 className="mr-2" /> Düzenle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}