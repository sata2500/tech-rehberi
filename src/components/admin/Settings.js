// src/components/admin/Settings.js
import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  FiGlobe, 
  FiLayout, 
  FiMail, 
  FiSave, 
  FiUsers, 
  FiMessageCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiSettings
} from 'react-icons/fi';

export default function Settings() {
  // Site ayarları state
  const [siteSettings, setSiteSettings] = useState({
    // Genel ayarlar
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    logo: '',
    favicon: '',
    
    // SEO ayarları
    defaultTitle: '',
    defaultDescription: '',
    defaultKeywords: '',
    googleAnalyticsId: '',
    
    // İçerik ayarları
    postsPerPage: 10,
    allowComments: true,
    moderateComments: true,
    
    // Kullanıcı ayarları
    allowRegistration: true,
    defaultUserRole: 'user',
    
    // İletişim ayarları
    contactEmail: '',
    notificationEmail: '',
    
    // Sosyal medya
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: ''
  });
  
  // Tema ayarları state
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#6b7280',
    accentColor: '#f59e0b',
    fontFamily: 'Inter, sans-serif',
    enableDarkMode: true,
    headerStyle: 'standard',
    footerStyle: 'standard',
    sidebarPosition: 'right'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Ayarları getir
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const siteSettingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (siteSettingsDoc.exists()) {
          setSiteSettings(prevSettings => ({
            ...prevSettings,
            ...siteSettingsDoc.data()
          }));
        }
        
        const themeSettingsDoc = await getDoc(doc(db, 'settings', 'theme'));
        if (themeSettingsDoc.exists()) {
          setThemeSettings(prevSettings => ({
            ...prevSettings,
            ...themeSettingsDoc.data()
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Ayarlar alınırken hata oluştu:', error);
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Site ayarlarını kaydet
  const saveSiteSettings = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(false);
      
      await setDoc(doc(db, 'settings', 'site'), siteSettings);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Site ayarları kaydedilirken hata oluştu:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Tema ayarlarını kaydet
  const saveThemeSettings = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(false);
      
      await setDoc(doc(db, 'settings', 'theme'), themeSettings);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Tema ayarları kaydedilirken hata oluştu:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Tüm ayarları kaydet
  const saveAllSettings = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(false);
      
      // Site ayarlarını kaydet
      await setDoc(doc(db, 'settings', 'site'), siteSettings);
      
      // Tema ayarlarını kaydet
      await setDoc(doc(db, 'settings', 'theme'), themeSettings);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata oluştu:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Site ayarları değişikliği
  const handleSiteSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSiteSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Tema ayarları değişikliği
  const handleThemeSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Sayısal değer değişikliği
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    setSiteSettings(prevSettings => ({
      ...prevSettings,
      [name]: isNaN(numValue) ? 0 : numValue
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Site Ayarları</h2>
        
        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <div className="flex items-center text-green-600">
              <FiCheckCircle className="mr-1" />
              <span className="text-sm">Kaydedildi</span>
            </div>
          )}
          
          {saveError && (
            <div className="flex items-center text-red-600">
              <FiAlertCircle className="mr-1" />
              <span className="text-sm">Hata oluştu</span>
            </div>
          )}
          
          <button
            onClick={saveAllSettings}
            disabled={saving}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiSave className="mr-2" /> 
            {saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="animate-pulse space-y-4 p-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Ayar sekmeleri */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                className={`px-4 py-3 font-medium text-sm flex items-center ${
                  activeTab === 'general' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <FiGlobe className="mr-2" /> Genel
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm flex items-center ${
                  activeTab === 'appearance' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('appearance')}
              >
                <FiLayout className="mr-2" /> Görünüm
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm flex items-center ${
                  activeTab === 'comments' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('comments')}
              >
                <FiMessageCircle className="mr-2" /> Yorumlar
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm flex items-center ${
                  activeTab === 'users' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('users')}
              >
                <FiUsers className="mr-2" /> Kullanıcılar
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm flex items-center ${
                  activeTab === 'contact' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('contact')}
              >
                <FiMail className="mr-2" /> İletişim
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm flex items-center ${
                  activeTab === 'advanced' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                <FiSettings className="mr-2" /> Gelişmiş
              </button>
            </div>
          </div>
          
          {/* Genel Ayarlar */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Adı
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    value={siteSettings.siteName}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site URL
                  </label>
                  <input
                    type="text"
                    name="siteUrl"
                    value={siteSettings.siteUrl}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Açıklaması
                  </label>
                  <textarea
                    name="siteDescription"
                    value={siteSettings.siteDescription}
                    onChange={handleSiteSettingChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    name="logo"
                    value={siteSettings.logo}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Favicon URL
                  </label>
                  <input
                    type="text"
                    name="favicon"
                    value={siteSettings.favicon}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Ayarları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Varsayılan Sayfa Başlığı
                    </label>
                    <input
                      type="text"
                      name="defaultTitle"
                      value={siteSettings.defaultTitle}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      name="googleAnalyticsId"
                      value={siteSettings.googleAnalyticsId}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="UA-XXXXX-X"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Varsayılan Meta Açıklama
                    </label>
                    <textarea
                      name="defaultDescription"
                      value={siteSettings.defaultDescription}
                      onChange={handleSiteSettingChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    ></textarea>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Varsayılan Anahtar Kelimeler
                    </label>
                    <input
                      type="text"
                      name="defaultKeywords"
                      value={siteSettings.defaultKeywords}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="teknoloji, yazılım, programlama"
                    />
                    <p className="mt-1 text-sm text-gray-500">Virgül ile ayırarak yazın</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sosyal Medya</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook URL
                    </label>
                    <input
                      type="text"
                      name="facebookUrl"
                      value={siteSettings.facebookUrl}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter URL
                    </label>
                    <input
                      type="text"
                      name="twitterUrl"
                      value={siteSettings.twitterUrl}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="text"
                      name="instagramUrl"
                      value={siteSettings.instagramUrl}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      name="youtubeUrl"
                      value={siteSettings.youtubeUrl}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      name="linkedinUrl"
                      value={siteSettings.linkedinUrl}
                      onChange={handleSiteSettingChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveSiteSettings}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" /> 
                  {saving ? 'Kaydediliyor...' : 'Genel Ayarları Kaydet'}
                </button>
              </div>
            </div>
          )}
          
          {/* Görünüm Ayarları */}
          {activeTab === 'appearance' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ana Renk
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      name="primaryColor"
                      value={themeSettings.primaryColor}
                      onChange={handleThemeSettingChange}
                      className="h-10 w-10 border border-gray-300 rounded-md mr-2"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={themeSettings.primaryColor}
                      onChange={handleThemeSettingChange}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İkincil Renk
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={themeSettings.secondaryColor}
                      onChange={handleThemeSettingChange}
                      className="h-10 w-10 border border-gray-300 rounded-md mr-2"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={themeSettings.secondaryColor}
                      onChange={handleThemeSettingChange}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vurgu Rengi
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      name="accentColor"
                      value={themeSettings.accentColor}
                      onChange={handleThemeSettingChange}
                      className="h-10 w-10 border border-gray-300 rounded-md mr-2"
                    />
                    <input
                      type="text"
                      name="accentColor"
                      value={themeSettings.accentColor}
                      onChange={handleThemeSettingChange}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yazı Tipi
                  </label>
                  <select
                    name="fontFamily"
                    value={themeSettings.fontFamily}
                    onChange={handleThemeSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık Stili
                  </label>
                  <select
                    name="headerStyle"
                    value={themeSettings.headerStyle}
                    onChange={handleThemeSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="standard">Standart</option>
                    <option value="centered">Ortalı</option>
                    <option value="minimal">Minimal</option>
                    <option value="hero">Büyük Banner</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Bilgi Stili
                  </label>
                  <select
                    name="footerStyle"
                    value={themeSettings.footerStyle}
                    onChange={handleThemeSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="standard">Standart</option>
                    <option value="simple">Basit</option>
                    <option value="detailed">Detaylı</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kenar Çubuğu Pozisyonu
                  </label>
                  <select
                    name="sidebarPosition"
                    value={themeSettings.sidebarPosition}
                    onChange={handleThemeSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="right">Sağ</option>
                    <option value="left">Sol</option>
                    <option value="none">Yok</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableDarkMode"
                    checked={themeSettings.enableDarkMode}
                    onChange={handleThemeSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Karanlık Mod Seçeneği Etkinleştir
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveThemeSettings}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" /> 
                  {saving ? 'Kaydediliyor...' : 'Görünüm Ayarlarını Kaydet'}
                </button>
              </div>
            </div>
          )}
          
          {/* Yorum Ayarları */}
          {activeTab === 'comments' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowComments"
                    checked={siteSettings.allowComments}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Yorumlara İzin Ver
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="moderateComments"
                    checked={siteSettings.moderateComments}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Yorumlar Onay Gerektirir
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spam Filtreleme Seviyesi
                  </label>
                  <select
                    name="spamFilterLevel"
                    value={siteSettings.spamFilterLevel || 'medium'}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="off">Kapalı</option>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yorum Avatarları
                  </label>
                  <select
                    name="commentAvatars"
                    value={siteSettings.commentAvatars || 'gravatar'}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="gravatar">Gravatar</option>
                    <option value="initials">Baş Harfler</option>
                    <option value="none">Gösterme</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sayfa Başına Yorum Sayısı
                  </label>
                  <input
                    type="number"
                    name="commentsPerPage"
                    value={siteSettings.commentsPerPage || 10}
                    onChange={handleNumberChange}
                    min="1"
                    max="100"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yasaklı Kelimeler
                  </label>
                  <textarea
                    name="bannedWords"
                    value={siteSettings.bannedWords || ''}
                    onChange={handleSiteSettingChange}
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Her satıra bir kelime ekleyin"
                  ></textarea>
                  <p className="mt-1 text-sm text-gray-500">Bu kelimeleri içeren yorumlar otomatik olarak engellenecektir.</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveSiteSettings}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" /> 
                  {saving ? 'Kaydediliyor...' : 'Yorum Ayarlarını Kaydet'}
                </button>
              </div>
            </div>
          )}
          
          {/* Kullanıcı Ayarları */}
          {activeTab === 'users' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowRegistration"
                    checked={siteSettings.allowRegistration}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Kullanıcı Kayıtlarına İzin Ver
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Varsayılan Kullanıcı Rolü
                  </label>
                  <select
                    name="defaultUserRole"
                    value={siteSettings.defaultUserRole}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="author">Yazar</option>
                    <option value="editor">Editör</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={siteSettings.requireEmailVerification || true}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    E-posta Doğrulaması Gerektirir
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowSocialLogin"
                    checked={siteSettings.allowSocialLogin || true}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Sosyal Medya ile Giriş Etkinleştir
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profil Fotoğrafı Kaynağı
                  </label>
                  <select
                    name="avatarSource"
                    value={siteSettings.avatarSource || 'gravatar'}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="gravatar">Gravatar</option>
                    <option value="upload">Yükleme İzin Ver</option>
                    <option value="both">Her İkisi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kullanıcı Biyografi Maksimum Uzunluğu
                  </label>
                  <input
                    type="number"
                    name="maxBioLength"
                    value={siteSettings.maxBioLength || 500}
                    onChange={handleNumberChange}
                    min="100"
                    max="2000"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveSiteSettings}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" /> 
                  {saving ? 'Kaydediliyor...' : 'Kullanıcı Ayarlarını Kaydet'}
                </button>
              </div>
            </div>
          )}
          
          {/* İletişim Ayarları */}
          {activeTab === 'contact' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İletişim E-posta Adresi
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={siteSettings.contactEmail}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="contact@example.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">İletişim formundan gelen mesajlar bu adrese iletilecektir.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bildirim E-posta Adresi
                  </label>
                  <input
                    type="email"
                    name="notificationEmail"
                    value={siteSettings.notificationEmail}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="notifications@example.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">Yeni yorum, kullanıcı kaydı gibi bildirimler bu adrese gönderilecektir.</p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableContactForm"
                    checked={siteSettings.enableContactForm || true}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    İletişim Formunu Etkinleştir
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableNewsletter"
                    checked={siteSettings.enableNewsletter || false}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Bülten Aboneliğini Etkinleştir
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon Numarası (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={siteSettings.phoneNumber || ''}
                    onChange={handleSiteSettingChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="+90 212 123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres (İsteğe Bağlı)
                  </label>
                  <textarea
                    name="address"
                    value={siteSettings.address || ''}
                    onChange={handleSiteSettingChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveSiteSettings}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" /> 
                  {saving ? 'Kaydediliyor...' : 'İletişim Ayarlarını Kaydet'}
                </button>
              </div>
            </div>
          )}
          
          {/* Gelişmiş Ayarlar */}
          {activeTab === 'advanced' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sayfa Başına Yazı Sayısı
                  </label>
                  <input
                    type="number"
                    name="postsPerPage"
                    value={siteSettings.postsPerPage}
                    onChange={handleNumberChange}
                    min="1"
                    max="50"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableSitemap"
                    checked={siteSettings.enableSitemap || true}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Otomatik Site Haritası Oluştur
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableRSS"
                    checked={siteSettings.enableRSS || true}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    RSS Beslemesini Etkinleştir
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="lazyLoadImages"
                    checked={siteSettings.lazyLoadImages || true}
                    onChange={handleSiteSettingChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Resimlerde Lazy Loading Kullan
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Özel CSS
                  </label>
                  <textarea
                    name="customCSS"
                    value={siteSettings.customCSS || ''}
                    onChange={handleSiteSettingChange}
                    rows="6"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Ekstra Kodlar
                  </label>
                  <textarea
                    name="headerScripts"
                    value={siteSettings.headerScripts || ''}
                    onChange={handleSiteSettingChange}
                    rows="6"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                    placeholder="<!-- JS veya CSS kodları -->"
                  ></textarea>
                  <p className="mt-1 text-sm text-gray-500">Bu kodlar sayfanın head bölümüne eklenecektir.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Ekstra Kodlar
                  </label>
                  <textarea
                    name="footerScripts"
                    value={siteSettings.footerScripts || ''}
                    onChange={handleSiteSettingChange}
                    rows="6"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                    placeholder="<!-- JS kodları -->"
                  ></textarea>
                  <p className="mt-1 text-sm text-gray-500">Bu kodlar sayfanın footer bölümüne eklenecektir.</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveSiteSettings}
                  disabled={saving}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" /> 
                  {saving ? 'Kaydediliyor...' : 'Gelişmiş Ayarları Kaydet'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}