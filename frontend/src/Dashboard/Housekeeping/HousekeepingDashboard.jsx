import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { useTranslation } from 'react-i18next';
import { 
  FaTasks, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaQrcode, 
  FaBullhorn, 
  FaCalendarAlt,
  FaSyncAlt,
  FaCheck,
  FaPlay
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HousekeepingDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = localStorage.getItem('userId') || user.id;
  const adminId = user.adminId || user.id;
  const branchId = user.branchId;

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch assigned housekeeping tasks
      const taskRes = await axiosInstance.get(`/housekeepingtask/asignedto/${userId}`);
      if (taskRes.data && taskRes.data.success) {
        setTasks(taskRes.data.data || []);
      } else if (Array.isArray(taskRes.data)) {
        setTasks(taskRes.data);
      }
    } catch (err) {
      console.warn("Could not fetch user-specific tasks, fetching all tasks for branch/admin...", err);
      try {
        const allTaskRes = adminId 
          ? await axiosInstance.get(`/housekeepingtask/tasks/admin/${adminId}`)
          : await axiosInstance.get('/housekeepingtask/all');
        if (allTaskRes.data && allTaskRes.data.success) {
          const list = allTaskRes.data.data || [];
          const filtered = list.filter(t => String(t.assignedTo) === String(userId) || String(t.userId) === String(userId));
          setTasks(filtered.length > 0 ? filtered : list);
        }
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }

    try {
      // 2. Fetch gym announcements
      if (adminId) {
        const annRes = await axiosInstance.get(`/announcement/admin/${adminId}`);
        if (annRes.data && annRes.data.success) {
          setAnnouncements(annRes.data.announcements || annRes.data.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }

    try {
      // 3. Fetch shifts / duty roster if available
      if (adminId) {
        const shiftRes = await axiosInstance.get(`/shift/admin/${adminId}`);
        if (shiftRes.data && shiftRes.data.success) {
          const list = shiftRes.data.data || shiftRes.data.shifts || [];
          const myShifts = list.filter(s => String(s.staffId) === String(userId) || String(s.userId) === String(userId));
          setShifts(myShifts.length > 0 ? myShifts : list.slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Failed to fetch shifts", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: newStatus
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating task status:", err);
      alert(t("housekeeping.updateError", "Failed to update task status"));
    }
  };

  // Stats calculation
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'pending').length;
  const inProgressTasks = tasks.filter(t => (t.status || '').toLowerCase().includes('progress') || (t.status || '').toLowerCase().includes('review')).length;
  const completedTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'approved').length;

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return (t.status || '').toLowerCase() === 'pending';
    if (filterStatus === 'IN_PROGRESS') return (t.status || '').toLowerCase().includes('progress') || (t.status || '').toLowerCase().includes('review');
    if (filterStatus === 'COMPLETED') return (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'approved';
    return true;
  });

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') return <span className="badge bg-danger">{t("housekeeping.high", "High")}</span>;
    if (p === 'medium') return <span className="badge bg-warning text-dark">{t("housekeeping.medium", "Medium")}</span>;
    return <span className="badge bg-info text-dark">{t("housekeeping.low", "Low")}</span>;
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'approved') return <span className="badge bg-success">{t("housekeeping.completed", "Completed")}</span>;
    if (s.includes('review')) return <span className="badge bg-warning text-dark">{t("housekeeping.reviewPending", "Review Pending")}</span>;
    if (s.includes('progress')) return <span className="badge bg-primary">{t("housekeeping.inProgress", "In Progress")}</span>;
    return <span className="badge bg-secondary">{t("housekeeping.pending", "Pending")}</span>;
  };

  return (
    <div className="container-fluid py-3 py-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100dvh' }}>
      
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="text-dark fw-bold mb-1">
            🧹 {t("housekeeping.dashboardTitle", "Housekeeping & Facility Management")}
          </h2>
          <p className="text-muted mb-0">
            {t("housekeeping.welcomeMsg", "Welcome,")} <span className="fw-semibold text-dark">{user.fullName || user.name || "Staff"}</span>! {t("housekeeping.manageTasksDesc", "Track and update your daily maintenance tasks.")}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={fetchDashboardData}
          >
            <FaSyncAlt /> {t("housekeeping.refresh", "Refresh")}
          </button>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            style={{ background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", border: "none" }}
            onClick={() => navigate('/housekeeping/qrcheckin')}
          >
            <FaQrcode /> {t("housekeeping.qrCheckin", "QR Check-in")}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: '5px solid #0d6efd' }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-bold text-uppercase">{t("housekeeping.totalTasks", "Total Tasks")}</div>
                <h3 className="fw-bold mb-0 text-dark mt-1">{totalTasks}</h3>
              </div>
              <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary fs-4">
                <FaTasks />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: '5px solid #ffc107' }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-bold text-uppercase">{t("housekeeping.pendingTasks", "Pending Tasks")}</div>
                <h3 className="fw-bold mb-0 text-warning mt-1">{pendingTasks}</h3>
              </div>
              <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning fs-4">
                <FaClock />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: '5px solid #0dcaf0' }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-bold text-uppercase">{t("housekeeping.inProgress", "In Progress")}</div>
                <h3 className="fw-bold mb-0 text-info mt-1">{inProgressTasks}</h3>
              </div>
              <div className="rounded-circle p-3 bg-info bg-opacity-10 text-info fs-4">
                <FaExclamationTriangle />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderLeft: '5px solid #198754' }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-bold text-uppercase">{t("housekeeping.completedTasks", "Completed Tasks")}</div>
                <h3 className="fw-bold mb-0 text-success mt-1">{completedTasks}</h3>
              </div>
              <div className="rounded-circle p-3 bg-success bg-opacity-10 text-success fs-4">
                <FaCheckCircle />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Tasks Table */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 border-bottom">
              <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <FaTasks className="text-primary" /> {t("housekeeping.myAssignedTasks", "My Assigned Tasks")}
              </h5>
              <div className="btn-group btn-group-sm">
                <button 
                  className={`btn ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterStatus('ALL')}
                >
                  {t("housekeeping.all", "All")} ({totalTasks})
                </button>
                <button 
                  className={`btn ${filterStatus === 'PENDING' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterStatus('PENDING')}
                >
                  {t("housekeeping.pending", "Pending")} ({pendingTasks})
                </button>
                <button 
                  className={`btn ${filterStatus === 'IN_PROGRESS' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterStatus('IN_PROGRESS')}
                >
                  {t("housekeeping.active", "Active")} ({inProgressTasks})
                </button>
                <button 
                  className={`btn ${filterStatus === 'COMPLETED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterStatus('COMPLETED')}
                >
                  {t("housekeeping.completed", "Completed")} ({completedTasks})
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="p-5 text-center">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-5 text-center text-muted">
                  <FaTasks className="fs-1 mb-2 text-secondary opacity-50" />
                  <h5>{t("housekeeping.noTasksFound", "No tasks found.")}</h5>
                  <p className="small mb-0">{t("housekeeping.allCaughtUp", "You are all caught up on maintenance work!")}</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4 py-3">{t("housekeeping.task", "TASK")}</th>
                        <th className="py-3">{t("housekeeping.priority", "PRIORITY")}</th>
                        <th className="py-3">{t("housekeeping.dueDate", "DUE DATE")}</th>
                        <th className="py-3">{t("housekeeping.status", "STATUS")}</th>
                        <th className="px-4 py-3 text-end">{t("housekeeping.action", "ACTION")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(task => {
                        const statusLower = (task.status || '').toLowerCase();
                        const isDone = statusLower === 'completed' || statusLower === 'approved';
                        const isReview = statusLower === 'review pending';
                        const isInProgress = statusLower.includes('progress');

                        return (
                          <tr key={task.id}>
                            <td className="px-4 py-3">
                              <div className="fw-bold text-dark">{task.taskTitle || task.title || t("housekeeping.maintenanceTask", "Maintenance Task")}</div>
                              <small className="text-muted">{task.description || task.notes || t("housekeeping.noDescription", "No description provided.")}</small>
                            </td>
                            <td className="py-3">
                              {getPriorityBadge(task.priority)}
                            </td>
                            <td className="py-3 text-muted small">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3">
                              {getStatusBadge(task.status)}
                            </td>
                            <td className="px-4 py-3 text-end">
                              {!isDone && !isReview && !isInProgress && (
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => updateTaskStatus(task.id, 'In Progress')}
                                  title={t("housekeeping.startTask", "Start Task")}
                                >
                                  <FaPlay className="me-1" size={10} /> {t("housekeeping.start", "Start")}
                                </button>
                              )}
                              {!isDone && !isReview && (
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => updateTaskStatus(task.id, 'Completed')}
                                  title={t("housekeeping.markComplete", "Mark Complete")}
                                >
                                  <FaCheck className="me-1" size={10} /> {t("housekeeping.done", "Done")}
                                </button>
                              )}
                              {isDone && (
                                <span className="text-success small fw-bold">
                                  <FaCheckCircle className="me-1" /> {t("housekeeping.finished", "Finished")}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Column: Announcements & Schedule */}
        <div className="col-lg-4">
          {/* Announcements Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <FaBullhorn className="text-warning" /> {t("housekeeping.gymAnnouncements", "Gym Announcements")}
              </h6>
              <button 
                className="btn btn-link btn-sm text-decoration-none p-0"
                onClick={() => navigate('/staff/announcements')}
              >
                {t("housekeeping.viewAll", "View All")}
              </button>
            </div>
            <div className="card-body p-3">
              {announcements.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  {t("housekeeping.noAnnouncements", "No recent announcements.")}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {announcements.slice(0, 3).map((a, idx) => (
                    <div key={idx} className="p-3 bg-light rounded-3 border-start border-3 border-warning">
                      <h6 className="fw-bold text-dark mb-1">{a.title || a.announcementTitle}</h6>
                      <p className="small text-muted mb-1 text-truncate">{a.content || a.description || a.message}</p>
                      <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duty Schedule Card */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <FaCalendarAlt className="text-info" /> {t("housekeeping.dutySchedule", "Duty Schedule")}
              </h6>
            </div>
            <div className="card-body p-3">
              {shifts.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  {t("housekeeping.noShiftsAssigned", "No upcoming shifts assigned.")}
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {shifts.map((s, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center p-2 rounded bg-light">
                      <div>
                        <div className="fw-bold small text-dark">{s.shiftType || s.type || t("housekeeping.standardShift", "Standard Shift")}</div>
                        <small className="text-muted">{s.startTime || '09:00'} - {s.endTime || '18:00'}</small>
                      </div>
                      <span className="badge bg-primary-subtle text-primary border">
                        {s.date ? new Date(s.date).toLocaleDateString() : t("housekeeping.daily", "Daily")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default HousekeepingDashboard;
