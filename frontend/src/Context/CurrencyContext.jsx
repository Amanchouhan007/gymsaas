import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../Api/axiosInstance";

// ── Supported Currencies Registry ──────────────────────────────────────────
export const CURRENCIES = [
  { id: "INR", code: "INR", symbol: "₹", name: "Indian Rupee", country: "India", flag: "🇮🇳", languages: "Hindi, English", locale: "en-IN", decimals: 2 },
  { id: "USD", code: "USD", symbol: "$", name: "US Dollar", country: "USA", flag: "🇺🇸", languages: "English", locale: "en-US", decimals: 2 },
  { id: "GBP", code: "GBP", symbol: "£", name: "Pound Sterling", country: "UK", flag: "🇬🇧", languages: "English", locale: "en-GB", decimals: 2 },
  { id: "AED", code: "AED", symbol: "د.إ", name: "UAE Dirham", country: "UAE", flag: "🇦🇪", languages: "Arabic, English", locale: "ar-AE", decimals: 2 },
  { id: "EUR_DE", code: "EUR", symbol: "€", name: "Euro - Germany", country: "Germany", flag: "🇩🇪", languages: "German", locale: "de-DE", decimals: 2 },
  { id: "EUR_ES", code: "EUR", symbol: "€", name: "Euro - Spain", country: "Spain", flag: "🇪🇸", languages: "Spanish (Español)", locale: "es-ES", decimals: 2 },
];

const DEFAULT_BASE_CURRENCY = "INR";
const STORAGE_KEY_CURRENCY = "app_currency_code";
const STORAGE_KEY_RATES = "app_exchange_rates";
const STORAGE_KEY_RATES_TIME = "app_exchange_rates_time";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENCY) || DEFAULT_BASE_CURRENCY;
  });

  const [rates, setRates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATES);
      return saved ? JSON.parse(saved) : { INR: 1 };
    } catch {
      return { INR: 1 };
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Active currency object
  const currentCurrency = CURRENCIES.find((c) => c.id === currencyCode || c.code === currencyCode) || CURRENCIES[0];

  // ── 1. Fetch Exchange Rates ────────────────────────────────────────────────
  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary API: open.er-api.com
      let response = await fetch(`https://open.er-api.com/v6/latest/${DEFAULT_BASE_CURRENCY}`);
      let data = await response.json();

      if (!data || !data.rates) {
        // Fallback API: exchangerate-api.com
        response = await fetch(`https://api.exchangerate-api.com/v4/latest/${DEFAULT_BASE_CURRENCY}`);
        data = await response.json();
      }

      if (data && data.rates) {
        setRates(data.rates);
        setLastUpdated(new Date());
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(data.rates));
        localStorage.setItem(STORAGE_KEY_RATES_TIME, new Date().toISOString());
      } else {
        throw new Error("Failed to load rates");
      }
    } catch (err) {
      console.warn("Exchange rate API fetch failed, using cached rates:", err.message);
      setError("Unable to refresh live exchange rates. Using cached rates.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 2. Sync Settings with DB ────────────────────────────────────────────────
  const syncCurrencyFromDB = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const adminId = user.id || user.adminId;
      if (!adminId) return;

      const res = await axiosInstance.get(`/adminSettings/app-settings/admin/${adminId}`);
      if (res.data?.data?.currency) {
        const dbCode = res.data.data.currency;
        setCurrencyCode(dbCode);
        localStorage.setItem(STORAGE_KEY_CURRENCY, dbCode);
      }
    } catch (e) {
      // Non-blocking sync error
    }
  }, []);

  useEffect(() => {
    fetchRates();
    syncCurrencyFromDB();
  }, [fetchRates, syncCurrencyFromDB]);

  // Listen for currency update events across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_CURRENCY && e.newValue) {
        setCurrencyCode(e.newValue);
      }
    };
    const handleCustomEvent = (e) => {
      if (e.detail?.code) {
        setCurrencyCode(e.detail.code);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("currencyChanged", handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("currencyChanged", handleCustomEvent);
    };
  }, []);

  // ── 3. Change Currency Handler ──────────────────────────────────────────────
  const changeCurrency = async (newCode, settingsId = null) => {
    const found = CURRENCIES.find((c) => c.id === newCode || c.code === newCode);
    if (!found) return;

    const targetId = found.id;
    setCurrencyCode(targetId);
    localStorage.setItem(STORAGE_KEY_CURRENCY, targetId);
    window.dispatchEvent(new CustomEvent("currencyChanged", { detail: { code: targetId } }));

    // Update in backend app_settings if logged in
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const adminId = user.id || user.adminId;
        if (adminId) {
          // Check if setting exists
          const res = await axiosInstance.get(`/adminSettings/app-settings/admin/${adminId}`);
          const currentSettings = res.data?.data;

          if (currentSettings && currentSettings.id) {
            await axiosInstance.put(`/adminSettings/app-settings/${currentSettings.id}`, {
              currency: targetId,
              adminId,
            });
          } else {
            await axiosInstance.post(`/adminSettings/app-settings`, {
              currency: targetId,
              adminId,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to persist currency to backend:", e.message);
    }
  };

  // ── 4. Conversion Logic ─────────────────────────────────────────────────────
  /**
   * Convert an amount from base currency (INR) or specified fromCode to target currency
   */
  const convert = useCallback((amount, fromCode = DEFAULT_BASE_CURRENCY) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount === 0) return 0;

    const fromRate = rates[fromCode] || 1;
    const toRate = rates[currentCurrency.code] || 1;

    // Convert from source -> base -> target
    const inBase = numericAmount / fromRate;
    const converted = inBase * toRate;
    return converted;
  }, [rates, currentCurrency.code]);

  /**
   * Format converted amount into proper international currency string
   * e.g., formatCurrency(100) -> "$1.19" or "₹100.00"
   */
  const formatCurrency = useCallback((amount, fromCode = DEFAULT_BASE_CURRENCY, customDecimals = null) => {
    const converted = convert(amount, fromCode);
    const dec = customDecimals !== null ? customDecimals : currentCurrency.decimals;

    try {
      return new Intl.NumberFormat(currentCurrency.locale, {
        style: "currency",
        currency: currentCurrency.code,
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      }).format(converted);
    } catch (err) {
      // Fallback formatting
      return `${currentCurrency.symbol} ${converted.toFixed(dec)}`;
    }
  }, [convert, currentCurrency]);

  /**
   * Format raw amount directly without conversion
   */
  const rawFormat = useCallback((amount, code = currentCurrency.code) => {
    const target = CURRENCIES.find((c) => c.code === code) || currentCurrency;
    const numericAmount = parseFloat(amount) || 0;
    try {
      return new Intl.NumberFormat(target.locale, {
        style: "currency",
        currency: target.code,
        minimumFractionDigits: target.decimals,
        maximumFractionDigits: target.decimals,
      }).format(numericAmount);
    } catch {
      return `${target.symbol} ${numericAmount.toFixed(target.decimals)}`;
    }
  }, [currentCurrency]);

  const value = {
    currencies: CURRENCIES,
    currency: currentCurrency,
    currencyCode,
    rates,
    loading,
    error,
    lastUpdated,
    changeCurrency,
    convert,
    formatCurrency,
    rawFormat,
    fetchRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export default CurrencyContext;
