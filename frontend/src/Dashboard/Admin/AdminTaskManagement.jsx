import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Check, X
} from 'react-bootstrap-icons';
import axiosInstance from '../../Api/axiosInstance';
import GetAdminId from '../../Api/GetAdminId';
import { FaTrash, FaDownload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { exportToPDF } from '../../utils/exportUtils';

const AdminTaskManagement = () => {
  const { t } = useTranslation();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const adminId = GetAdminId();
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user && (user.roleName === 'Admin' || user.roleName === 'Superadmin');
  const loggedInUserId = user ? user.id : null;

  const [taskForm, setTaskForm] = useState({
    assignedTo: '', // staffId
    roleId: '', // department id
    taskTitle: '',
    description: '',
    dueDate: '',
    priority: 'Medium'
  });

  const departments = [
    { id: 6, key: 'generalTrainerDept', name: 'General Trainer Department' },
    { id: 5, key: 'personalTrainerDept', name: 'Personal Trainer Department' },
    { id: 10, key: 'salesAgentDept', name: 'Sales Agent Department' },
    { id: 7, key: 'receptionistDept', name: 'Receptionist Department' },
    { id: 2, key: 'adminDept', name: 'Admin Department' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, [adminId, loggedInUserId]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Staff Members
      try {
        const staffRes = await axiosInstance.get('/staff');
        if (staffRes.data?.success && Array.isArray(staffRes.data.data)) {
          setStaffMembers(staffRes.data.data);
        } else if (Array.isArray(staffRes.data)) {
          setStaffMembers(staffRes.data);
        }
      } catch (staffErr) {
        console.warn("Could not fetch staff members:", staffErr);
      }

      // 2. Fetch Tasks
      let fetchedTasks = [];
      if (isAdmin) {
        try {
          const res = adminId
            ? await axiosInstance.get(`/housekeepingtask/tasks/admin/${adminId}`)
            : await axiosInstance.get('/housekeepingtask/all');

          if (res.data?.success && Array.isArray(res.data.data)) {
            fetchedTasks = res.data.data;
          } else if (Array.isArray(res.data)) {
            fetchedTasks = res.data;
          }
        } catch (taskErr) {
          try {
            const fallbackRes = await axiosInstance.get('/housekeepingtask/all');
            if (fallbackRes.data?.success && Array.isArray(fallbackRes.data.data)) {
              fetchedTasks = fallbackRes.data.data;
            } else if (Array.isArray(fallbackRes.data)) {
              fetchedTasks = fallbackRes.data;
            }
          } catch (fbErr) {
            console.warn("Fallback fetch all tasks failed:", fbErr);
          }
        }
      } else if (loggedInUserId) {
        try {
          const res = await axiosInstance.get(`/housekeepingtask/asignedto/${loggedInUserId}`);
          if (res.data?.success && Array.isArray(res.data.data)) {
            fetchedTasks = res.data.data;
          } else if (Array.isArray(res.data)) {
            fetchedTasks = res.data;
          }
        } catch (tErr) {
          console.warn("Could not fetch assigned tasks:", tErr);
        }
      }

      // Format tasks for UI table rendering
      const formattedTasks = fetchedTasks.map(t => ({
        id: t.id,
        assignedTo: t.assignedTo,
        roleId: t.roleId,
        role: departments.find(d => d.id === t.roleId) || t.role,
        title: t.taskTitle || t.title,
        description: t.description || '',
        dueDate: t.dueDate,
        priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) : 'Medium',
        status: t.status || 'Assigned'
      }));

      setTasks(formattedTasks);
    } catch (err) {
      console.error("Error loading task management data:", err);
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const getDeptName = (deptId, fallbackName) => {
    const found = departments.find(d => d.id === parseInt(deptId));
    if (found) return t(`tasksPage.${found.key}`, found.name);
    return fallbackName ? `${fallbackName} Department` : t('tasksPage.department', 'Department');
  };

  const getStaffName = (task) => {
    if (task.roleId) {
      return getDeptName(task.roleId, task.role?.name || task.role);
    }
    const staff = staffMembers.find(s => s.staffId === task.assignedTo);
    return staff ? staff.fullName : 'Unknown';
  };

  const renderPriority = (priority) => {
    if (!priority) return '';
    const p = priority.toLowerCase();
    if (p === 'high') return t('tasksPage.high', 'High');
    if (p === 'medium') return t('tasksPage.medium', 'Medium');
    if (p === 'low') return t('tasksPage.low', 'Low');
    return priority;
  };

  const renderStatus = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'assigned') return t('tasksPage.assignedStatus', 'Assigned');
    if (s === 'pending') return t('tasksPage.pendingStatus', 'Pending');
    if (s === 'review pending' || s === 'reviewpending') return t('tasksPage.reviewPendingStatus', 'Review Pending');
    if (s === 'completed') return t('tasksPage.completedStatus', 'Completed');
    if (s === 'approved') return t('tasksPage.approvedStatus', 'Approved');
    if (s === 'rejected') return t('tasksPage.rejectedStatus', 'Rejected');
    if (s === 'in progress' || s === 'inprogress') return t('tasksPage.inProgressStatus', 'In Progress');
    return status;
  };

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusClass = (status) => {
    const map = {
      'Completed': 'success',
      'Approved': 'success',
      'Assigned': 'info',
      'Review Pending': 'warning',
      'Pending': 'warning',
      'Rejected': 'danger',
      'In Progress': 'primary'
    };
    return map[status] || 'secondary';
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await axiosInstance.delete(`/housekeepingtask/${taskId}`);
      if (response.data.success) {
        setTasks(tasks.filter(t => t.id !== taskId));
        alert('Task deleted successfully!');
      } else {
        alert(response.data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting task');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      const response = await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: 'Approved'
      });
      if (response.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Approved' } : t));
        alert('Task approved!');
      } else {
        alert('Failed to approve task');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Error approving task');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      const response = await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: 'Assigned' // Return to staff
      });
      if (response.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Assigned' } : t));
        alert('Task rejected and sent back to staff!');
      } else {
        alert('Failed to reject task');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Error rejecting task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: 'Review Pending'
      });
      if (response.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Review Pending' } : t));
        alert('Task marked as complete and sent to Admin for review!');
      } else {
        alert('Failed to update task status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating task status');
    }
  };

  const handleCreateTask = async () => {
    const { assignedTo, roleId, taskTitle, dueDate, priority, description } = taskForm;

    if (!roleId || !taskTitle || !dueDate) {
      alert('Please fill all required fields: Department, Title, and Due Date.');
      return;
    }

    try {
      const payload = {
        assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
        roleId: parseInt(roleId, 10),
        adminId: parseInt(adminId, 10),
        taskTitle,
        description: description || '',
        dueDate, // "YYYY-MM-DD" format
        priority // API expects "High", "Medium", etc. (case-sensitive as per your example)
      };
      console.log("AdminTaskManagement: Creating task with payload:", payload);

      const response = await axiosInstance.post(`/housekeepingtask/create`, payload);

      if (response.data.success) {
        const newTask = {
          id: response.data.data.id,
          assignedTo: response.data.data.assignedTo,
          roleId: response.data.data.roleId,
          role: departments.find(d => d.id === response.data.data.roleId),
          title: response.data.data.taskTitle,
          description: response.data.data.description,
          dueDate: response.data.data.dueDate,
          priority: response.data.data.priority.charAt(0).toUpperCase() + response.data.data.priority.slice(1),
          status: response.data.data.status || 'Assigned'
        };

        setTasks([...tasks, newTask]);

        // Reset form
        setTaskForm({
          assignedTo: '',
          roleId: '',
          taskTitle: '',
          description: '',
          dueDate: '',
          priority: 'Medium'
        });
        setShowTaskModal(false);
        alert('Task created successfully!');
      } else {
        alert(response.data.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('Error creating task: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExport = () => {
    if (tasks.length === 0) {
      alert("No data available to export");
      return;
    }

    // Define CSV headers
    const headers = ["Assigned To", "Task", "Description", "Due Date", "Priority", "Status"];

    // Map data rows
    const rows = tasks.map(task => {
      // Find assigned to label
      let assignedToLabel = 'Unknown';
      if (task.roleId && task.role) {
        assignedToLabel = `${task.role.name || task.role} Department`;
      } else {
        const staff = staffMembers.find(s => s.staffId === task.assignedTo);
        assignedToLabel = staff ? staff.fullName : 'Unknown';
      }

      return [
        assignedToLabel,
        task.title || '',
        task.description || '',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        task.priority || '',
        task.status || ''
      ];
    });

    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tasks_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (tasks.length === 0) {
      alert("No data available to export");
      return;
    }

    const header = ["Assigned To", "Task", "Description", "Due Date", "Priority", "Status"];
    const rows = tasks.map(task => {
      let assignedToLabel = 'Unknown';
      if (task.roleId && task.role) {
        assignedToLabel = `${task.role.name || task.role} Department`;
      } else {
        const staff = staffMembers.find(s => s.staffId === task.assignedTo);
        assignedToLabel = staff ? staff.fullName : 'Unknown';
      }
      return [
        assignedToLabel,
        task.title || '',
        task.description || '',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        task.priority || '',
        task.status || ''
      ];
    });

    exportToPDF(
      rows,
      header,
      "Task Management Report",
      `Tasks_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  const renderTaskModal = () => {
    if (!showTaskModal) return null;

    return (
      <>
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0 px-4 py-3" style={{ background: 'linear-gradient(135deg, #1e1b18 0%, #120e0c 100%)', color: '#ffffff', borderBottom: '3px solid #ea580c' }}>
                <h5 className="modal-title fw-bold text-white">{t('tasksPage.createTask', 'Create New Task')}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowTaskModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('tasksPage.department', 'Department')} *</label>
                      <select
                        className="form-select"
                        name="roleId"
                        value={taskForm.roleId}
                        onChange={(e) => {
                          setTaskForm(prev => ({
                            ...prev, 
                            roleId: e.target.value, 
                            assignedTo: '' // Reset assignedTo when department changes
                          }));
                        }}
                        required
                      >
                        <option value="">{t('tasksPage.selectDepartment', 'Select Department')}</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {t(`tasksPage.${dept.key}`, dept.name)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">{t('tasksPage.staffMemberOptional', 'Staff Member (Optional)')}</label>
                      <select
                        className="form-select"
                        name="assignedTo"
                        value={taskForm.assignedTo}
                        onChange={handleTaskFormChange}
                        disabled={!taskForm.roleId}
                      >
                        <option value="">{t('tasksPage.selectStaffMember', 'Select Staff Member')}</option>
                        {staffMembers
                          .filter(staff => staff.roleId === parseInt(taskForm.roleId))
                          .map(staff => (
                            <option key={staff.staffId || staff.id} value={staff.staffId || staff.id}>
                              {staff.fullName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('tasksPage.taskTitle', 'Task Title')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="taskTitle"
                        value={taskForm.taskTitle}
                        onChange={handleTaskFormChange}
                        placeholder="e.g. Clean locker room"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('tasksPage.dueDate', 'Due Date')} *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dueDate"
                        value={taskForm.dueDate}
                        onChange={handleTaskFormChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('tasksPage.priority', 'Priority')}</label>
                      <select
                        className="form-select"
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleTaskFormChange}
                      >
                        <option value="Low">{t('tasksPage.low', 'Low')}</option>
                        <option value="Medium">{t('tasksPage.medium', 'Medium')}</option>
                        <option value="High">{t('tasksPage.high', 'High')}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('tasksPage.description', 'Description')}</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={taskForm.description}
                        onChange={handleTaskFormChange}
                        rows="2"
                        placeholder="Optional details"
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary px-4"
                  onClick={() => setShowTaskModal(false)}
                >
                  {t('tasksPage.cancel', 'Cancel')}
                </button>
                <button
                  className="btn text-white fw-semibold px-4 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none' }}
                  onClick={handleCreateTask}
                >
                  {t('tasksPage.createTask', 'Create Task')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop show"></div>
      </>
    );
  };

  if (loading) {
    return <div className="container-fluid py-4">{t('common.loading', 'Loading data...')}</div>;
  }

  if (error) {
    return <div className="container-fluid py-4 text-danger">{error}</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold" style={{ color: '#ea580c' }}>{t('tasksPage.title', 'Task Management')}</h2>
        <div className="d-flex gap-2">
          <div className="dropdown">
            <button
              className="btn btn-outline-success dropdown-toggle d-flex align-items-center shadow-sm"
              type="button"
              id="exportTaskDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <FaDownload className="me-2" /> {t('tasksPage.export', 'Export')}
            </button>
            <ul className="dropdown-menu shadow-sm border-0" aria-labelledby="exportTaskDropdown">
              <li>
                <button className="dropdown-item text-success fw-medium py-2" onClick={handleExport}>
                  <strong>CSV</strong> {t('expensesPage.exportCsv', 'Export to CSV')}
                </button>
              </li>
              <li>
                <button className="dropdown-item text-danger fw-medium py-2" onClick={handleExportPDF}>
                  <strong>PDF</strong> {t('expensesPage.exportPdf', 'Export to PDF')}
                </button>
              </li>
            </ul>
          </div>
          {isAdmin && (
            <button
              className="btn text-white shadow-sm fw-semibold d-flex align-items-center"
              style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '8px', padding: '8px 20px' }}
              onClick={() => setShowTaskModal(true)}
            >
              <Plus size={18} className="me-1" /> {t('tasksPage.createTask', 'Create Task')}
            </button>
          )}
        </div>
      </div>

      {/* All Tasks Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: 'linear-gradient(135deg, #1e1b18 0%, #120e0c 100%)', color: '#ffffff' }}>
              <tr>
                <th className="py-3 px-3 text-white">{t('tasksPage.assignedTo', 'Assigned To')}</th>
                <th className="py-3 text-white">{t('tasksPage.task', 'Task')}</th>
                <th className="py-3 text-white">{t('tasksPage.dueDate', 'Due Date')}</th>
                <th className="py-3 text-white">{t('tasksPage.priority', 'Priority')}</th>
                <th className="py-3 text-white">{t('tasksPage.status', 'Status')}</th>
                <th className="py-3 text-white">{t('tasksPage.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-dark fw-medium">{t('tasksPage.noTasksFound', 'No tasks found')}</td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id}>
                    <td className="fw-semibold text-dark">{getStaffName(task)}</td>
                    <td className="text-dark">{task.title}</td>
                    <td className="text-dark">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                        {renderPriority(task.priority)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusClass(task.status)}`}>
                        {renderStatus(task.status)}
                      </span>
                    </td>
                    <td>
                      {isAdmin && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Tasks Section */}
      <div className="mt-4">
        <h4 className="mb-3 fw-bold" style={{ color: '#ea580c' }}>{isAdmin ? t('tasksPage.pendingApproval', 'Pending Tasks (Approval Required)') : t('tasksPage.myActionableTasks', 'My Actionable Tasks')}</h4>
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: 'linear-gradient(135deg, #1e1b18 0%, #120e0c 100%)', color: '#ffffff' }}>
                <tr>
                  <th className="py-3 px-3 text-white">{t('tasksPage.assignedTo', 'Assigned To')}</th>
                  <th className="py-3 text-white">{t('tasksPage.task', 'Task')}</th>
                  <th className="py-3 text-white">{t('tasksPage.dueDate', 'Due Date')}</th>
                  <th className="py-3 text-white">{t('tasksPage.status', 'Status')}</th>
                  <th className="py-3 text-white">{t('tasksPage.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(task => {
                  const s = (task.status || '').toLowerCase();
                  if (isAdmin) {
                    return s === 'pending' || s === 'review pending' || s === 'pending approval' || s === 'in progress';
                  } else {
                    return s === 'assigned' || s === 'rejected' || s === 'pending';
                  }
                }).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-dark fw-medium">{t('tasksPage.noActionableTasks', 'No actionable tasks')}</td>
                  </tr>
                ) : (
                  tasks
                    .filter(task => {
                      const s = (task.status || '').toLowerCase();
                      if (isAdmin) {
                        return s === 'pending' || s === 'review pending' || s === 'pending approval' || s === 'in progress';
                      } else {
                        return s === 'assigned' || s === 'rejected' || s === 'pending';
                      }
                    })
                    .map(task => (
                      <tr key={task.id}>
                        <td className="fw-semibold text-dark">{getStaffName(task)}</td>
                        <td className="text-dark">{task.title}</td>
                        <td className="text-dark">{new Date(task.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge bg-${getStatusClass(task.status)}`}>
                            {renderStatus(task.status)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            {isAdmin ? (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleApproveTask(task.id)}
                                  title="Approve"
                                >
                                  <Check size={14} /> {t('tasksPage.approve', 'Approve')}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger ms-1"
                                  onClick={() => handleRejectTask(task.id)}
                                  title="Reject"
                                >
                                  <X size={14} /> {t('tasksPage.reject', 'Reject')}
                                </button>
                              </>
                            ) : (
                              <button
                                  className="btn btn-sm text-white fw-semibold"
                                  style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none' }}
                                  onClick={() => handleCompleteTask(task.id)}
                                  title="Mark as Complete"
                                >
                                  <Check size={14} /> {t('tasksPage.markComplete', 'Mark Complete')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {renderTaskModal()}
    </div>
  );
};

export default AdminTaskManagement;