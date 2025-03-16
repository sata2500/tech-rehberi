// src/components/user/ProfileForm.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  FiUser, 
  FiMail, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiAlertCircle, 
  FiCheck,
  FiCamera,
  FiMoon,
  FiSun,
  FiBell,
  FiBellOff
} from 'react-icons/fi';
import { 
  updateUserProfile, 
  updateAuthProfile, 
  uploadProfilePhoto,
  getUserProfile,
  updateUserPreferences
} from '../../lib/user-helpers';

export default function ProfileForm({ user, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: '',
    location: '',
    website: '',
    twitterUsername: '',
    githubUsername: '',
  });
  
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailNotifications: {
      newPosts: true,
      comments: true,
      newsletter: true
    }
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.photoURL || null);
  
  // Kullanıcı verileri ve tercihlerini yükle
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.uid) {
        try {
          const { success, profile } = await getUserProfile(user.uid);
          
          if (success && profile) {
            // Profil verilerini doldur
            setProfileData(prevData => ({
              ...prevData,
              displayName: user.displayName || '',
              bio: profile.bio || '',
              location: profile.location || '',
              website: profile.website || '',
              twitterUsername: profile.twitterUsername || '',
              githubUsername: profile.githubUsername || ''
            }));
            
            // Tercihleri doldur
            if (profile.preferences) {
              setPreferences(profile.preferences);
            }
          }
        } catch (error) {
          console.error('Kullanıcı verileri yüklenirken hata oluştu:', error);
        }
      }
    };
    
    loadUserData();
  }, [user]);
  
  // Form alanlarını değiştirme işlevi
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Hata varsa sil
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Tercihleri değiştirme işlevi
  const handlePreferenceChange = (e) => {
    const { name, checked, value, type } = e.target;
    
    if (name === 'theme') {
      setPreferences(prev => ({
        ...prev,
        theme: value
      }));
    } else if (name.startsWith('email_')) {
      const notificationType = name.replace('email_', '');
      setPreferences(prev => ({
        ...prev,
        emailNotifications: {
          ...prev.emailNotifications,
          [notificationType]: checked
        }
      }));
    }
  };
  
  // Profil fotoğrafını değiştirme işlevi
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Dosya türü kontrolü
      if (!file.type.includes('image/')) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Lütfen geçerli bir resim dosyası seçin.'
        }));
        return;
      }
      
      // Dosya boyutu kontrolü (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Resim dosyası 2MB\'dan küçük olmalıdır.'
        }));
        return;
      }
      
      setProfileImage(file);
      
      // Dosya önizlemesi
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Hata varsa sil
      if (formErrors.image) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };
  
  // Form doğrulama
  const validateForm = () => {
    const errors = {};
    
    if (!profileData.displayName.trim()) {
      errors.displayName = 'İsim alanı zorunludur.';
    }
    
    if (profileData.website && !isValidUrl(profileData.website)) {
      errors.website = 'Geçerli bir URL giriniz.';
    }
    
    if (profileData.bio && profileData.bio.length > 160) {
      errors.bio = 'Biyografi en fazla 160 karakter olabilir.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // URL doğrulama
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Formu gönderme işlevi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      let photoURL = user.photoURL;
      
      // Profil fotoğrafını yükle
      if (profileImage) {
        const uploadResult = await uploadProfilePhoto(profileImage, user.uid);
        
        if (uploadResult.success) {
          photoURL = uploadResult.photoURL;
        } else {
          throw new Error(uploadResult.error);
        }
      }
      
      // Auth profilini güncelle
      await updateAuthProfile(user, {
        displayName: profileData.displayName,
        photoURL
      });
      
      // Firestore profilini güncelle
      await updateUserProfile(user.uid, {
        displayName: profileData.displayName,
        photoURL,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        twitterUsername: profileData.twitterUsername,
        githubUsername: profileData.githubUsername
      });
      
      // Tercihleri güncelle
      await updateUserPreferences(user.uid, preferences);
      
      setSuccessMessage('Profil bilgileriniz başarıyla güncellendi.');
      setIsEditing(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Profil güncellenirken hata oluştu:', error);
      setFormErrors(prev => ({
        ...prev,
        general: `Profil güncellenirken bir hata oluştu: ${error.message}`
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Profil Bilgileri</h3>
          
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiEdit2 className="mr-1" /> Düzenle
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormErrors({});
                setSuccessMessage('');
                // Değişiklikleri geri al
                setProfileData({
                  displayName: user?.displayName || '',
                  bio: '',
                  location: '',
                  website: '',
                  twitterUsername: '',
                  githubUsername: '',
                });
                setImagePreview(user?.photoURL || null);
                setProfileImage(null);
              }}
              className="flex items-center text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              <FiX className="mr-1" /> İptal
            </button>
          )}
        </div>
        
        {/* Genel Hata Mesajı */}
        {formErrors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start">
            <FiAlertCircle className="flex-shrink-0 mr-2 mt-0.5" />
            <span>{formErrors.general}</span>
          </div>
        )}
        
        {/* Başarı Mesajı */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 flex items-start">
            <FiCheck className="flex-shrink-0 mr-2 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Profil Fotoğrafı */}
          <div className="mb-6 flex flex-col items-center sm:flex-row sm:items-start">
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {imagePreview ? (
                  <Image 
                    src={imagePreview} 
                    alt={profileData.displayName || 'Profil fotoğrafı'} 
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <FiUser className="text-gray-400" size={36} />
                )}
              </div>
              
              {isEditing && (
                <label 
                  htmlFor="profileImage" 
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md cursor-pointer border border-gray-200 hover:bg-gray-50"
                >
                  <FiCamera className="text-gray-600" size={16} />
                  <input 
                    type="file" 
                    id="profileImage" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </label>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Profil fotoğrafınızı değiştirmek için simgeye tıklayın.
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG veya GIF. En fazla 2MB.
                  </p>
                  
                  {formErrors.image && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.image}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center">
                  <FiUser className="text-gray-500 mr-2" />
                  <span className="text-gray-800 font-medium">
                    {user?.displayName || 'İsimsiz Kullanıcı'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {/* İsim */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                İsim
              </label>
              
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.displayName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  
                  {formErrors.displayName && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.displayName}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-800">
                  {profileData.displayName || 'Belirtilmemiş'}
                </p>
              )}
            </div>
            
            {/* E-posta */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              
              <div className="flex items-center">
                <FiMail className="text-gray-500 mr-2" />
                <span className="text-gray-800">{user?.email}</span>
                
                {user?.emailVerified && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                    Doğrulanmış
                  </span>
                )}
                
                {!user?.emailVerified && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Doğrulanmamış
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                E-posta adresinizi değiştirmek için lütfen ayarlar sekmesini kullanın.
              </p>
            </div>
            
            {/* Biyografi */}
            {isEditing && (
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Biyografi <span className="text-gray-500 text-xs font-normal">(isteğe bağlı)</span>
                </label>
                <div>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.bio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Kendiniz hakkında kısa bir bilgi"
                    maxLength={160}
                    disabled={isLoading}
                  />
                  
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs ${formErrors.bio ? 'text-red-600' : 'text-gray-500'}`}>
                      {formErrors.bio || `${profileData.bio.length}/160 karakter`}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {!isEditing && profileData.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biyografi
                </label>
                <p className="text-gray-800">
                  {profileData.bio}
                </p>
              </div>
            )}
            
            {/* Konum */}
            {isEditing && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Konum <span className="text-gray-500 text-xs font-normal">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profileData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn. İstanbul, Türkiye"
                  disabled={isLoading}
                />
              </div>
            )}
            
            {!isEditing && profileData.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konum
                </label>
                <p className="text-gray-800">
                  {profileData.location}
                </p>
              </div>
            )}
            
            {/* Web Sitesi */}
            {isEditing && (
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Web Sitesi <span className="text-gray-500 text-xs font-normal">(isteğe bağlı)</span>
                </label>
                <div>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={profileData.website}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.website ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com"
                    disabled={isLoading}
                  />
                  
                  {formErrors.website && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.website}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {!isEditing && profileData.website && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Web Sitesi
                </label>
                <p className="text-gray-800">
                  <a 
                    href={profileData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {profileData.website}
                  </a>
                </p>
              </div>
            )}
            
            {/* Sosyal Medya */}
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twitterUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter <span className="text-gray-500 text-xs font-normal">(isteğe bağlı)</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      id="twitterUsername"
                      name="twitterUsername"
                      value={profileData.twitterUsername}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="kullaniciadi"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub <span className="text-gray-500 text-xs font-normal">(isteğe bağlı)</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      id="githubUsername"
                      name="githubUsername"
                      value={profileData.githubUsername}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="kullaniciadi"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {!isEditing && (profileData.twitterUsername || profileData.githubUsername) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sosyal Medya
                </label>
                <div className="flex flex-wrap gap-3">
                  {profileData.twitterUsername && (
                    <a 
                      href={`https://twitter.com/${profileData.twitterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100"
                    >
                      Twitter: @{profileData.twitterUsername}
                    </a>
                  )}
                  
                  {profileData.githubUsername && (
                    <a 
                      href={`https://github.com/${profileData.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200"
                    >
                      GitHub: @{profileData.githubUsername}
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Tema Tercihi */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Tema Tercihi</h4>
              
              <div className="flex space-x-4">
                <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer ${
                  preferences.theme === 'light' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={preferences.theme === 'light'}
                    onChange={handlePreferenceChange}
                    className="sr-only"
                    disabled={!isEditing || isLoading}
                  />
                  <FiSun className={`text-2xl ${preferences.theme === 'light' ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span className={`mt-2 text-sm ${preferences.theme === 'light' ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                    Açık Tema
                  </span>
                </label>
                
                <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer ${
                  preferences.theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={preferences.theme === 'dark'}
                    onChange={handlePreferenceChange}
                    className="sr-only"
                    disabled={!isEditing || isLoading}
                  />
                  <FiMoon className={`text-2xl ${preferences.theme === 'dark' ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span className={`mt-2 text-sm ${preferences.theme === 'dark' ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                    Koyu Tema
                  </span>
                </label>
                
                <label className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer ${
                  preferences.theme === 'system' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={preferences.theme === 'system'}
                    onChange={handlePreferenceChange}
                    className="sr-only"
                    disabled={!isEditing || isLoading}
                  />
                  <div className="flex text-2xl">
                    <FiSun className={`${preferences.theme === 'system' ? 'text-blue-500' : 'text-gray-500'}`} />
                    <FiMoon className={`ml-1 ${preferences.theme === 'system' ? 'text-blue-500' : 'text-gray-500'}`} />
                  </div>
                  <span className={`mt-2 text-sm ${preferences.theme === 'system' ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                    Sistem
                  </span>
                </label>
              </div>
            </div>
            
            {/* E-posta Bildirimleri */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">E-posta Bildirimleri</h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="email_newPosts"
                    checked={preferences.emailNotifications.newPosts}
                    onChange={handlePreferenceChange}
                    disabled={!isEditing || isLoading}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yeni yazılar hakkında bildir</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="email_comments"
                    checked={preferences.emailNotifications.comments}
                    onChange={handlePreferenceChange}
                    disabled={!isEditing || isLoading}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yorumlar hakkında bildir</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="email_newsletter"
                    checked={preferences.emailNotifications.newsletter}
                    onChange={handlePreferenceChange}
                    disabled={!isEditing || isLoading}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Aylık bülten gönder</span>
                </label>
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-8">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}