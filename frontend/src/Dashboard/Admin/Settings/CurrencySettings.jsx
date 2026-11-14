import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../Context/CurrencyContext";
import { useTranslation } from "react-i18next";
import {
  FaCoins,
  FaSearch,
  FaCheck,
  FaSync,
  FaInfoCircle,
  FaExchangeAlt,
  FaShieldAlt,
  FaSpinner,
  FaChevronDown,
} from "react-icons/fa";

export default function CurrencySettings() {
  const { t } = useTranslation();
  const {
    currencies,
    currency,
    currencyCode,
    rates,
    loading,
    error,
    lastUpdated,
    changeCurrency,
    formatCurrency,
    convert,
    fetchRates,
  } = useCurrency();

  const [selectedCode, setSelectedCode] = useState(currencyCode);
  const [searchQuery, setSearchQuery] = useState("");
  const [demoAmount, setDemoAmount] = useState(1000);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setSelectedCode(currencyCode);
  }, [currencyCode]);

  const filteredCurrencies = currencies.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      (c.code && c.code.toLowerCase().includes(query)) ||
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.country && c.country.toLowerCase().includes(query)) ||
      (c.languages && c.languages.toLowerCase().includes(query)) ||
      (c.symbol && c.symbol.includes(query))
    );
  });

  const selectedItem = currencies.find((c) => (c.id || c.code) === selectedCode) || currency;

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      await changeCurrency(selectedCode);
      setSuccessMsg(
        t("currency.saveSuccess", "Currency updated successfully! System prices updated across all dashboards.")
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentRate = rates[selectedItem?.code || selectedCode] || 1;

  return (
    <div className="card border-0 shadow-sm rounded-4 bg-white p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <FaCoins style={{ color: "#ea580c" }} />
            {t("currency.title", "System Currency & Exchange Rates")}
          </h4>
          <p className="text-muted mb-0 small">
            {t(
              "currency.subtitle",
              "Configure global currency for prices, invoices, revenue, and financial reports. Real-time rates apply live."
            )}
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-2 align-self-start align-self-md-auto"
          onClick={fetchRates}
          disabled={loading}
        >
          <FaSync className={loading ? "spin" : ""} />
          {loading ? t("currency.refreshing", "Refreshing Rates...") : t("currency.refreshRates", "Refresh Live Rates")}
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center rounded-3 mb-4" role="alert">
          <FaCheck className="me-2 flex-shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-warning d-flex align-items-center rounded-3 mb-4" role="alert">
          <FaInfoCircle className="me-2 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Currency Selector & Info */}
        <div className="col-12 col-lg-7">
          <div className="mb-4 position-relative">
            <label className="form-label fw-bold text-dark fs-6">
              {t("currency.selectCurrency", "Select System Display Currency")}
            </label>
            <p className="text-muted small mb-3">
              {t("currency.selectHelp", "Search and select the currency to use across the entire Gym SaaS.")}
            </p>

            {/* Standard Native Select (Alternative / Direct) */}
            <div className="mb-3">
              <select
                className="form-select form-select-lg fw-bold border-2 border-primary rounded-3 shadow-sm"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                style={{ fontSize: "1rem", cursor: "pointer" }}
              >
                {currencies.map((c) => (
                  <option key={c.id || c.code} value={c.id || c.code}>
                    {c.flag} {c.country} — {c.name} ({c.code} {c.symbol}) | {c.languages}
                  </option>
                ))}
              </select>
            </div>

            {/* Searchable Custom Interactive Dropdown Select */}
            <div className="dropdown w-100 mb-3">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 p-3 text-start bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-between border-2"
                style={{ borderColor: "#ea580c" }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="d-flex align-items-center gap-3">
                  <span style={{ fontSize: "1.8rem" }}>{selectedItem?.flag}</span>
                  <div>
                    <div className="fw-bold text-dark fs-6">
                      {selectedItem?.country} — {selectedItem?.name} ({selectedItem?.code} {selectedItem?.symbol})
                    </div>
                    <div className="text-muted small">
                      🗣️ {t("common.language", "Languages")}: {selectedItem?.languages}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark px-2 py-1 small rounded-pill">
                    {t("common.selected", "Selected")}
                  </span>
                  <FaChevronDown className="text-muted ms-1" />
                </div>
              </button>

              {isDropdownOpen && (
                <div
                  className="dropdown-menu show w-100 p-3 shadow-lg border-0 rounded-4 mt-2 position-absolute"
                  style={{ zIndex: 1050, maxHeight: "360px", overflowY: "auto", top: "100%", left: 0 }}
                >
                  {/* Search Filter inside Dropdown */}
                  <div className="input-group mb-3 sticky-top bg-white pt-1">
                    <span className="input-group-text bg-light border-end-0">
                      <FaSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-light"
                      placeholder={t("currency.searchPlaceholder", "Search by country, currency code, language (e.g., India, USD, Euro, Spanish...)")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Filtered Dropdown Items */}
                  <div className="d-flex flex-column gap-1">
                    {filteredCurrencies.map((c) => {
                      const itemKey = c.id || c.code;
                      const isSelected = selectedCode === itemKey;
                      return (
                        <div
                          key={itemKey}
                          className={`p-2.5 px-3 rounded-3 d-flex align-items-center justify-content-between cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white fw-bold shadow-sm"
                              : "hover-bg-light text-dark"
                          }`}
                          style={{ cursor: "pointer", transition: "all 0.15s" }}
                          onClick={() => {
                            setSelectedCode(itemKey);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span style={{ fontSize: "1.5rem" }}>{c.flag}</span>
                            <div>
                              <div className="fw-bold" style={{ fontSize: "0.93rem" }}>
                                {c.country} — {c.name} ({c.code} {c.symbol})
                              </div>
                              <div
                                className={`small ${isSelected ? "text-white-50" : "text-muted"}`}
                                style={{ fontSize: "0.76rem" }}
                              >
                                🗣️ {c.languages}
                              </div>
                            </div>
                          </div>
                          {isSelected && <FaCheck className="text-white ms-2 flex-shrink-0" />}
                        </div>
                      );
                    })}
                    {filteredCurrencies.length === 0 && (
                      <div className="text-center py-3 text-muted small">
                        No currencies match your search.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Database Safety Notice */}
          <div className="p-3 rounded-3 bg-light border border-info border-opacity-25 d-flex gap-3 align-items-start">
            <FaShieldAlt size={22} className="text-info mt-1 flex-shrink-0" />
            <div>
              <h6 className="fw-bold mb-1 text-dark fs-6">
                {t("currency.dbSafetyTitle", "Database Protection Policy")}
              </h6>
              <p className="text-muted small mb-0">
                {t(
                  "currency.dbSafetyDesc",
                  "Original database monetary amounts remain intact. Currency conversion is calculated dynamically to prevent double-conversion errors when switching between currencies."
                )}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-4">
            <button
              className="btn text-white fw-bold px-4 py-2.5 rounded-pill shadow-sm"
              style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", border: "none" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <FaSpinner className="spin me-2" />
                  {t("common.saving", "Saving...")}
                </>
              ) : (
                <>
                  <FaCheck className="me-2" />
                  {t("currency.saveCurrencyBtn", "Save Selected Currency")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Rate & Converter Demo */}
        <div className="col-12 col-lg-5">
          <div className="p-4 rounded-4 bg-light border border-light h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FaExchangeAlt style={{ color: "#2563eb" }} />
                {t("currency.liveExchangeTitle", "Live Exchange Rate Info")}
              </h5>

              {/* Selected Currency Card */}
              <div className="p-3 bg-white rounded-3 border mb-3 shadow-sm">
                <div className="text-muted small mb-1">{t("currency.selectedCurrency", "Selected Currency")}:</div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontSize: "1.8rem" }}>{selectedItem.flag}</span>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">
                      {selectedItem.code} ({selectedItem.symbol})
                    </h5>
                    <span className="text-muted small">{selectedItem.name}</span>
                  </div>
                </div>
                <div className="border-top pt-2 mt-2 d-flex justify-content-between text-muted small">
                  <span>{t("currency.exchangeRate", "Exchange Rate")} (1 INR):</span>
                  <span className="fw-bold text-primary">
                    {currentRate.toFixed(4)} {selectedItem.code}
                  </span>
                </div>
              </div>

              {/* Live Interactive Converter Demo */}
              <div className="p-3 bg-white rounded-3 border shadow-sm mb-3">
                <h6 className="fw-bold text-dark mb-2 fs-6">
                  {t("currency.converterDemo", "Live Rate Converter Preview")}
                </h6>
                <div className="mb-3">
                  <label className="form-label small text-muted mb-1">
                    {t("currency.baseAmount", "Base Price (INR ₹)")}:
                  </label>
                  <input
                    type="number"
                    className="form-control border fw-bold text-dark"
                    value={demoAmount}
                    onChange={(e) => setDemoAmount(e.target.value)}
                  />
                </div>
                <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 text-center">
                  <div className="text-muted small mb-1">
                    {t("currency.convertedDisplay", "Display Price in System")}:
                  </div>
                  <h3 className="fw-bold text-primary mb-0">
                    {formatCurrency(demoAmount)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Last Updated Timestamp */}
            <div className="text-center text-muted small mt-2">
              <i className="fas fa-clock me-1"></i>
              {t("currency.lastUpdated", "Rates last updated")}:{" "}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : t("currency.liveOnline", "Live via Open ER-API")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
