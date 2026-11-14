import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

const PWAUpdatePrompt = () => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        // Periodic check every 60 minutes
        setInterval(async () => {
          if (!navigator.onLine) return;
          if (r.installing || !r.active) return;
          try {
            await r.update();
          } catch (e) {
            console.debug('SW update check failed:', e);
          }
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    const checkUpdateOnFocus = () => {
      if ('serviceWorker' in navigator && navigator.onLine) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update();
        });
      }
    };
    window.addEventListener('focus', checkUpdateOnFocus);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUpdateOnFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', checkUpdateOnFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Banner disabled as requested
  return null;

  return (
    <div
      className="position-fixed bottom-0 end-0 m-3 p-3 text-white rounded-3 shadow-lg d-flex align-items-center justify-content-between gap-3 flex-wrap"
      style={{
        zIndex: 99999,
        maxWidth: '440px',
        backgroundColor: '#180903',
        border: '1px solid rgba(234, 88, 12, 0.4)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
        <span className="fs-5" style={{ color: '#ea580c' }}>✨</span>
        <span className="fw-medium" style={{ fontSize: '0.9rem' }}>
          {t('pwa.newVersionAvailable', 'A new version of the app is available!')}
        </span>
      </div>
      <div className="d-flex align-items-center gap-2 ms-auto">
        <button
          className="btn btn-sm text-white fw-bold px-3 py-1"
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.85rem'
          }}
          onClick={() => updateServiceWorker(true)}
        >
          {t('pwa.updateNow', 'Update Now')}
        </button>
        <button
          className="btn btn-sm btn-outline-light px-2 py-1"
          style={{ fontSize: '0.8rem', borderRadius: '6px' }}
          onClick={() => {
            setDismissed(true);
            setNeedRefresh(false);
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
