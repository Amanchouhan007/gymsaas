import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enGB from './locales/en-GB.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

const getSavedLanguage = () => {
  let direct = localStorage.getItem('gym_app_language');
  if (direct) {
    if (direct === 'en') return 'en-GB';
    return direct;
  }
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.preferredLanguage) {
        if (u.preferredLanguage === 'en') return 'en-GB';
        return u.preferredLanguage;
      }
    }
  } catch (e) {}
  return 'en-GB';
};

const savedLang = getSavedLanguage();

export const applyDirection = (lang) => {
  const isRtl = lang === 'ar' || (typeof lang === 'string' && lang.startsWith('ar'));
  const dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang || 'en-GB');
  
  if (!isRtl) {
    // Clear Google Translate cookies that lock Chrome in Arabic
    try {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    } catch (e) {}
  }

  if (document.body) {
    document.body.setAttribute('dir', dir);
    if (dir === 'rtl') {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-GB': { translation: enGB },
      'en': { translation: enGB },
      'es': { translation: es },
      'fr': { translation: fr },
      'ar': { translation: ar },
    },
    lng: savedLang,
    fallbackLng: 'en-GB',
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    react: {
      useSuspense: false,
    }
  });

// Apply layout direction immediately on load
applyDirection(i18n.language || savedLang);

// Apply layout direction on language change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('gym_app_language', lng);
  applyDirection(lng);
});

export default i18n;
