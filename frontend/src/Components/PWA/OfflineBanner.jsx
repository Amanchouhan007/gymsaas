import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const OfflineBanner = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="w-100 text-white text-center py-2 px-3 fw-semibold d-flex align-items-center justify-content-center gap-2"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        backgroundColor: '#dc2626',
        fontSize: '0.85rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        pointerEvents: 'auto'
      }}
    >
      <span>⚠️</span>
      <span>{t('pwa.offlineNotice', 'You are offline. Some features need internet.')}</span>
    </div>
  );
};

export default OfflineBanner;
