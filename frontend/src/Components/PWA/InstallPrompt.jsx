import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const InstallPrompt = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // Check for iOS Safari
    const userAgent = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    const iosDismissed = localStorage.getItem('pwa_ios_hint_dismissed');
    if (isIos && isSafari && !iosDismissed) {
      setShowIosHint(true);
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      setDeferredPrompt(e);
      const promptDismissed = localStorage.getItem('pwa_install_prompt_dismissed');
      if (!promptDismissed) {
        setShowInstallBtn(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Do not show on public landing page "/"
  if (location.pathname === '/' || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User install choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleDismissPrompt = () => {
    localStorage.setItem('pwa_install_prompt_dismissed', '1');
    setDismissed(true);
    setShowInstallBtn(false);
  };

  const handleDismissIosHint = () => {
    localStorage.setItem('pwa_ios_hint_dismissed', '1');
    setShowIosHint(false);
  };

  if (showInstallBtn) {
    return (
      <div
        className="position-fixed bottom-0 start-50 translate-middle-x mb-3 p-3 text-white rounded-3 shadow-lg d-flex align-items-center justify-content-between gap-3 flex-wrap"
        style={{
          zIndex: 99998,
          width: '90%',
          maxWidth: '460px',
          backgroundColor: '#180903',
          border: '1.5px solid #ea580c',
          boxShadow: '0 10px 30px rgba(234, 88, 12, 0.25)',
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <img
            src="/icons/pwa-192x192.png"
            alt="YOUR GYM Logo"
            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div>
            <div className="fw-bold" style={{ fontSize: '0.95rem', color: '#ffffff' }}>
              YOUR GYM
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fdba74' }}>
              Install app for fast access
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <button
            className="btn btn-sm text-white fw-bold px-3 py-1"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}
            onClick={handleInstallClick}
          >
            📲 {t('pwa.installApp', 'Install App')}
          </button>
          <button
            className="btn btn-sm text-white-50 px-2 py-1"
            style={{ fontSize: '0.9rem', border: 'none', background: 'transparent' }}
            onClick={handleDismissPrompt}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div
        className="position-fixed bottom-0 start-50 translate-middle-x mb-3 p-3 text-white rounded-3 shadow-lg d-flex align-items-center justify-content-between gap-2"
        style={{
          zIndex: 99998,
          width: '90%',
          maxWidth: '460px',
          backgroundColor: '#180903',
          border: '1.5px solid #ea580c',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.4 }}>
          {t('pwa.iosInstallInstruction', 'To install on iOS: tap Share ⎋ and select Add to Home Screen ➕')}
        </div>
        <button
          className="btn btn-sm text-white-50 p-1"
          style={{ background: 'transparent', border: 'none' }}
          onClick={handleDismissIosHint}
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;
