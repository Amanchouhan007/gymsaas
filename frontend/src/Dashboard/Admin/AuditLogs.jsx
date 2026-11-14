import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faSync,
  faDownload,
  faFilter,
  faSearch,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faUserShield,
  faEye,
  faCalendarAlt,
  faLaptop,
  faExchangeAlt,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { formatAppDate } from "../../utils/formatters";
import CustomDatePicker from "../../components/CustomDatePicker";

const AuditLogs = () => {
  const { t } = useTranslation();

  // State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    eventsToday: 0,
    failedEvents: 0,
    criticalEvents: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [gymAdmins, setGymAdmins] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Pagination & Sorting State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Filters State
  const [filters, setFilters] = useState({
    gymAdminId: "ALL",
    startDate: "",
    endDate: "",
    module: "ALL",
    action: "ALL",
    status: "ALL",
    severity: "ALL",
    search: "",
  });

  // Modal Detail State
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const role = (localStorage.getItem("userRole") || "").toUpperCase();
    const isSuper = role.includes("SUPERADMIN") || role.includes("SUPER_ADMIN");
    setIsSuperAdmin(isSuper);

    if (isSuper) {
      axiosInstance.get("/auth/admins")
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.admins)) {
            setGymAdmins(res.data.admins);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = async (overridePage, overrideFilters) => {
    setLoading(true);
    try {
      const pageToFetch = overridePage !== undefined ? overridePage : pagination.page;
      const activeFilters = overrideFilters || filters;
      const queryParams = new URLSearchParams();

      queryParams.append("page", pageToFetch);
      queryParams.append("limit", pagination.limit);
      queryParams.append("sortBy", sortBy);
      queryParams.append("sortOrder", sortOrder);

      if (activeFilters.gymAdminId && activeFilters.gymAdminId !== "ALL") {
        queryParams.append("gymAdminId", activeFilters.gymAdminId);
      }
      if (activeFilters.startDate) queryParams.append("startDate", activeFilters.startDate);
      if (activeFilters.endDate) queryParams.append("endDate", activeFilters.endDate);
      if (activeFilters.module && activeFilters.module !== "ALL") queryParams.append("module", activeFilters.module);
      if (activeFilters.action && activeFilters.action !== "ALL") queryParams.append("action", activeFilters.action);
      if (activeFilters.status && activeFilters.status !== "ALL") queryParams.append("status", activeFilters.status);
      if (activeFilters.severity && activeFilters.severity !== "ALL") queryParams.append("severity", activeFilters.severity);
      if (activeFilters.search) queryParams.append("search", activeFilters.search.trim());

      const res = await axiosInstance.get(`/audit-logs?${queryParams.toString()}`);
      if (res?.data?.success) {
        setLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
        setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stats Summary
  const fetchAuditStats = async (overrideFilters) => {
    try {
      const activeFilters = overrideFilters || filters;
      const queryParams = new URLSearchParams();
      if (activeFilters.gymAdminId && activeFilters.gymAdminId !== "ALL") {
        queryParams.append("gymAdminId", activeFilters.gymAdminId);
      }
      const res = await axiosInstance.get(`/audit-logs/stats?${queryParams.toString()}`);
      if (res?.data?.success && res?.data?.stats) {
        setStats({
          totalEvents: res.data.stats.totalEvents || 0,
          eventsToday: res.data.stats.eventsToday || 0,
          failedEvents: res.data.stats.failedEvents || 0,
          criticalEvents: res.data.stats.criticalEvents || 0,
          activeUsers: res.data.stats.activeUsers || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error);
    }
  };

  useEffect(() => {
    fetchAuditStats();
    fetchAuditLogs(1);
  }, [sortBy, sortOrder]);

  const handleFilterSubmit = (e) => {
    e?.preventDefault();
    fetchAuditStats(filters);
    fetchAuditLogs(1, filters);
  };

  const handleResetFilters = () => {
    const initialFilters = {
      gymAdminId: "ALL",
      startDate: "",
      endDate: "",
      module: "ALL",
      action: "ALL",
      status: "ALL",
      severity: "ALL",
      search: "",
    };
    setFilters(initialFilters);
    fetchAuditStats(initialFilters);
    fetchAuditLogs(1, initialFilters);
  };

  // Handle Export CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.gymAdminId && filters.gymAdminId !== "ALL") queryParams.append("gymAdminId", filters.gymAdminId);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.module && filters.module !== "ALL") queryParams.append("module", filters.module);
      if (filters.action && filters.action !== "ALL") queryParams.append("action", filters.action);
      if (filters.status && filters.status !== "ALL") queryParams.append("status", filters.status);
      if (filters.severity && filters.severity !== "ALL") queryParams.append("severity", filters.severity);
      if (filters.search) queryParams.append("search", filters.search.trim());

      const res = await axiosInstance.get(`/audit-logs/export?${queryParams.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      alert("Failed to export audit logs.");
    } finally {
      setExporting(false);
    }
  };

  // Badges & Formatting Helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1.5 rounded-pill"><FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Success</span>;
      case "FAILED":
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1.5 rounded-pill"><FontAwesomeIcon icon={faTimesCircle} className="me-1" /> Failed</span>;
      default:
        return <span className="badge bg-secondary px-2.5 py-1.5 rounded-pill">{status}</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="badge bg-danger text-white px-2.5 py-1.5 rounded-pill fw-bold"><FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> CRITICAL</span>;
      case "WARNING":
        return <span className="badge bg-warning text-dark px-2.5 py-1.5 rounded-pill fw-semibold"><FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> WARNING</span>;
      case "INFO":
      default:
        return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1.5 rounded-pill"><FontAwesomeIcon icon={faInfoCircle} className="me-1" /> INFO</span>;
    }
  };

  const getModuleBadgeStyle = (module) => {
    switch (module) {
      case "AUTHENTICATION":
      case "AUTH":
        return { backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "600" };
      case "USER_MANAGEMENT":
      case "STAFF":
        return { backgroundColor: "#4b5563", color: "#ffffff", fontWeight: "600" };
      case "MEMBERS":
        return { backgroundColor: "#16a34a", color: "#ffffff", fontWeight: "600" };
      case "BILLING":
      case "FINANCIAL":
        return { backgroundColor: "#d97706", color: "#ffffff", fontWeight: "600" };
      case "SETTINGS":
      case "SECURITY":
        return { backgroundColor: "#dc2626", color: "#ffffff", fontWeight: "600" };
      default:
        return { backgroundColor: "#4f46e5", color: "#ffffff", fontWeight: "600" };
    }
  };

  const parseJsonSafe = (jsonStr) => {
    if (!jsonStr) return null;
    if (typeof jsonStr === "object") return jsonStr;
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return jsonStr;
    }
  };

  const formatTimeString = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString();
  };

  return (
    <div className="container-fluid p-2 p-md-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100dvh" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center flex-wrap" style={{ fontSize: "1.65rem" }}>
            <FontAwesomeIcon icon={faClipboardList} className="text-primary me-2" />
            {t("auditLogs.title", "Audit Logs & Security Trail")}
          </h2>
          <p className="text-muted mb-0 small">
            {t("auditLogs.subtitle", "Track system actions, authentication events, user role changes, and data modifications.")}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
          <button
            className="btn btn-outline-secondary shadow-sm px-3 d-inline-flex align-items-center gap-2"
            onClick={() => fetchAuditLogs()}
            title="Refresh Logs"
            style={{ height: "38px" }}
          >
            <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />
            <span>{t("common.refresh", "Refresh")}</span>
          </button>

          <button
            className="btn btn-success shadow-sm fw-bold px-3 d-inline-flex align-items-center gap-2"
            onClick={handleExportCSV}
            disabled={exporting}
            style={{ height: "38px" }}
          >
            <FontAwesomeIcon icon={faDownload} />
            <span>{exporting ? t("common.exporting", "Exporting...") : t("common.exportCsv", "Export CSV")}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4 col-xl">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #3b82f6" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("auditLogs.totalEvents", "TOTAL EVENTS")}</span>
            <h3 className="fw-bold text-primary mt-1 mb-1">{(stats?.totalEvents ?? 0).toLocaleString()}</h3>
            <small className="text-muted">{t("auditLogs.allRecordedLogs", "All recorded logs")}</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #10b981" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("auditLogs.eventsToday", "EVENTS TODAY")}</span>
            <h3 className="fw-bold text-success mt-1 mb-1">{(stats?.eventsToday ?? 0).toLocaleString()}</h3>
            <small className="text-muted">{t("auditLogs.loggedIn24h", "Logged in last 24h")}</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #ef4444" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("auditLogs.failedEvents", "FAILED EVENTS")}</span>
            <h3 className="fw-bold text-danger mt-1 mb-1">{(stats?.failedEvents ?? 0).toLocaleString()}</h3>
            <small className="text-muted">{t("auditLogs.failedAuthActions", "Failed auth / actions")}</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #f59e0b" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("auditLogs.criticalEvents", "CRITICAL EVENTS")}</span>
            <h3 className="fw-bold text-warning mt-1 mb-1">{(stats?.criticalEvents ?? 0).toLocaleString()}</h3>
            <small className="text-muted">{t("auditLogs.highSecurityImpact", "High security impact")}</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #6366f1" }}>
            <span className="text-muted small fw-semibold text-uppercase">{t("auditLogs.activeUsers", "ACTIVE ACTORS")}</span>
            <h3 className="fw-bold text-indigo mt-1 mb-1" style={{ color: "#6366f1" }}>{(stats?.activeUsers ?? 0).toLocaleString()}</h3>
            <small className="text-muted">{t("auditLogs.uniqueActors24h", "Unique actors in 24h")}</small>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleFilterSubmit}>
            <div className="row g-3 align-items-end">
              {/* Gym Owner Filter (SuperAdmin Only) */}
              {isSuperAdmin && (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <label className="form-label fw-semibold text-secondary small mb-1">
                    <FontAwesomeIcon icon={faUserShield} className="me-1 text-primary" /> {t("nav.gymOwners", "Gym Owner / Tenant")}
                  </label>
                  <select
                    className="form-select form-select-sm rounded-3"
                    value={filters.gymAdminId || "ALL"}
                    onChange={(e) => setFilters({ ...filters, gymAdminId: e.target.value })}
                  >
                    <option value="ALL">🌐 {t("common.allGyms", "All Gyms (Platform-wide)")}</option>
                    {gymAdmins.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.fullName || g.companyName || g.email} ({g.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Bar */}
              <div className="col-12 col-md-4 col-lg-3">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  <FontAwesomeIcon icon={faSearch} className="me-1" /> {t("common.search", "Search")}
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder={t("auditLogs.searchPlaceholder", "Search user, email, IP, description...")}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              {/* Start Date Filter */}
              <div className="col-6 col-sm-4 col-md-2">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-1" /> {t("common.startDate", "Start Date")}
                </label>
                <CustomDatePicker
                  value={filters.startDate}
                  onChange={(dateStr) => setFilters({ ...filters, startDate: dateStr })}
                  placeholder={t("common.selectDate", "Start Date")}
                />
              </div>

              {/* End Date Filter */}
              <div className="col-6 col-sm-4 col-md-2">
                <label className="form-label fw-semibold text-secondary small mb-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-1" /> {t("common.endDate", "End Date")}
                </label>
                <CustomDatePicker
                  value={filters.endDate}
                  onChange={(dateStr) => setFilters({ ...filters, endDate: dateStr })}
                  placeholder={t("common.selectDate", "End Date")}
                />
              </div>

              {/* Module Filter */}
              <div className="col-12 col-sm-4 col-md-2">
                <label className="form-label fw-semibold text-secondary small mb-1">{t("common.module", "Module")}</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={filters.module}
                  onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                >
                  <option value="ALL">{t("common.allModules", "All Modules")}</option>
                  <option value="AUTHENTICATION">Authentication</option>
                  <option value="USER_MANAGEMENT">User Management</option>
                  <option value="MEMBERS">Members</option>
                  <option value="STAFF">Staff & Payroll</option>
                  <option value="BILLING">Billing & Payments</option>
                  <option value="EXPENSES">Expenses</option>
                  <option value="SETTINGS">System Settings</option>
                  <option value="BACKUPS">Backups & Disaster Recovery</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="col-6 col-sm-4 col-md-2">
                <label className="form-label fw-semibold text-secondary small mb-1">{t("common.status", "Status")}</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="ALL">{t("common.allStatus", "All Status")}</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="col-6 col-sm-4 col-md-2">
                <label className="form-label fw-semibold text-secondary small mb-1">{t("common.severity", "Severity")}</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                >
                  <option value="ALL">{t("common.allSeverity", "All Severity")}</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="col-12 col-md-12 col-lg-auto d-flex gap-2 ms-auto">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-3 px-3 fw-semibold d-flex align-items-center justify-content-center gap-1"
                >
                  <FontAwesomeIcon icon={faFilter} /> {t("common.applyFilters", "Apply Filters")}
                </button>
                <button
                  type="button"
                  className="btn btn-light border btn-sm rounded-3 px-3 fw-semibold"
                  onClick={handleResetFilters}
                >
                  {t("common.reset", "Reset")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Audit Logs Table Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
            {t("auditLogs.logEntries", "Audit Log Entries")} ({pagination?.total || 0})
          </h5>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">{t("common.sortBy", "Sort:")}</span>
            <select
              className="form-select form-select-sm rounded-3"
              style={{ width: "auto" }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">{t("common.date", "Date & Time")}</option>
              <option value="action">{t("common.action", "Action")}</option>
              <option value="userName">{t("common.user", "User Name")}</option>
              <option value="severity">{t("common.severity", "Severity")}</option>
            </select>
            <button
              className="btn btn-sm btn-light border px-2 py-1"
              onClick={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
              title="Toggle Sort Order"
            >
              {sortOrder === "ASC" ? "▲" : "▼"}
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">{t("common.dateTime", "Date & Time")}</th>
                  {isSuperAdmin && <th className="py-3">{t("nav.gymOwners", "Gym Owner")}</th>}
                  <th className="py-3">{t("common.user", "User / Actor")}</th>
                  <th className="py-3">{t("common.action", "Action")}</th>
                  <th className="py-3">{t("common.module", "Module")}</th>
                  <th className="py-3">{t("common.status", "Status")}</th>
                  <th className="py-3">{t("common.severity", "Severity")}</th>
                  <th className="py-3">{t("common.ipAddress", "IP Address")}</th>
                  <th className="py-3 text-end px-4">{t("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 9 : 8} className="text-center py-5">
                      <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                      {t("common.loadingLogs", "Loading audit log entries...")}
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-secondary small fw-semibold" style={{ whiteSpace: "nowrap" }}>
                        {formatAppDate(log.createdAt)}
                        <br />
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {formatTimeString(log.createdAt)}
                        </span>
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3">
                          <span className="badge bg-light text-dark border small fw-semibold">
                            {log.adminId ? `Admin #${log.adminId}` : "Platform / SuperAdmin"}
                          </span>
                        </td>
                      )}

                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span className="fw-semibold text-dark mb-0" style={{ fontSize: "0.9rem" }}>
                            {log.userName || "System/Guest"}
                          </span>
                          <span className="text-muted small" style={{ fontSize: "0.78rem" }}>
                            {log.userEmail || "N/A"} • <strong className="text-secondary">{log.userRole || "System"}</strong>
                          </span>
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="fw-bold text-dark font-monospace small px-2 py-1 bg-light border rounded">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className="badge rounded-pill px-3 py-1.5 shadow-sm" style={getModuleBadgeStyle(log.module)}>
                          {log.module}
                        </span>
                      </td>

                      <td className="py-3">{getStatusBadge(log.status)}</td>

                      <td className="py-3">{getSeverityBadge(log.severity)}</td>

                      <td className="py-3 text-muted small font-monospace">{log.ipAddress || "—"}</td>

                      <td className="py-3 text-end px-4">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3 px-3 fw-medium d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          <span>{t("common.details", "Details")}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      {t("auditLogs.noLogsFound", "No audit log entries found matching the specified filters.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {pagination?.totalPages > 1 && (
          <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="text-muted small">
              {t("common.showing", "Showing")} <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> {t("common.to", "to")}{" "}
              <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> {t("common.of", "of")}{" "}
              <strong>{pagination.total}</strong> {t("common.entries", "entries")}
            </span>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary px-3 rounded-3"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchAuditLogs(pagination.page - 1)}
              >
                {t("common.previous", "Previous")}
              </button>

              <span className="fw-semibold small px-2">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary px-3 rounded-3"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchAuditLogs(pagination.page + 1)}
              >
                {t("common.next", "Next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Detail Modal */}
      {showModal && selectedLog && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow rounded-4">
              <div className="modal-header border-bottom px-4 py-3 bg-light">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faUserShield} className="text-primary" />
                  {t("auditLogs.eventDetails", "Audit Log Event Details")} #{selectedLog.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <div className="modal-body p-4">
                {/* Event Highlights */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-4">
                    <div className="p-3 bg-light rounded-3 border">
                      <small className="text-muted fw-semibold text-uppercase">{t("common.action", "ACTION")}</small>
                      <h6 className="fw-bold text-primary mb-0 mt-1">{selectedLog.action}</h6>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="p-3 bg-light rounded-3 border">
                      <small className="text-muted fw-semibold text-uppercase">{t("common.module", "MODULE")}</small>
                      <h6 className="fw-bold text-dark mb-0 mt-1">{selectedLog.module}</h6>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="p-3 bg-light rounded-3 border">
                      <small className="text-muted fw-semibold text-uppercase">{t("common.status", "STATUS")}</small>
                      <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Basic Information */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                  {t("auditLogs.basicInformation", "Basic Information")}
                </h6>
                <div className="row g-2 mb-4 small">
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("common.dateTime", "Date & Time")}:</strong>
                    <div>{formatAppDate(selectedLog.createdAt)} {formatTimeString(selectedLog.createdAt)}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("common.user", "User Name")}:</strong>
                    <div>{selectedLog.userName || "System/Guest"}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("common.email", "Email Address")}:</strong>
                    <div>{selectedLog.userEmail || "N/A"}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("common.role", "Role")}:</strong>
                    <div>{selectedLog.userRole || "N/A"}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("auditLogs.resourceType", "Resource Type")}:</strong>
                    <div>{selectedLog.resourceType || "N/A"}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("auditLogs.resourceId", "Resource ID")}:</strong>
                    <div>{selectedLog.resourceId || "N/A"}</div>
                  </div>
                </div>

                {/* Section 2: Request & Device Info */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                  <FontAwesomeIcon icon={faLaptop} className="me-2 text-primary" />
                  {t("auditLogs.requestInformation", "Request & Network Information")}
                </h6>
                <div className="row g-2 mb-4 small">
                  <div className="col-6 col-md-4">
                    <strong className="text-secondary">{t("common.ipAddress", "IP Address")}:</strong>
                    <div className="font-monospace text-dark">{selectedLog.ipAddress || "N/A"}</div>
                  </div>
                  <div className="col-12 col-md-8">
                    <strong className="text-secondary">{t("auditLogs.userAgent", "User Agent / Browser")}:</strong>
                    <div className="text-muted text-break">{selectedLog.userAgent || "N/A"}</div>
                  </div>
                  <div className="col-12 mt-2">
                    <strong className="text-secondary">{t("common.description", "Description")}:</strong>
                    <div className="bg-light p-2 rounded border text-dark">{selectedLog.description}</div>
                  </div>
                </div>

                {/* Section 3: Old Value vs New Value Diff */}
                {(selectedLog.oldValue || selectedLog.newValue) && (
                  <>
                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                      <FontAwesomeIcon icon={faExchangeAlt} className="me-2 text-primary" />
                      {t("auditLogs.changeDiff", "Data Modification Diff (Old vs New Value)")}
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="fw-semibold text-danger small mb-1">OLD VALUE</label>
                        <pre className="bg-danger bg-opacity-10 border border-danger border-opacity-25 p-3 rounded-3 text-dark small overflow-auto" style={{ maxHeight: "200px" }}>
                          {selectedLog.oldValue ? JSON.stringify(parseJsonSafe(selectedLog.oldValue), null, 2) : "None"}
                        </pre>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="fw-semibold text-success small mb-1">NEW VALUE</label>
                        <pre className="bg-success bg-opacity-10 border border-success border-opacity-25 p-3 rounded-3 text-dark small overflow-auto" style={{ maxHeight: "200px" }}>
                          {selectedLog.newValue ? JSON.stringify(parseJsonSafe(selectedLog.newValue), null, 2) : "None"}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer border-top bg-light px-4 py-3">
                <button type="button" className="btn btn-secondary px-4 rounded-3 fw-semibold" onClick={() => setShowModal(false)}>
                  {t("common.close", "Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
