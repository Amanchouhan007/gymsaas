import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../Api/axiosInstance";
import {
  FaDatabase,
  FaDownload,
  FaTrash,
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaCog,
  FaUndoAlt,
  FaEnvelope,
  FaShieldAlt,
  FaSpinner,
  FaLock,
  FaPlus,
  FaCalendarAlt,
  FaHdd,
  FaCloudDownloadAlt,
  FaInfoCircle
} from "react-icons/fa";

export default function BackupRestoreSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("history"); // 'history' | 'settings' | 'restore'
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [settings, setSettings] = useState({
    automaticBackupEnabled: true,
    frequencyDays: 7,
    backupTime: "02:00",
    adminEmail: "",
    retentionCount: 10,
    includeDatabase: true,
    includeUploads: true,
    lastBackupAt: null,
    nextBackupAt: null,
    stats: {}
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modals & Selections
  const [selectedBackupDetail, setSelectedBackupDetail] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedRestoreFilename, setSelectedRestoreFilename] = useState("");
  const [confirmRestoreText, setConfirmRestoreText] = useState("");

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await axiosInstance.get("/backups");
      if (res.data?.success) {
        setBackups(Array.isArray(res.data.data) ? res.data.data : []);
        if (res.data.settings && typeof res.data.settings === "object") {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      }
    } catch (err) {
      console.error("Failed to load backup data:", err);
      setErrorMsg(t("backup.fetchError", "Failed to load system backup history and settings."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await axiosInstance.put("/backups/settings", settings);
      if (res.data?.success) {
        setSettings(res.data.data);
        setSuccessMsg(t("backup.saveSuccess", "Backup configuration saved successfully!"));
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setErrorMsg(err.response?.data?.message || t("backup.saveError", "Failed to update backup configuration."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBackupNow = async () => {
    if (!window.confirm(t("backup.confirmManualCreate", "Are you sure you want to generate a complete system backup now?"))) return;

    setActionLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await axiosInstance.post("/backups/create", { type: "Manual" });
      if (res.data?.success) {
        setSuccessMsg(t("backup.createSuccess", "Complete backup package generated and verified successfully!"));
        fetchBackupData();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Manual backup error:", err);
      setErrorMsg(err.response?.data?.message || t("backup.createError", "Backup process failed. Check server logs."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmailNotification = async () => {
    setActionLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await axiosInstance.post("/backups/send-email", { email: settings.adminEmail });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || t("backup.emailSuccess", "Backup notification email sent successfully!"));
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Email notification error:", err);
      setErrorMsg(err.response?.data?.message || t("backup.emailError", "Failed to send backup notification email."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      const response = await axiosInstance.get(`/backups/download/${filename}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert(t("backup.downloadError", "Failed to download backup file."));
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(t("backup.confirmDelete", `Are you sure you want to delete backup '${filename}'?`))) return;

    setActionLoading(true);
    try {
      const res = await axiosInstance.delete(`/backups/${filename}`);
      if (res.data?.success) {
        setSuccessMsg(t("backup.deleteSuccess", "Backup file deleted successfully."));
        fetchBackupData();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg(err.response?.data?.message || t("backup.deleteError", "Failed to delete backup file."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (confirmRestoreText !== "RESTORE") {
      alert(t("backup.typeRestoreConfirm", "Please type 'RESTORE' to confirm restoration."));
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axiosInstance.post("/backups/restore", { filename: selectedRestoreFilename });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || t("backup.restoreSuccess", "System restored successfully!"));
        setShowRestoreModal(false);
        setConfirmRestoreText("");
        fetchBackupData();
      }
    } catch (err) {
      console.error("Restore error:", err);
      setErrorMsg(err.response?.data?.message || t("backup.restoreError", "System restoration failed. Check logs."));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 bg-white p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <FaDatabase style={{ color: "#ea580c" }} />
            {t("backup.title", "Backup & Restore Management")}
          </h4>
          <p className="text-muted mb-0 small">
            {t("backup.subtitle", "Configure server-side automatic backups, manage downloadable packages, and perform disaster recovery.")}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-2"
            onClick={fetchBackupData}
            disabled={loading || actionLoading}
          >
            <FaSync className={loading ? "spin" : ""} />
            {t("common.refresh", "Refresh")}
          </button>
          <button
            className="btn text-white btn-sm rounded-pill d-flex align-items-center gap-2 fw-bold px-3"
            style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", border: "none" }}
            onClick={handleCreateBackupNow}
            disabled={actionLoading}
          >
            {actionLoading ? <FaSpinner className="spin" /> : <FaPlus />}
            {t("backup.createNow", "Create Backup Now")}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center rounded-3 mb-4" role="alert">
          <FaCheckCircle className="me-2 flex-shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center rounded-3 mb-4" role="alert">
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Quick Summary Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 rounded-4 bg-light border d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-primary bg-opacity-10 text-primary">
              <FaCalendarAlt size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">{t("backup.lastBackup", "Last Backup")}</span>
              <span className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>
                {formatDate(settings?.lastBackupAt)}
              </span>
              <div className="mt-1">
                <span className={`badge ${settings?.stats?.lastBackupStatus === 'Success' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: "10px" }}>
                  {settings?.stats?.lastBackupStatus || 'Healthy'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 rounded-4 bg-light border d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-warning bg-opacity-10 text-warning">
              <FaHistory size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">{t("backup.nextBackup", "Next Scheduled")}</span>
              <span className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>
                {settings?.automaticBackupEnabled ? formatDate(settings?.nextBackupAt) : t("common.disabled", "Disabled")}
              </span>
              <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>
                {t("backup.freqLabel", "Every {{count}} Days", { count: settings?.frequencyDays || 7 })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 rounded-4 bg-light border d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-success bg-opacity-10 text-success">
              <FaHdd size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">{t("backup.totalStorage", "Storage Used")}</span>
              <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                {settings?.stats?.totalStorageFormatted || "0 MB"}
              </span>
              <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>
                {t("backup.retentionLabel", "Retention: {{count}} Backups", { count: settings?.retentionCount || 10 })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 rounded-4 bg-light border d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-info bg-opacity-10 text-info">
              <FaShieldAlt size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">{t("backup.status", "Backup Engine")}</span>
              <span className="fw-bold text-success" style={{ fontSize: "0.95rem" }}>
                {settings?.automaticBackupEnabled ? t("common.active", "Active (ON)") : t("common.disabled", "Disabled (OFF)")}
              </span>
              <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>
                DB: {settings?.includeDatabase ? "ON" : "OFF"} • Files: {settings?.includeUploads ? "ON" : "OFF"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4 gap-2">
        <button
          className={`btn border-0 py-2 px-4 fw-bold rounded-top-3 ${activeTab === 'history' ? 'border-bottom border-3 border-primary text-primary bg-light' : 'text-muted'}`}
          onClick={() => setActiveTab('history')}
        >
          <FaHistory className="me-2" />
          {t("backup.tabHistory", "Backup History")} ({backups.length})
        </button>
        <button
          className={`btn border-0 py-2 px-4 fw-bold rounded-top-3 ${activeTab === 'settings' ? 'border-bottom border-3 border-primary text-primary bg-light' : 'text-muted'}`}
          onClick={() => setActiveTab('settings')}
        >
          <FaCog className="me-2" />
          {t("backup.tabSettings", "Backup Settings")}
        </button>
        <button
          className={`btn border-0 py-2 px-4 fw-bold rounded-top-3 ${activeTab === 'restore' ? 'border-bottom border-3 border-primary text-primary bg-light' : 'text-muted'}`}
          onClick={() => setActiveTab('restore')}
        >
          <FaUndoAlt className="me-2" />
          {t("backup.tabRestore", "Restore Data")}
        </button>
      </div>

      {/* Tab 1: Backup History Table */}
      {activeTab === 'history' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0">{t("backup.historyTitle", "System Backup Packages")}</h6>
            <button
              className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-2"
              onClick={handleSendEmailNotification}
              disabled={actionLoading || backups.length === 0}
            >
              <FaEnvelope />
              {t("backup.sendMailBtn", "Send Latest Backup to Email")}
            </button>
          </div>

          <div className="table-responsive border rounded-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-3 text-muted small fw-bold"># {t("backup.colPackage", "Backup Package / ID")}</th>
                  <th className="py-3 px-3 text-muted small fw-bold">{t("common.date", "Date & Time")}</th>
                  <th className="py-3 px-3 text-muted small fw-bold">{t("backup.colSize", "Size")}</th>
                  <th className="py-3 px-3 text-muted small fw-bold">{t("common.type", "Type")}</th>
                  <th className="py-3 px-3 text-muted small fw-bold">{t("common.status", "Status")}</th>
                  <th className="py-3 px-3 text-end text-muted small fw-bold">{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <FaSpinner className="spin text-primary me-2" />
                      {t("common.loading", "Loading backup records...")}
                    </td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted small">
                      {t("backup.noBackups", "No system backups found. Click 'Create Backup Now' to generate one.")}
                    </td>
                  </tr>
                ) : (
                  backups.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-3">
                        <div className="d-flex align-items-center gap-2">
                          <FaDatabase className="text-primary flex-shrink-0" />
                          <div>
                            <div className="fw-bold text-dark small" style={{ wordBreak: "break-all" }}>
                              {item.filename}
                            </div>
                            <div className="text-muted" style={{ fontSize: "11px" }}>
                              ID: {item.backupId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 small text-muted">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="py-3 px-3 fw-semibold small text-dark">
                        {item.sizeFormatted}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`badge rounded-pill px-2.5 py-1 ${item.type === 'Automatic' ? 'bg-primary' : item.type === 'Pre-Restore Safety' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                          {item.type}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {item.status === 'Success' ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                            <FaCheckCircle size={11} /> {t("common.success", "Success")}
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                            <FaExclamationTriangle size={11} /> {t("common.failed", "Failed")}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-outline-info btn-sm rounded-circle p-2"
                            title="View Details"
                            onClick={() => setSelectedBackupDetail(item)}
                          >
                            <FaInfoCircle />
                          </button>
                          {item.status === 'Success' && (
                            <button
                              className="btn btn-outline-primary btn-sm rounded-circle p-2"
                              title="Download Backup ZIP"
                              onClick={() => handleDownloadBackup(item.filename)}
                            >
                              <FaDownload />
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger btn-sm rounded-circle p-2"
                            title="Delete Backup"
                            onClick={() => handleDeleteBackup(item.filename)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Backup Configuration Form */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="p-3 bg-light rounded-4 border">
          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <FaCog style={{ color: "#ea580c" }} />
            {t("backup.configTitle", "Server-Side Automatic Backup Configuration")}
          </h6>

          <div className="row g-3">
            {/* Automatic Backup Switch */}
            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <label className="form-label fw-bold mb-0 text-dark">
                    {t("backup.autoBackupSwitch", "Automatic Scheduled Backup")}
                  </label>
                  <div className="text-muted small">
                    {t("backup.autoBackupDesc", "Enable automated server background backups.")}
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.automaticBackupEnabled}
                    onChange={(e) => setSettings({ ...settings, automaticBackupEnabled: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {/* Admin Email */}
            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-3 border">
                <label className="form-label fw-bold text-dark mb-1">
                  {t("backup.adminEmailLabel", "Admin Email for Backup Notifications")} *
                </label>
                <input
                  type="email"
                  className="form-control border fw-semibold"
                  placeholder="admin@gym.com"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  required
                />
                <small className="text-muted">
                  {t("backup.emailDesc", "Receives backup completion reports and attachments.")}
                </small>
              </div>
            </div>

            {/* Frequency Select */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-white rounded-3 border">
                <label className="form-label fw-bold text-dark mb-1">
                  {t("backup.frequencyLabel", "Backup Frequency")}
                </label>
                <select
                  className="form-select border fw-bold"
                  value={settings.frequencyDays}
                  onChange={(e) => setSettings({ ...settings, frequencyDays: parseInt(e.target.value, 10) })}
                >
                  <option value={1}>Every 1 Day</option>
                  <option value={3}>Every 3 Days</option>
                  <option value={7}>Every 7 Days (Default)</option>
                  <option value={15}>Every 15 Days</option>
                  <option value={30}>Every 30 Days</option>
                </select>
              </div>
            </div>

            {/* Backup Time */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-white rounded-3 border">
                <label className="form-label fw-bold text-dark mb-1">
                  {t("backup.timeLabel", "Scheduled Backup Time")}
                </label>
                <input
                  type="time"
                  className="form-control border fw-bold"
                  value={settings.backupTime}
                  onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })}
                />
              </div>
            </div>

            {/* Retention Select */}
            <div className="col-12 col-md-4">
              <div className="p-3 bg-white rounded-3 border">
                <label className="form-label fw-bold text-dark mb-1">
                  {t("backup.retentionCountLabel", "Backup Retention Policy")}
                </label>
                <select
                  className="form-select border fw-bold"
                  value={settings.retentionCount}
                  onChange={(e) => setSettings({ ...settings, retentionCount: parseInt(e.target.value, 10) })}
                >
                  <option value={5}>Keep Last 5 Backups</option>
                  <option value={10}>Keep Last 10 Backups (Default)</option>
                  <option value={30}>Keep Last 30 Backups</option>
                </select>
              </div>
            </div>

            {/* Scope Toggles */}
            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <label className="form-label fw-bold mb-0 text-dark">
                    {t("backup.includeDbLabel", "Include Full Database Dump")}
                  </label>
                  <div className="text-muted small">
                    {t("backup.includeDbDesc", "Dumps all application tables (schema.sql & database.sql).")}
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.includeDatabase}
                    onChange={(e) => setSettings({ ...settings, includeDatabase: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <label className="form-label fw-bold mb-0 text-dark">
                    {t("backup.includeUploadsLabel", "Include Uploaded Files / Media")}
                  </label>
                  <div className="text-muted small">
                    {t("backup.includeUploadsDesc", "Includes member photos, logos, attachments inside ZIP.")}
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.includeUploads}
                    onChange={(e) => setSettings({ ...settings, includeUploads: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-end">
            <button
              type="submit"
              className="btn text-white fw-bold px-4 py-2.5 rounded-pill shadow-sm"
              style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", border: "none" }}
              disabled={actionLoading}
            >
              {actionLoading ? <FaSpinner className="spin me-2" /> : <FaCheckCircle className="me-2" />}
              {t("backup.saveSettingsBtn", "Save Backup Settings")}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Restore Management */}
      {activeTab === 'restore' && (
        <div className="p-3 p-md-4 bg-light rounded-4 border">
          <div className="p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 mb-4 d-flex gap-3 align-items-start">
            <FaExclamationTriangle size={24} className="text-danger flex-shrink-0 mt-1" />
            <div>
              <h6 className="fw-bold text-danger mb-1 fs-6">
                {t("backup.restoreWarningTitle", "System Restoration Caution")}
              </h6>
              <p className="text-muted small mb-0">
                {t(
                  "backup.restoreWarningDesc",
                  "Restoring a backup will overwrite existing database records with the contents of the selected package. Before executing restoration, a safety backup of your current database will automatically be generated."
                )}
              </p>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label fw-bold text-dark fs-6">
                {t("backup.selectRestoreFile", "Select Backup Package to Restore")}
              </label>
              <select
                className="form-select form-select-lg border fw-bold mb-3"
                value={selectedRestoreFilename}
                onChange={(e) => setSelectedRestoreFilename(e.target.value)}
              >
                <option value="">-- {t("backup.choosePackage", "Select a valid backup package")} --</option>
                {backups
                  .filter((b) => b.status === "Success")
                  .map((b) => (
                    <option key={b.id || b.filename} value={b.filename}>
                      {b.filename} ({b.sizeFormatted}) — {formatDate(b.createdAt)}
                    </option>
                  ))}
              </select>

              <button
                className="btn btn-danger fw-bold px-4 py-2.5 rounded-pill shadow-sm"
                disabled={!selectedRestoreFilename || actionLoading}
                onClick={() => setShowRestoreModal(true)}
              >
                <FaUndoAlt className="me-2" />
                {t("backup.proceedRestoreBtn", "Proceed to Restore System")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedBackupDetail && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">
                  <FaInfoCircle className="me-2 text-primary" />
                  Backup Package Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedBackupDetail(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="bg-light p-3 rounded-3 mb-3 border">
                  <div className="row g-2 small">
                    <div className="col-4 text-muted">Backup ID:</div>
                    <div className="col-8 fw-bold text-dark">{selectedBackupDetail.backupId}</div>
                    <div className="col-4 text-muted">Filename:</div>
                    <div className="col-8 fw-semibold text-primary">{selectedBackupDetail.filename}</div>
                    <div className="col-4 text-muted">Size:</div>
                    <div className="col-8 fw-semibold">{selectedBackupDetail.sizeFormatted}</div>
                    <div className="col-4 text-muted">Created Date:</div>
                    <div className="col-8 fw-semibold">{formatDate(selectedBackupDetail.createdAt)}</div>
                    <div className="col-4 text-muted">Type:</div>
                    <div className="col-8 fw-semibold">{selectedBackupDetail.type}</div>
                    <div className="col-4 text-muted">Status:</div>
                    <div className="col-8 fw-bold text-success">{selectedBackupDetail.status}</div>
                    <div className="col-4 text-muted">SHA-256 Checksum:</div>
                    <div className="col-8 font-monospace small text-muted" style={{ wordBreak: "break-all" }}>
                      {selectedBackupDetail.checksum || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedBackupDetail(null)}>
                  {t("common.close", "Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strong Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg border-top border-4 border-danger">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <FaExclamationTriangle />
                  {t("backup.confirmRestoreTitle", "Confirm System Restoration")}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRestoreModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-3">
                  You are about to restore the system using <strong>{selectedRestoreFilename}</strong>. This action will overwrite existing database data.
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Type <span className="text-danger fw-bold">RESTORE</span> below to confirm:
                  </label>
                  <input
                    type="text"
                    className="form-control border-danger fw-bold text-center"
                    placeholder="RESTORE"
                    value={confirmRestoreText}
                    onChange={(e) => setConfirmRestoreText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowRestoreModal(false)}>
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-bold"
                  disabled={confirmRestoreText !== "RESTORE" || actionLoading}
                  onClick={handleExecuteRestore}
                >
                  {actionLoading ? <FaSpinner className="spin me-2" /> : <FaUndoAlt className="me-2" />}
                  {t("backup.executeRestoreNow", "Execute Restore Now")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
