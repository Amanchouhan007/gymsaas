import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaAndroid, FaApple, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { ANDROID_APK_URL } from '../../config/appLinks';
import useAppInstallState from './useAppInstallState';

const SHOW_REINSTALL_LINK = false;

export const ReinstallLink = () => {
  const { t } = useTranslation();
  const { showReinstallLink, markAndroidDone } = useAppInstallState();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  if (!SHOW_REINSTALL_LINK || !showReinstallLink) {
    return null;
  }

  const handleReinstallClick = () => {
    markAndroidDone();
    setShowAndroidGuide(true);
  };

  return (
    <>
      <div className="mt-2 text-center">
        <a
          href={ANDROID_APK_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-decoration-underline"
          style={{ fontSize: '0.82rem', color: '#fdba74', cursor: 'pointer' }}
          onClick={handleReinstallClick}
        >
          <FaDownload className="me-1" />
          {t('pwa.reinstallApp', 'App not installed? Download APK again')}
        </a>
      </div>

      {/* Android Download Guide Modal */}
      <Modal
        show={showAndroidGuide}
        onHide={() => setShowAndroidGuide(false)}
        centered
        className="pwa-guide-modal"
      >
        <Modal.Header closeButton style={{ background: '#180903', color: '#ffffff', borderBottom: '1px solid rgba(234, 88, 12, 0.3)' }}>
          <Modal.Title className="fs-6 fw-bold text-white d-flex align-items-center gap-2">
            <FaCheckCircle color="#10b981" size={20} />
            {t('pwa.downloadStartedTitle', 'Download Started!')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#180903', color: '#f8fafc', fontSize: '0.9rem' }}>
          <p className="text-white-50 mb-3" style={{ fontSize: '0.85rem' }}>
            Follow these 3 quick steps on your phone to complete installation:
          </p>
          <ol className="ps-3 mb-3 d-flex flex-column gap-2" style={{ lineHeight: '1.5' }}>
            <li>{t('pwa.downloadStep1', '1. Open the downloaded .apk file from browser downloads or notification bar.')}</li>
            <li>{t('pwa.downloadStep2', '2. If prompted, allow "Install unknown apps" for your browser in Settings.')}</li>
            <li>{t('pwa.downloadStep3', '3. If Google Play Protect warns, tap "More details" → "Install anyway".')}</li>
          </ol>
        </Modal.Body>
        <Modal.Footer style={{ background: '#180903', borderTop: '1px solid rgba(234, 88, 12, 0.2)' }}>
          <button
            className="btn btn-sm text-white fw-bold px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '8px' }}
            onClick={() => setShowAndroidGuide(false)}
          >
            {t('pwa.gotIt', 'Got it')}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const AppDownloadButtons = ({ variant = 'hero', className = '' }) => {
  const { t } = useTranslation();
  const { showAndroid, showIOS, markAndroidDone, markIOSDone } = useAppInstallState();

  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  // Installed State Detection
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      (document.referrer && document.referrer.startsWith('android-app://'))
    );
  });

  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      markAndroidDone();
      markIOSDone();
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also check media query changes
    const mediaQuery = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      if (e.matches) setIsInstalled(true);
    };

    if (mediaQuery && mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery && mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, [markAndroidDone, markIOSDone]);

  const handleAndroidClick = async (e) => {
    e.preventDefault();
    
    // 1. Try Native Browser PWA Prompt
    if (window.deferredPwaPrompt) {
      try {
        const promptEvent = window.deferredPwaPrompt;
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        
        if (choiceResult && choiceResult.outcome === 'accepted') {
          markAndroidDone();
          setIsInstalled(true);
          window.deferredPwaPrompt = null;
          return;
        }
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }

    // 2. Fallback: If beforeinstallprompt hasn't fired or browser unsupported, show guide modal
    setShowAndroidModal(true);
  };

  const handleIosClick = (e) => {
    e.preventDefault();
    setShowIosModal(true);
  };

  const handleIosDone = () => {
    markIOSDone();
    setShowIosModal(false);
  };

  const isHero = variant === 'hero';
  const isNavbar = variant === 'navbar';

  // If already running in standalone app mode
  if (isInstalled) {
    return (
      <div
        className={`app-download-btns d-flex align-items-center ${isNavbar ? 'justify-content-end gap-2 w-auto' : 'justify-content-center gap-3 flex-wrap w-100'} ${className}`}
        style={{ margin: isNavbar ? '0' : (isHero ? '20px 0 24px' : '16px 0') }}
      >
        <div
          className="btn text-white fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
          style={{
            minHeight: isNavbar ? '38px' : '48px',
            padding: isNavbar ? '6px 16px' : '12px 24px',
            borderRadius: isNavbar ? '8px' : '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid #10b981',
            color: '#34d399',
            fontSize: isNavbar ? '0.82rem' : '0.95rem',
          }}
        >
          <FaCheckCircle color="#10b981" size={isNavbar ? 16 : 18} />
          <span style={{ color: '#34d399' }}>{t('pwa.appInstalled', '✓ App Installed')}</span>
        </div>
      </div>
    );
  }

  // If neither button should render
  if (!showAndroid && !showIOS) {
    return null;
  }

  return (
    <>
      <div
        className={`app-download-btns d-flex align-items-center ${isNavbar ? 'justify-content-end gap-2 w-auto' : 'justify-content-start gap-3 flex-wrap'} ${className}`}
        style={{ margin: isNavbar ? '0' : (isHero ? '22px 0 26px' : '16px 0') }}
      >
        {/* Official Google Play Store Badge Button */}
        {showAndroid && (
          <button
            type="button"
            onClick={handleAndroidClick}
            className="store-badge-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: isNavbar ? '6px 14px' : '9px 18px',
              minHeight: isNavbar ? '40px' : '52px',
              borderRadius: '12px',
              background: '#050507',
              border: '1.5px solid rgba(255, 255, 255, 0.24)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              flex: isNavbar ? '0 0 auto' : '0 1 auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ea580c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(234, 88, 12, 0.35), 0 4px 14px rgba(0, 0, 0, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.24)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
            }}
          >
            {/* Authentic Google Play 4-Color Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={isNavbar ? "20" : "24"} height={isNavbar ? "22" : "26"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.6 1.8C3.3 2.1 3.1 2.6 3.1 3.2V20.8C3.1 21.4 3.3 21.9 3.6 22.2L3.7 22.3L13.8 12.2V11.8L3.7 1.7L3.6 1.8Z" fill="#2196F3"/>
                <path d="M17.2 15.6L13.8 12.2V11.8L17.2 8.4L17.3 8.5L21.3 10.8C22.4 11.4 22.4 12.6 21.3 13.2L17.3 15.5L17.2 15.6Z" fill="#FFC107"/>
                <path d="M17.3 15.5L13.8 12L3.6 22.2C4 22.6 4.7 22.7 5.5 22.2L17.3 15.5Z" fill="#4CAF50"/>
                <path d="M17.3 8.5L5.5 1.8C4.7 1.3 4 1.4 3.6 1.8L13.8 12L17.3 8.5Z" fill="#F44336"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.15 }}>
              <span style={{ fontSize: isNavbar ? '0.55rem' : '0.62rem', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>GET IT ON</span>
              <span style={{ fontSize: isNavbar ? '0.88rem' : '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>Google Play</span>
            </div>
          </button>
        )}

        {/* Official Apple App Store Badge Button */}
        {showIOS && (
          <button
            type="button"
            onClick={handleIosClick}
            className="store-badge-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: isNavbar ? '6px 14px' : '9px 18px',
              minHeight: isNavbar ? '40px' : '52px',
              borderRadius: '12px',
              background: '#050507',
              border: '1.5px solid rgba(255, 255, 255, 0.24)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              flex: isNavbar ? '0 0 auto' : '0 1 auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ea580c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(234, 88, 12, 0.35), 0 4px 14px rgba(0, 0, 0, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.24)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaApple size={isNavbar ? 20 : 25} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.15 }}>
              <span style={{ fontSize: isNavbar ? '0.55rem' : '0.62rem', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>Download on the</span>
              <span style={{ fontSize: isNavbar ? '0.88rem' : '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>App Store</span>
            </div>
          </button>
        )}
      </div>

      {/* Android PWA Install Guide Modal (Fallback) */}
      <Modal
        show={showAndroidModal}
        onHide={() => setShowAndroidModal(false)}
        centered
        className="pwa-guide-modal"
        contentClassName="bg-dark text-white border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" style={{ background: '#180903', color: '#ffffff', borderBottom: '1px solid rgba(234, 88, 12, 0.3)' }}>
          <Modal.Title className="fs-6 fw-bold text-white d-flex align-items-center gap-2">
            <FaCheckCircle color="#10b981" size={20} />
            {t('pwa.installGuideTitle', 'Install YOUR GYM App')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#180903', color: '#f8fafc', fontSize: '0.9rem' }}>
          <p className="mb-3" style={{ fontSize: '0.85rem', color: '#fdba74' }}>
            Follow these simple steps to install the app on your phone:
          </p>
          <ul className="ps-0 mb-3 d-flex flex-column gap-2.5" style={{ lineHeight: '1.5', listStyle: 'none' }}>
            <li className="d-flex align-items-start gap-2.5" style={{ color: '#ffffff' }}>
              <span className="badge bg-warning text-dark me-1" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>1</span>
              <span style={{ color: '#ffffff' }}>{t('pwa.pwaStep1', 'Tap "Install" on the browser popup dialog on your screen.')}</span>
            </li>
            <li className="d-flex align-items-start gap-2.5" style={{ color: '#ffffff' }}>
              <span className="badge bg-warning text-dark me-1" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>2</span>
              <span style={{ color: '#ffffff' }}>{t('pwa.pwaStep2', 'If popup does not appear, tap browser menu (⋮) → select "Install App" or "Add to Home screen".')}</span>
            </li>
            <li className="d-flex align-items-start gap-2.5" style={{ color: '#ffffff' }}>
              <span className="badge bg-warning text-dark me-1" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>3</span>
              <span style={{ color: '#ffffff' }}>{t('pwa.pwaStep3', 'Launch YOUR GYM directly from your home screen like a native mobile app!')}</span>
            </li>
          </ul>
        </Modal.Body>
        <Modal.Footer style={{ background: '#180903', borderTop: '1px solid rgba(234, 88, 12, 0.2)' }}>
          <button
            className="btn btn-sm text-white fw-bold px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '8px' }}
            onClick={() => setShowAndroidModal(false)}
          >
            {t('pwa.gotIt', 'Got it')}
          </button>
        </Modal.Footer>
      </Modal>

      {/* iOS Safari Installation Modal */}
      <Modal
        show={showIosModal}
        onHide={() => setShowIosModal(false)}
        centered
        className="pwa-guide-modal"
        contentClassName="bg-dark text-white border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" style={{ background: '#180903', color: '#ffffff', borderBottom: '1px solid rgba(234, 88, 12, 0.3)' }}>
          <Modal.Title className="fs-6 fw-bold text-white d-flex align-items-center gap-2">
            <FaApple size={20} color="#ffffff" />
            {t('pwa.iosInstallTitle', 'Install YOUR GYM on iPhone & iPad')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#180903', color: '#f8fafc', fontSize: '0.9rem' }}>
          <ol className="ps-3 mb-3 d-flex flex-column gap-2.5" style={{ lineHeight: '1.5', color: '#ffffff' }}>
            <li style={{ color: '#ffffff' }}>{t('pwa.iosStep1', '1. Open this website in Apple Safari browser.')}</li>
            <li style={{ color: '#ffffff' }}>{t('pwa.iosStep2', '2. Tap the Share button ⬆️ / ⎋ at the bottom of Safari.')}</li>
            <li style={{ color: '#ffffff' }}>{t('pwa.iosStep3', '3. Scroll down and tap "Add to Home Screen" ➕.')}</li>
            <li style={{ color: '#ffffff' }}>{t('pwa.iosStep4', '4. Tap "Add" in the top right corner.')}</li>
          </ol>

          <div
            className="p-2.5 rounded-3 d-flex align-items-start gap-2"
            style={{ background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.3)', fontSize: '0.82rem' }}
          >
            <FaExclamationCircle color="#ea580c" size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: '#fdba74' }}>
              {t('pwa.iosNote', 'Note: If using Chrome/Firefox on iOS, please open this URL in Apple Safari for Home Screen installation.')}
            </span>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: '#180903', borderTop: '1px solid rgba(234, 88, 12, 0.2)' }}>
          <button
            className="btn btn-sm text-white fw-bold px-4 py-2"
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '8px' }}
            onClick={handleIosDone}
          >
            {t('pwa.iosDoneBtn', 'Done, I have added it')}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AppDownloadButtons;
