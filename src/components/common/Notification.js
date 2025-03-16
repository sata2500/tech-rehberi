// src/components/common/Notification.js
import { createContext, useContext, useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';

// Bildirim türleri
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// Bildirim context'i
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  
  // Bildirim ekleme
  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const notification = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Otomatik kapatma
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };
  
  // Bildirim kaldırma
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Kısa yol fonksiyonlar
  const success = (message, duration) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
  const error = (message, duration) => addNotification(message, NOTIFICATION_TYPES.ERROR, duration);
  const info = (message, duration) => addNotification(message, NOTIFICATION_TYPES.INFO, duration);
  const warning = (message, duration) => addNotification(message, NOTIFICATION_TYPES.WARNING, duration);
  
  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
}

// Bildirimleri görüntüleyen container bileşeni
function NotificationContainer({ notifications, removeNotification }) {
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-3 max-w-sm">
      {notifications.map(notification => (
        <Notification 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
}

// Tek bir bildirim bileşeni
function Notification({ notification, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (notification.duration > 0) {
      const interval = setInterval(() => {
        const elapsedTime = Date.now() - notification.createdAt;
        const remainingPercentage = 100 - (elapsedTime / notification.duration) * 100;
        setProgress(Math.max(remainingPercentage, 0));
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [notification]);
  
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  // Bildirim tipi için uygun simge ve renk
  const getIconAndColor = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          icon: <FiCheckCircle />,
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          progressColor: 'bg-green-300'
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          icon: <FiXCircle />,
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          progressColor: 'bg-red-300'
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          icon: <FiAlertCircle />,
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
          progressColor: 'bg-yellow-300'
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          icon: <FiInfo />,
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          progressColor: 'bg-blue-300'
        };
    }
  };
  
  const { icon, bgColor, textColor, progressColor } = getIconAndColor();
  
  return (
    <div 
      className={`relative rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ${bgColor} ${textColor} ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className="p-4 pr-10">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      </div>
      
      <button
        type="button"
        className="absolute top-2 right-2 text-white"
        onClick={handleClose}
      >
        <FiX />
      </button>
      
      {notification.duration > 0 && (
        <div className="h-1 w-full bg-black bg-opacity-20">
          <div 
            className={`h-full ${progressColor} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Hook for using notifications
export function useNotification() {
  return useContext(NotificationContext);
}