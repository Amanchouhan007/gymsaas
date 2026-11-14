import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaSearch,
  FaFilter,
  FaTrashAlt,
  FaDownload,
  FaExclamationTriangle
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axiosInstance from '../../Api/axiosInstance.jsx';
import CustomDatePicker from '../../Components/CustomDatePicker.jsx';

const ReportsAttendance = () => {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [branches, setBranches] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const customColor = "#6EB2CC";

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const adminId = user?.adminId || user?.id || null;

  useEffect(() => {
    if (adminId) {
      fetchBranches();
      fetchStaffMembers();
      fetchAttendanceRecords();
    }
  }, [adminId]);

  const fetchBranches = async () => {
    if (!adminId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`branches/by-admin/${adminId}`);
      if (response.data.success) {
        setBranches(response.data.branches || response.data.data || []);
      } else {
        setError('Failed to load branches');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId) => {
    const roleIdMap = {
      1: 'Admin',
      2: 'Receptionist',
      3: 'Sales Agent',
      4: 'Housekeeping',
      5: 'Personal Trainer',
      6: 'General Trainer',
      7: 'Manager',
      8: 'Member'
    };
    return roleIdMap[roleId] || 'Staff';
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId || b.branchId === branchId);
    return branch?.name || branch?.branchName || 'Unknown';
  };

  const fetchStaffMembers = async () => {
    if (!adminId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`staff/admin/${adminId}`);
      if (response.data.success) {
        const staffList = response.data.staff || response.data.data || [];
        const transformedStaff = staffList.map(staff => ({
          id: staff.staffId || staff.id,
          staffId: staff.staffId || staff.id,
          name: staff.fullName,
          role: getRoleName(staff.roleId),
          branch: getBranchName(staff.branchId),
          email: staff.email,
          phone: staff.phone,
          roleId: staff.roleId
        }));
        setStaffMembers(transformedStaff);
      } else {
        setError('Failed to load staff data');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkHours = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return '—';
    try {
      const start = new Date(checkInTime);
      const end = new Date(checkOutTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—';
      const diffMs = end - start;
      if (diffMs <= 0) return `0h 0m`;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return '—';
    }
  };

  const calculateShiftType = (checkInTime) => {
    if (!checkInTime) return '—';
    try {
      const date = new Date(checkInTime);
      const hours = date.getHours();
      if (hours >= 5 && hours < 12) return 'Morning Shift';
      if (hours >= 12 && hours < 17) return 'Afternoon Shift';
      if (hours >= 17 && hours < 22) return 'Evening Shift';
      return 'Night Shift';
    } catch (e) {
      return '—';
    }
  };

  const formatRoleFromApi = (apiRole) => {
    if (!apiRole) return 'Staff';
    const roleMap = {
      personaltrainer: 'Personal Trainer',
      generaltrainer: 'General Trainer',
      receptionist: 'Receptionist',
      housekeeping: 'Housekeeping',
      sales_agent: 'Sales Agent',
      manager: 'Manager',
      member: 'Member',
      admin: 'Admin'
    };
    const normalized = apiRole.toLowerCase().trim();
    return roleMap[normalized] || apiRole.charAt(0).toUpperCase() + apiRole.slice(1);
  };

  const fetchAttendanceRecords = async () => {
    if (!adminId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`memberattendence/admin?adminId=${adminId}`);
      if (response.data?.success && Array.isArray(response.data.attendance)) {
        const transformedRecords = response.data.attendance.map(record => ({
          attendance_id: record.id,
          staff_id: null,
          staff_name: record.name || 'Unknown',
          role: formatRoleFromApi(record.role),
          branch: 'Unknown',
          date: record.date ? record.date.split('T')[0] : '',
          checkin_time: record.checkIn,
          checkout_time: record.checkOut,
          mode: record.mode || 'Manual',
          shift_id: null,
          shift_name: record.shift || calculateShiftType(record.checkIn),
          status: record.status || 'Unknown',
          notes: ''
        }));
        setRecords(transformedRecords);
      } else {
        setError('Failed to load attendance records');
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Role/status/branch options
  const allRoles = ['All', ...new Set(records.map(r => r.role).filter(Boolean))];
  const allStatuses = ['All', 'Present', 'Late', 'Absent', 'Overtime', 'In Gym'];
  const allBranches = ['All', ...new Set(branches.map(b => b.name))];

  const filteredRecords = records.filter(record => {
    if (!record) return false;
    const staffName = (record.staff_name || '').toLowerCase();
    const role = (record.role || '').toLowerCase();
    if (role.includes('housekeeping')) return false;
    const status = (record.status || '').toLowerCase();
    const shift = (record.shift_name || '').toLowerCase();
    const term = (searchTerm || '').trim().toLowerCase();

    const matchesSearch = !term || staffName.includes(term) || role.includes(term) || status.includes(term) || shift.includes(term);
    const matchesRole = roleFilter === 'All' || role === roleFilter.toLowerCase().trim();
    const matchesStatus = statusFilter === 'All' || status === statusFilter.toLowerCase().trim();

    return matchesSearch && matchesRole && matchesStatus;
  });

  // --- Remaining handlers (unchanged logic) ---
  const handleAddNew = () => {
    setModalType('add');
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    setModalType('view');
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setModalType('edit');
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;
    try {
      setRecords(prev =>
        prev.map(r =>
          r.attendance_id === selectedRecord.attendance_id
            ? { ...r, deleting: true }
            : r
        )
      );

      const response = await axiosInstance.delete(`memberattendence/delete/${selectedRecord.attendance_id}`);
      if (response.data?.success) {
        setRecords(prev => prev.filter(r => r.attendance_id !== selectedRecord.attendance_id));
        alert(`Deleted attendance record for ${selectedRecord.staff_name} (${selectedRecord.role}).`);
      } else {
        alert(response.data?.message || 'Delete failed');
        setRecords(prev =>
          prev.map(r =>
            r.attendance_id === selectedRecord.attendance_id
              ? { ...r, deleting: false }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete attendance record');
      setRecords(prev =>
        prev.map(r =>
          r.attendance_id === selectedRecord.attendance_id
            ? { ...r, deleting: false }
            : r
        )
      );
    }
    closeDeleteModal();
  };

  const closeModal = () => setIsModalOpen(false);
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  };

  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    };
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isDeleteModalOpen]);

  const getStatusLabel = (status) => {
    if (!status) return t("status.unknown", "Unknown");
    const map = {
      'Present': t("status.present", "Present"),
      'Late': t("status.late", "Late"),
      'Absent': t("status.absent", "Absent"),
      'Overtime': t("status.overtime", "Overtime"),
      'In Gym': t("status.inGym", "In Gym")
    };
    return map[status] || status;
  };

  const getRoleLabel = (role) => {
    if (!role) return t("roles.unknown", "Unknown");
    const map = {
      "Personal Trainer": t("roles.personalTrainer", "Personal Trainer"),
      "Receptionist": t("roles.receptionist", "Receptionist"),
      "Housekeeping": t("roles.housekeeping", "Housekeeping"),
      "General Trainer": t("roles.generalTrainer", "General Trainer"),
      "Sales Agent": t("roles.salesAgent", "Sales Agent"),
      "Admin": t("roles.admin", "Admin"),
      "Manager": t("roles.manager", "Manager"),
      "Trainer": t("roles.trainer", "Trainer"),
      "Member": t("roles.member", "Member")
    };
    return map[role] || role;
  };

  const getShiftLabel = (shift) => {
    if (!shift) return "—";
    const map = {
      "Morning Shift": t("shifts.morningShift", "Morning Shift"),
      "Afternoon Shift": t("shifts.afternoonShift", "Afternoon Shift"),
      "Evening Shift": t("shifts.eveningShift", "Evening Shift"),
      "Night Shift": t("shifts.nightShift", "Night Shift"),
      "Day Shift": t("shifts.dayShift", "Day Shift")
    };
    return map[shift] || shift;
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge rounded-pill bg-secondary px-2 py-1" style={{ fontSize: '0.7rem' }}>{t("status.unknown", "Unknown")}</span>;
    const badgeClasses = {
      Present: "bg-success text-white",
      Late: "bg-warning text-dark",
      Absent: "bg-danger text-white",
      Overtime: "bg-info text-white",
      'In Gym': "bg-primary text-white"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-2 py-1`} style={{ fontSize: '0.7rem' }}>
        {getStatusLabel(status)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    if (!role) return <span className="badge rounded-pill bg-secondary text-white px-2 py-1" style={{ fontSize: '0.65rem' }}>{t("roles.unknown", "Unknown")}</span>;
    const colors = {
      "Personal Trainer": "bg-primary text-white",
      "Receptionist": "bg-info text-dark",
      "Housekeeping": "bg-secondary text-white",
      "General Trainer": "bg-success text-white",
      "Sales Agent": "bg-warning text-dark",
      "Admin": "bg-danger text-white",
      "Manager": "bg-warning text-dark",
      "Trainer": "bg-primary text-white",
      "Member": "bg-dark text-white"
    };
    return (
      <span className={`badge rounded-pill ${colors[role] || 'bg-secondary text-white'} px-2 py-1`} style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
        {getRoleLabel(role)}
      </span>
    );
  };

  const getModeLabel = (mode) => {
    if (!mode || mode === '-' || mode === 'Unknown' || mode === '—') return '—';
    if (mode === 'QR' || mode === 'QR Code') return t("attendance.qr", "QR");
    if (mode === 'Manual') return t("attendance.manual", "Manual");
    return mode;
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'add': return t("attendance.addStaffRecord", "Add New Staff Attendance Record");
      case 'edit': return t("attendance.editStaffRecord", "Edit Staff Attendance Record");
      default: return t("attendance.viewStaffRecord", "View Staff Attendance Record");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      const lang = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'es' ? 'es-ES' : 'en-GB';
      return d.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return <span className="text-muted">—</span>;
    try {
      const d = new Date(timeString);
      if (isNaN(d.getTime())) return <span className="text-muted">—</span>;
      const lang = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'es' ? 'es-ES' : 'en-GB';
      return d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return <span className="text-muted">—</span>;
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Form submission logic remains the same as original (uses staff-based payload)
    // Since API now returns member-style data, you may want to revisit this if adding records for staff
    alert('Form submit logic not updated for new API — consider revising if needed.');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('All');
    setStatusFilter('All');
    setBranchFilter('All');
  };

  useEffect(() => {
    if (branchFilter !== 'All') {
      const branch = branches.find(b => b.name === branchFilter);
      if (branch) {
        // Optional: filter by branch if required
      }
    }
  }, [branchFilter]);

  const MobileAttendanceCard = ({ record }) => (
    <div className="card mb-3 shadow-sm" style={{ borderRadius: '0.5rem' }}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>{record.staff_name || 'Unknown'}</h6>
            <div className="d-flex gap-1 flex-wrap">{getRoleBadge(record.role)}</div>
          </div>
          {getStatusBadge(record.status)}
        </div>
        <div className="row g-2 mb-2">
          <div className="col-6">
            <small className="text-muted d-block">{t("table.date", "Date")}</small>
            <span style={{ fontSize: '0.85rem' }}>{formatDate(record.date)}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">{t("table.shift", "Shift")}</small>
            <span style={{ fontSize: '0.85rem' }}>{getShiftLabel(record.shift_name) || '—'}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">{t("table.checkIn", "Check-in")}</small>
            <span style={{ fontSize: '0.85rem' }}>{formatTime(record.checkin_time)}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">{t("table.checkOut", "Check-out")}</small>
            <span style={{ fontSize: '0.85rem' }}>{formatTime(record.checkout_time)}</span>
          </div>
        </div>
        {record.notes && (
          <div className="mb-2">
            <small className="text-muted">{t("table.notes", "Notes")}:</small>
            <p className="mb-0" style={{ fontSize: '0.85rem' }}>{record.notes}</p>
          </div>
        )}
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-sm btn-outline-danger action-btn"
            title={t("common.delete", "Delete")}
            onClick={() => handleDeleteClick(record)}
            disabled={record.deleting}
          >
            {record.deleting ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <FaTrashAlt size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      alert("No attendance records available to export.");
      return;
    }
    const dataToExport = filteredRecords.map((r) => ({
      "Date": formatDate(r.date),
      "Staff Name": r.staff_name || '—',
      "Role": r.role || '—',
      "Check-In": formatTime(r.checkin_time),
      "Check-Out": formatTime(r.checkout_time),
      "Work Hours": calculateWorkHours(r.checkin_time, r.checkout_time),
      "Mode": r.mode || '—',
      "Shift": r.shift_name || '—',
      "Status": r.status || '—',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Attendance");
    XLSX.writeFile(workbook, `Staff_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (filteredRecords.length === 0) {
      alert("No attendance records available to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Staff Attendance Report", 14, 15);
    const tableColumn = ["Date", "Staff Name", "Role", "Check-In", "Check-Out", "Work Hours", "Mode", "Status"];
    const tableRows = filteredRecords.map((r) => [
      formatDate(r.date),
      r.staff_name || '—',
      r.role || '—',
      formatTime(r.checkin_time),
      formatTime(r.checkout_time),
      calculateWorkHours(r.checkin_time, r.checkout_time),
      r.mode || '—',
      r.status || '—',
    ]);
    autoTable(doc, {
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });
    doc.save(`Staff_Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- JSX Rendering ---
  return (
    <div className="container-fluid p-2 p-md-4">
      {/* Header */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-md-8 mb-2 mb-md-0">
          <h2 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: '#ea580c' }}>
            {t("receptionist.renewalsTitle", "Renewals & Follow-ups")}
          </h2>
          <p className="text-muted mb-0 d-none d-md-block">
            {t("receptionist.renewalsSubtitle", "Manage member plan renewals, expiring memberships, and follow-ups.")}
          </p>
        </div>
        <div className="col-12 col-md-4 text-md-end">
          {/* Export Data Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-success fw-semibold dropdown-toggle d-inline-flex align-items-center gap-2"
              style={{ borderRadius: '8px', padding: '8px 16px', fontWeight: '500' }}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <FaDownload /> {t("common.exportData", "Export Data")}
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2 text-success fw-medium" onClick={exportToExcel}>
                  <strong className="text-success">XLSX</strong> {t("common.exportToExcel", "Export to Excel")}
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2 text-danger fw-medium" onClick={exportToPDF}>
                  <strong className="text-danger">PDF</strong> {t("common.exportToPdf", "Export to PDF")}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm border-0 mb-3 mb-md-4">
        <div className="card-body p-2 p-md-3">
          <div className="d-md-none mb-2">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex justify-content-between align-items-center"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <span>{t("common.filters", "Filters")}</span>
              <FaFilter />
            </button>
          </div>
          <div className={`row g-2 ${showMobileFilters ? 'd-block' : 'd-none d-md-flex'}`}>
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border">
                  <FaSearch className="text-muted" style={{ fontSize: '0.875rem' }} />
                </span>
                <input
                  type="text"
                  className="form-control border"
                  placeholder={t("common.search", "Search...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              >
                {allRoles.map(role => (
                  <option key={role} value={role}>{role === 'All' ? t("common.all", "All") : getRoleLabel(role)}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              >
                {allStatuses.map(status => (
                  <option key={status} value={status}>{status === 'All' ? t("common.all", "All") : getStatusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <button
                className="btn btn-outline-secondary btn-sm w-100 fw-medium"
                onClick={clearFilters}
                style={{ fontSize: '0.875rem' }}
              >
                {t("common.clearFilters", "Clear Filters")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table / Cards */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light py-2 py-md-3">
          <h6 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
            {t("attendance.recordsCount", "Attendance Records ({{count}})", { count: filteredRecords.length })}
          </h6>
        </div>
        <div className="card-body p-0">
          <div className="d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.date", "DATE")}</th>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.staffName", "STAFF NAME")}</th>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem', width: '100px' }}>{t("table.role", "ROLE")}</th>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.checkIn", "CHECK-IN")}</th>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.checkOut", "CHECK-OUT")}</th>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.workHours", "WORK HOURS")}</th>
                    <th className="fw-semibold text-nowrap d-none d-lg-table-cell" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.mode", "MODE")}</th>
                    <th className="fw-semibold text-nowrap d-none d-md-table-cell" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.shift", "SHIFT")}</th>
                    <th className="fw-semibold text-nowrap" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>{t("table.status", "STATUS")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr key={record.attendance_id}>
                        <td className="text-nowrap" style={{ padding: '0.5rem' }}>
                          <span>{formatDate(record.date)}</span>
                        </td>
                        <td className="text-nowrap" style={{ padding: '0.5rem' }}>
                          <strong>{record.staff_name || 'Unknown'}</strong>
                        </td>
                        <td className="text-nowrap" style={{ padding: '0.5rem' }}>{getRoleBadge(record.role)}</td>
                        <td className="text-nowrap" style={{ padding: '0.5rem' }}>{formatTime(record.checkin_time)}</td>
                        <td className="text-nowrap" style={{ padding: '0.5rem' }}>{formatTime(record.checkout_time)}</td>
                        <td className="text-nowrap fw-semibold" style={{ padding: '0.5rem' }}>
                          {record.checkin_time && record.checkout_time ? (
                            <span className="badge text-bg-light border text-dark px-2 py-1" style={{ fontSize: '0.7rem' }}>
                              {calculateWorkHours(record.checkin_time, record.checkout_time)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-nowrap d-none d-lg-table-cell" style={{ padding: '0.5rem' }}>
                          {record.mode && record.mode !== '-' && record.mode !== 'Unknown' && record.mode !== '—' ? (
                            <span className={`badge rounded-pill ${record.mode === 'QR' || record.mode === 'QR Code' ? 'bg-info text-white' : 'bg-secondary text-white'} px-2 py-1`} style={{ fontSize: '0.65rem' }}>
                              {getModeLabel(record.mode)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-nowrap d-none d-md-table-cell" style={{ padding: '0.5rem' }}>
                          {record.shift_name && record.shift_name !== 'Unknown' && record.shift_name !== '—' ? (
                            <span style={{ fontSize: '0.75rem' }}>{getShiftLabel(record.shift_name)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-nowrap" style={{ padding: '0.5rem' }}>{getStatusBadge(record.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="text-muted">
                          <FaSearch size={24} className="mb-2" />
                          <p className="mb-0">{t("attendance.noRecordsFound", "No attendance records found.")}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-md-none p-3">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => <MobileAttendanceCard key={record.attendance_id} record={record} />)
            ) : (
              <div className="text-center py-4">
                <div className="text-muted">
                  <FaSearch size={24} className="mb-2" />
                  <p className="mb-0">{t("attendance.noRecordsFound", "No attendance records found.")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow" style={{ borderRadius: '0.5rem', overflow: 'hidden' }}>
              <div className="modal-header py-2 px-3" style={{ backgroundColor: customColor, color: 'white' }}>
                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1rem' }}>{getModalTitle()}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal} style={{ opacity: 0.8 }}></button>
              </div>
              <div className="modal-body p-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleFormSubmit}>
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("attendance.staffMember", "Staff Member")} *</label>
                      <select
                        name="staff_id"
                        className="form-select form-select-sm"
                        value={selectedRecord?.staff_id || ''}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, staff_id: e.target.value })}
                        disabled={modalType === 'view'}
                        required
                      >
                        <option value="">{t("attendance.selectStaffMember", "Select Staff Member")}</option>
                        {staffMembers.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} ({getRoleLabel(staff.role)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <CustomDatePicker
                        label={t("table.date", "Date")}
                        required={true}
                        value={selectedRecord?.date || new Date().toISOString().split('T')[0]}
                        onChange={(val) => setSelectedRecord({ ...selectedRecord, date: val })}
                        disabled={modalType === 'view'}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("table.shift", "Shift")}</label>
                      <select
                        name="shift_id"
                        className="form-select form-select-sm"
                        value={selectedRecord?.shift_id || ''}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, shift_id: e.target.value })}
                        disabled={modalType === 'view'}
                      >
                        <option value="">{t("attendance.noShift", "No Shift")}</option>
                        {[{ id: 1, name: "Morning Shift" }, { id: 2, name: "Day Shift" }, { id: 3, name: "Evening Shift" }, { id: 4, name: "Night Shift" }].map(shift => (
                          <option key={shift.id} value={shift.id}>{getShiftLabel(shift.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("table.mode", "Mode")}</label>
                      <select
                        name="mode"
                        className="form-select form-select-sm"
                        value={selectedRecord?.mode || 'QR'}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, mode: e.target.value })}
                        disabled={modalType === 'view'}
                        required
                      >
                        <option value="QR">{t("attendance.qr", "QR")}</option>
                        <option value="Manual">{t("attendance.manual", "Manual")}</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("table.status", "Status")}</label>
                      <select
                        name="status"
                        className="form-select form-select-sm"
                        value={selectedRecord?.status || 'Present'}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, status: e.target.value })}
                        disabled={modalType === 'view'}
                        required
                      >
                        <option value="Present">{t("status.present", "Present")}</option>
                        <option value="Late">{t("status.late", "Late")}</option>
                        <option value="Absent">{t("status.absent", "Absent")}</option>
                        <option value="Overtime">{t("status.overtime", "Overtime")}</option>
                        <option value="In Gym">{t("status.inGym", "In Gym")}</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("attendance.checkInTime", "Check-in Time")}</label>
                      <input
                        name="checkin_time"
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={selectedRecord?.checkin_time ? new Date(selectedRecord.checkin_time).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, checkin_time: e.target.value })}
                        readOnly={modalType === 'view'}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("attendance.checkOutTime", "Check-out Time")}</label>
                      <input
                        name="checkout_time"
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={selectedRecord?.checkout_time ? new Date(selectedRecord.checkout_time).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, checkout_time: e.target.value })}
                        readOnly={modalType === 'view'}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>{t("table.notes", "Notes")}</label>
                      <input
                        name="notes"
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={t("attendance.notesPlaceholder", "Reason for absence or late entry...")}
                        value={selectedRecord?.notes || ''}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })}
                        readOnly={modalType === 'view'}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-secondary btn-sm px-3" onClick={closeModal}>{t("common.cancel", "Cancel")}</button>
                    {modalType !== 'view' && (
                      <button type="submit" className="btn btn-sm px-3" style={{ backgroundColor: customColor, color: 'white', border: 'none' }}>
                        {modalType === 'add' ? t("attendance.addRecord", "Add Record") : t("common.saveChanges", "Save Changes")}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeDeleteModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow" style={{ borderRadius: '0.5rem', overflow: 'hidden' }}>
              <div className="modal-header py-2 px-3" style={{ backgroundColor: customColor, color: 'white' }}>
                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1rem' }}>{t("common.confirmDelete", "Confirm Deletion")}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeDeleteModal} style={{ opacity: 0.8 }}></button>
              </div>
              <div className="modal-body text-center py-3">
                <div className="text-danger mb-2"><FaExclamationTriangle size={24} /></div>
                <h5 style={{ fontSize: '1rem' }}>{t("common.areYouSure", "Are you sure?")}</h5>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {t("attendance.deleteConfirmPrompt", "This will permanently delete attendance record for {{name}} ({{role}}) on {{date}}.", {
                    name: selectedRecord?.staff_name || 'Unknown',
                    role: selectedRecord ? getRoleLabel(selectedRecord.role) : '',
                    date: selectedRecord ? formatDate(selectedRecord.date) : ''
                  })}<br />
                  {t("attendance.cannotBeUndone", "This action cannot be undone.")}
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-3">
                <button type="button" className="btn btn-secondary btn-sm px-3" onClick={closeDeleteModal}>{t("common.cancel", "Cancel")}</button>
                <button type="button" className="btn btn-danger btn-sm px-3" onClick={confirmDelete}>{t("common.delete", "Delete")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .action-btn {
          width: 28px;
          height: 28px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        @media (max-width: 576px) {
          .action-btn {
            width: 24px;
            height: 24px;
          }
        }
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          .container-fluid {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }
        .card {
          border: none;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        }
        .table th {
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          white-space: nowrap;
        }
        .table td {
          vertical-align: middle;
          white-space: nowrap;
        }
        .form-control, .form-select {
          border-radius: 0.375rem !important;
        }
        .btn {
          border-radius: 0.375rem;
          font-weight: 500;
        }
        .modal-header {
          border-radius: 0.375rem 0.375rem 0 0;
        }
        .modal-footer {
          border-radius: 0 0 0.375rem 0.375rem;
        }
        @media (max-width: 576px) {
          .modal-dialog {
            margin: 0.25rem;
            max-width: calc(100% - 0.5rem);
          }
          .modal-content {
            border-radius: 0.375rem;
          }
          .modal-body {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsAttendance;