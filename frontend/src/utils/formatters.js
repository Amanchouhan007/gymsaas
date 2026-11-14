import i18n from '../i18n';

/**
 * Format date according to active language locale
 * @param {Date|string|number} dateValue 
 * @param {Object} options 
 * @returns {string} Formatted date string
 */
export const formatAppDate = (dateValue, options = {}) => {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    
    const lang = i18n.language || 'en-GB';
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    return new Intl.DateTimeFormat(lang, defaultOptions).format(d);
  } catch (e) {
    return String(dateValue);
  }
};

const CURRENCY_LOCALES = {
  INR: { locale: 'en-IN', symbol: '₹' },
  USD: { locale: 'en-US', symbol: '$' },
  GBP: { locale: 'en-GB', symbol: '£' },
  AED: { locale: 'ar-AE', symbol: 'د.إ' },
  EUR: { locale: 'de-DE', symbol: '€' },
  EUR_DE: { locale: 'de-DE', symbol: '€' },
  EUR_ES: { locale: 'es-ES', symbol: '€' },
};

/**
 * Format currency according to active global currency and exchange rates
 * @param {number} amount 
 * @param {string} overrideCurrency 
 * @returns {string} Formatted currency string
 */
export const formatAppCurrency = (amount, overrideCurrency = null) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0.00';
  const code = overrideCurrency || localStorage.getItem("app_currency_code") || "INR";
  const baseCode = code.startsWith("EUR") ? "EUR" : code;
  let num = Number(amount);
  
  // Convert from base INR if code is different
  if (baseCode !== "INR") {
    const savedRates = localStorage.getItem("app_exchange_rates");
    if (savedRates) {
      try {
        const rates = JSON.parse(savedRates);
        if (rates && rates[baseCode]) {
          num = num * rates[baseCode];
        }
      } catch (rErr) {}
    }
  }

  const meta = CURRENCY_LOCALES[code] || CURRENCY_LOCALES[baseCode] || { locale: 'en-US', symbol: baseCode };
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: baseCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (e) {
    return `${meta.symbol} ${num.toFixed(2)}`;
  }
};

/**
 * Format number according to active language locale
 * @param {number} num 
 * @returns {string} Formatted number
 */
export const formatAppNumber = (num) => {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  try {
    const lang = i18n.language || 'en-GB';
    return new Intl.NumberFormat(lang).format(Number(num));
  } catch (e) {
    return String(num);
  }
};
