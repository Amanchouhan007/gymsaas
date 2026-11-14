import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';
import { applyDirection } from '../i18n';

const languages = [
  { code: 'en-GB', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const LanguageSelector = ({ variant = 'default', showLabel = true }) => {
  const { i18n, t } = useTranslation();

  const getCurrentLangCode = () => {
    const lng = i18n.language || localStorage.getItem('gym_app_language') || 'en-GB';
    if (languages.some(l => l.code === lng)) return lng;
    if (lng.startsWith('ar')) return 'ar';
    if (lng.startsWith('es')) return 'es';
    if (lng.startsWith('fr')) return 'fr';
    if (lng.startsWith('en')) return 'en-GB';
    return 'en-GB';
  };

  const [selectedLang, setSelectedLang] = useState(() => getCurrentLangCode());

  useEffect(() => {
    setSelectedLang(getCurrentLangCode());
  }, [i18n.language]);

  const handleLanguageChange = (e) => {
    let newLang = e.target.value;
    if (newLang === 'en') newLang = 'en-GB';

    setSelectedLang(newLang);
    localStorage.setItem('gym_app_language', newLang);

    // Clear Google Translate cookies & DOM translation overrides
    try {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
    } catch (err) {}

    // Save in user object in localStorage if present
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.preferredLanguage = newLang;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    } catch (err) {}

    i18n.changeLanguage(newLang);
    applyDirection(newLang);

    // Immediate forced reload to guarantee clean language switch
    window.location.reload();
  };

  if (variant === 'compact') {
    return (
      <div className="position-relative d-inline-flex align-items-center">
        <FaGlobe 
          style={{ 
            color: '#ea580c', 
            fontSize: '1rem', 
            position: 'absolute', 
            left: '12px', 
            pointerEvents: 'none', 
            zIndex: 5 
          }} 
        />
        <select
          aria-label={t('common.language', 'Select Language')}
          value={selectedLang}
          onChange={handleLanguageChange}
          className="form-select form-select-sm shadow-sm fw-bold"
          style={{ 
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1.5px solid #ea580c',
            borderRadius: '20px',
            fontSize: '0.85rem',
            paddingLeft: '32px',
            paddingRight: '28px',
            height: '36px',
            cursor: 'pointer',
            fontWeight: '700',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
          }}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} style={{ color: '#0f172a', backgroundColor: '#ffffff', fontWeight: '600' }}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4 bg-light">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center mb-2">
          <FaGlobe className="text-primary me-2 ms-2 fs-5" />
          <h5 className="mb-0 fw-bold">{t('settings.languageSection', 'Language Settings')}</h5>
        </div>
        <p className="text-muted small mb-3">{t('settings.languageHelp', 'Select your preferred language for the application interface.')}</p>
        <div className="row align-items-center">
          <div className="col-md-6 col-lg-5">
            <label className="form-label fw-semibold small text-secondary">
              {t('settings.languageLabel', 'Select Language')}
            </label>
            <select
              aria-label={t('settings.languageLabel', 'Select Language')}
              className="form-select form-select-lg shadow-sm"
              value={selectedLang}
              onChange={handleLanguageChange}
              style={{ fontWeight: '500' }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;

