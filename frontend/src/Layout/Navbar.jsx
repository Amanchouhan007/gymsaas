import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaBell, FaUserCircle, FaBars, FaHeadset } from "react-icons/fa";
import Logo from "../assets/Logo/logo.png";
import Account from "../Dashboard/Member/Account";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";
import { useSocket } from "../Context/SocketContext";
import LanguageSelector from "../Components/LanguageSelector";

const Navbar = ({ toggleSidebar }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [showProfileModal, setShowProfileModal] = useState(false);

  // State for dynamic logo and loading status
  const [appLogo, setAppLogo] = useState(Logo); // Initialize with default logo
  const [loading, setLoading] = useState(true); // For initial loading state

  const dropdownRef = useRef();
  
  // Notification State
  const [notifications, setNotifications] = useState([]);  // only UNREAD for badge
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef();
  const notifPollRef = useRef(null);

  // Get user data from localStorage
  const getUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  };

  // Initialize profile state with user data from localStorage
  const user = getUserFromLocalStorage();
  const getCleanImg = (img) => {
    if (!img || typeof img !== 'string' || img.includes('randomuser.me') || img.includes('portraits')) return "";
    return img.trim();
  };

  const [profile, setProfile] = useState({
    name: user?.fullName || "Admin",
    email: user?.email || "admin@gymapp.com",
    phone: user?.phone || "+91 90000 00000",
    role: user?.roleName || "Super Admin",
    branch: user?.branchName || "All Branches",
    adminId: user?.adminId || "",
    branchId: user?.branchId || "",
    profileImage: getCleanImg(user?.profileImage),
    roleId: user?.roleId || "",
    staffId: user?.staffId || "",
    notifyEmail: true,
    notifySMS: false,
  });

  // --- CHANGE 2: Update fetchAppSettings to use axiosInstance ---
  const fetchAppSettings = async () => {
    try {
      const userData = getUserFromLocalStorage();
      if (!userData) {
        setAppLogo(Logo);
        setLoading(false);
        return;
      }

      // Resolve adminId across all roles (Admin, Staff, Trainer, Receptionist, Member)
      let adminId = userData.adminId || userData.createdById || userData.ownerId;
      if (!adminId) {
        const role = (userData.roleName || "").toUpperCase();
        if (role === 'ADMIN' || role === 'SUPERADMIN' || userData.roleId === 1 || userData.roleId === 2 || !userData.roleName) {
          adminId = userData.id;
        } else {
          adminId = userData.adminId || userData.id;
        }
      }

      if (!adminId) {
        setAppLogo(Logo);
        setLoading(false);
        return;
      }

      const endpoint = `/adminSettings/app-settings/admin/${adminId}`;
      const response = await axiosInstance.get(endpoint);
      const result = response.data;

      if (result.success && result.data && result.data.logo && typeof result.data.logo === 'string' && result.data.logo.trim() !== '' && result.data.logo !== 'null' && result.data.logo !== 'undefined') {
        setAppLogo(result.data.logo);
      } else {
        setAppLogo(Logo);
      }
    } catch (error) {
      setAppLogo(Logo);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only UNREAD notifications (for red dot badge)
  const fetchUnreadNotifications = async () => {
    try {
      const u = getUserFromLocalStorage();
      if (u && u.id) {
        let res;
        const role = u.roleName;
        if (role === 'Member') {
          res = await axiosInstance.get(`/app-notifications?limit=50`);
        } else {
          res = await axiosInstance.get(`/app-notifications?limit=50`);
        }
        if (res.data && res.data.notifications) {
          setNotifications(res.data.notifications);
        }
      }
    } catch (err) {
      // silently fail for notification polling
    }
  };

  useEffect(() => {
    fetchAppSettings();
    fetchUnreadNotifications();

    const handleSettingsUpdate = (e) => {
      if (e?.detail?.logo) {
        setAppLogo(e.detail.logo);
      }
      fetchAppSettings();
    };

    window.addEventListener("appSettingsUpdated", handleSettingsUpdate);
    window.addEventListener("logoUpdated", handleSettingsUpdate);

    // Poll for new notifications every 30 seconds
    notifPollRef.current = setInterval(fetchUnreadNotifications, 30000);
    return () => {
      if (notifPollRef.current) clearInterval(notifPollRef.current);
      window.removeEventListener("appSettingsUpdated", handleSettingsUpdate);
      window.removeEventListener("logoUpdated", handleSettingsUpdate);
    };
  }, []);

  // Mark notification as read — removes from unread list + updates DB
  const markNotificationRead = async (id) => {
    try {
      await axiosInstance.patch(`/app-notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Mark ALL unread notifications as read
  const markAllRead = async () => {
    try {
      await axiosInstance.patch(`/app-notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    // Sync unread notifications whenever the socket reconnects
    const handleConnect = () => {
      fetchUnreadNotifications();
    };
    socket.on("connect", handleConnect);

    // Real-time: new notification arrives → add to list
    const handleNewNotification = (data) => {
      setNotifications(prev => {
        if (prev.some(n => n.id === data.id)) return prev;
        return [data, ...prev];
      });
    };

    const handleNotificationRead = (data) => {
      setNotifications(prev => prev.map(n => n.id === data.id ? { ...n, isRead: true } : n));
    };

    const handleAllNotificationsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("notification_read", handleNotificationRead);
    socket.on("all_notifications_read", handleAllNotificationsRead);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_read", handleNotificationRead);
      socket.off("all_notifications_read", handleAllNotificationsRead);
    };
  }, [socket]);

  useEffect(() => {
    const intervalId = setInterval(fetchAppSettings, 60000); // Fetch every 60 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Existing useEffect for profile management (no changes here)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = getUserFromLocalStorage();
      if (updatedUser) {
        setProfile({
          name: updatedUser.fullName || "",
          email: updatedUser.email || "",
          profileImage: updatedUser.profileImage || "",
          phone: updatedUser.phone || "",
          role: updatedUser.roleName || "",
          branch: updatedUser.branchName || "",
          adminId: updatedUser.adminId || "",
          branchId: updatedUser.branchId || "",
          roleId: updatedUser.roleId || "",
          staffId: updatedUser.staffId || "",
          notifyEmail: true,
          notifySMS: false,
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const intervalId = setInterval(() => {
      const currentUser = getUserFromLocalStorage();
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        handleStorageChange();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect(() => {
  //   document.body.style.overflow = showProfileModal ? "hidden" : "unset";
  //   return () => (document.body.style.overflow = "unset");
  // }, [showProfileModal]);

  const handleSaveProfile = () => {
    try {
      const currentUser = getUserFromLocalStorage();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          fullName: profile.name,
          email: profile.email,
          profileImage: profile.profileImage,
          phone: profile.phone,
          branchName: profile.branch,
          adminId: profile.adminId,
          branchId: profile.branchId,
          roleId: profile.roleId,
          staffId: profile.staffId,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      alert("Profile saved!");
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error saving profile to localStorage:", error);
      alert("Error saving profile!");
    }
  };

  // Proper logout handler
  const handleLogout = async () => {
    try {
      // Optionally call logout API endpoint to invalidate token on server
      try {
        await axiosInstance.post('/auth/logout');
      } catch (err) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', err);
      }

      // Clear all authentication data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAuthenticated');
      sessionStorage.clear();

      // Close dropdown
      setDropdownOpen(false);

      // Redirect with a full page reload to clear any React/Redux/Query in-memory state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear localStorage and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <>
      <style>
        {`
          .notif-dropdown-menu {
            position: absolute;
            top: 110%;
            right: 0;
            width: 360px;
            max-width: calc(100vw - 20px);
            z-index: 1050;
            max-height: 480px;
            overflow-y: auto;
            border-radius: 14px;
            border: 1px solid rgba(234, 88, 12, 0.25);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            animation: dropdownFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @keyframes dropdownFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseBadge {
            0% { transform: translate(50%, -50%) scale(1); }
            50% { transform: translate(50%, -50%) scale(1.18); }
            100% { transform: translate(50%, -50%) scale(1); }
          }
          .notif-pulse-badge {
            animation: pulseBadge 1.8s infinite ease-in-out;
          }
          .nav-toggle-btn {
            background: rgba(234, 88, 12, 0.15) !important;
            border: 1px solid rgba(234, 88, 12, 0.4) !important;
            color: #ffffff !important;
            border-radius: 10px !important;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .nav-toggle-btn:hover {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%) !important;
            border-color: #ea580c !important;
            box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4) !important;
            transform: translateY(-1px);
          }
          @media (max-width: 576px) {
            .notif-dropdown-menu {
              position: fixed;
              top: 70px;
              right: 10px;
              left: 10px;
              width: auto;
              max-width: none;
            }
          }
        `}
      </style>
      <nav
        className="navbar navbar-expand px-2 px-md-3 py-2 d-flex justify-content-between align-items-center fixed-top"
        style={{
          background: "linear-gradient(135deg, #120602 0%, #1c0b05 50%, #271107 100%)",
          borderBottom: "1px solid rgba(234, 88, 12, 0.25)",
          boxShadow: "0 4px 25px rgba(0, 0, 0, 0.35)",
          zIndex: 1050,
          paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <button
            className="btn p-2 nav-toggle-btn d-flex align-items-center justify-content-center"
            onClick={toggleSidebar}
            title="Toggle Menu"
          >
            <FaBars size={18} color="currentColor" />
          </button>
          
          {/* Logo & Brand Name */}
          <Link to="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none ms-1">
            <img 
              src={Logo} 
              alt="Logo" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = Logo;
              }}
              style={{ height: "34px", width: "auto", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} 
            />
            <span 
              className="fw-bold text-white fs-6 d-none d-sm-inline-block tracking-wide ms-1" 
              style={{ 
                letterSpacing: "0.6px", 
                background: "linear-gradient(135deg, #ffffff 0%, #fed7aa 100%)", 
                WebkitBackgroundClip: "text", 
                WebkitTextFillColor: "transparent",
                textTransform: "uppercase",
                fontSize: "0.95rem"
              }}
            >
              YOUR GYM
            </span>
          </Link>
        </div>

        <div className="me-1 me-md-2 d-flex align-items-center gap-2 gap-md-3 position-relative">
          
          {/* Language Selector */}
          <LanguageSelector variant="compact" />

          {/* Help Desk Button */}
          <Link
            to={
              profile?.role === 'Super Admin' ||
              profile?.role === 'SuperAdmin' ||
              profile?.role === 'Superadmin' ||
              profile?.role === 'SUPERADMIN' ||
              profile?.role === 'Subadmin' ||
              profile?.role === 'SUBADMIN' ||
              profile?.roleId === 1
                ? '/superadmin/support'
                : '/admin/support'
            }
            className="btn text-white d-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-3 text-decoration-none shadow-sm"
            style={{
              background: "rgba(234, 88, 12, 0.18)",
              border: "1px solid rgba(234, 88, 12, 0.35)",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "#fdba74",
              transition: "all 0.2s ease"
            }}
            title={t("nav.helpDesk", "Help Desk")}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(234, 88, 12, 0.35)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(234, 88, 12, 0.18)"}
          >
            <FaHeadset size={16} className="text-warning" />
            <span className="d-none d-md-inline ms-1" style={{ color: "#fff" }}>{t("nav.helpDesk", "Help Desk")}</span>
          </Link>

          {/* Notifications */}
          <div className="position-relative" ref={notifRef}>
            <button 
              className="btn text-white position-relative p-2 d-flex align-items-center justify-content-center"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{ border: 'none', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', transition: 'all 0.2s ease', width: '38px', height: '38px' }}
              title="Notifications"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(234, 88, 12, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            >
              <FaBell size={20} color="#f8fafc" />
              {/* Red dot sits right on top-right corner of bell icon */}
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span 
                  className="badge rounded-circle notif-pulse-badge d-flex align-items-center justify-content-center" 
                  style={{ 
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    fontSize: '0.65rem', 
                    fontWeight: '700',
                    width: '18px', 
                    height: '18px',
                    padding: '0',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: '2px solid #120602',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.7)',
                    zIndex: 10
                  }}
                >
                  {notifications.filter(n => !n.isRead).length > 99 ? '99+' : notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            
            {showNotifDropdown && (
              <div 
                className="dropdown-menu show shadow p-0 notif-dropdown-menu"
              >
                {/* Header */}
                <div 
                  className="p-3 border-bottom d-flex justify-content-between align-items-center"
                  style={{ position: "sticky", top: 0, zIndex: 2, background: "#1c0b05", borderBottom: "1px solid rgba(234, 88, 12, 0.2)", borderRadius: "14px 14px 0 0" }}
                >
                  <span className="fw-bold text-white" style={{ fontSize: "0.95rem" }}>🔔 {t('nav.notifications', 'Notifications')}</span>
                  <div className="d-flex align-items-center gap-2">
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="badge rounded-pill px-2 py-1" style={{ fontSize: "0.7rem", background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)" }}>
                        {notifications.filter(n => !n.isRead).length} {t('common.unread', 'Unread')}
                      </span>
                    )}
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <button 
                        className="btn btn-sm text-white py-0 px-2"
                        style={{ fontSize: "0.7rem", lineHeight: "1.8", background: "rgba(234, 88, 12, 0.2)", border: "1px solid rgba(234, 88, 12, 0.4)", borderRadius: "6px" }}
                        onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                        title={t('common.markAllRead', 'Mark all read')}
                      >
                        {t('common.markAllRead', 'Mark all read')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-muted" style={{ background: "#fff" }}>
                    <FaBell size={32} style={{ color: "#fdba74" }} className="mb-2 d-block mx-auto" />
                    <p className="mb-0" style={{ fontSize: "0.9rem" }}>{t('common.noNewNotifications', 'No new notifications')}</p>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {notifications.map(n => (
                      <li 
                        key={n.id} 
                        className="list-group-item list-group-item-action p-3 border-bottom"
                        style={{ cursor: 'pointer', background: n.isRead ? "#fff" : "#fff7ed", transition: "background-color 0.15s", opacity: n.isRead ? 0.85 : 1 }}
                        onClick={() => {
                          if (!n.isRead) markNotificationRead(n.id);
                          if (n.actionUrl) {
                            navigate(n.actionUrl);
                          } else if (n.referenceType === 'CLASS' || n.reference_type === 'CLASS') {
                            if (profile.role === 'Member') navigate('/member/classschedule');
                            else if (profile.role === 'Trainer' || profile.role === 'General Trainer' || profile.role === 'Personal Trainer') navigate('/trainer/classesschedule');
                            else navigate('/admin/classesschedule');
                          } else if (n.referenceType === 'SESSION' || n.reference_type === 'SESSION') {
                            if (profile.role === 'Member') navigate('/member/sessions');
                            else if (profile.role === 'Trainer' || profile.role === 'General Trainer' || profile.role === 'Personal Trainer') navigate('/trainer/sessions');
                            else navigate('/admin/personaltraining');
                          }
                          setShowNotifDropdown(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#ffedd5"}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "#fff" : "#fff7ed"}
                      >
                        <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                          <small className={n.isRead ? "text-secondary fw-bold" : "fw-bold"} style={{ fontSize: "0.8rem", color: n.isRead ? "#64748b" : "#ea580c" }}>
                            {n.type && (n.type.includes('SUBSCRIPTION') || n.type.includes('PLAN')) ? '💳 ' : 
                             n.type && n.type.includes('MEMBER') ? '👤 ' : 
                             n.type === 'ANNOUNCEMENT_CREATED' ? '📢 ' : '🔵 '}
                            {n.title || n.type}
                          </small>
                          <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                            {n.formatted_date ? `${n.formatted_date} • ${n.formatted_time} ${n.timezone}` : new Date(n.createdAt).toLocaleString()}
                          </small>
                        </div>
                        <p className="mb-1 text-dark" style={{ whiteSpace: "pre-line", wordBreak: 'break-word', fontSize: "0.88rem", lineHeight: "1.4" }}>
                          {n.message ? (
                            n.message.includes("📎 Attachment:") ? (
                              <>
                                {n.message.split("📎 Attachment:")[0].replace(/You can now login at http:\/\/localhost:5173\/login\.?/g, '').replace(/\\n/g, '\n').trim()}
                                <a 
                                  href={n.message.split("📎 Attachment:")[1]?.trim()} 
                                  target="_blank" rel="noopener noreferrer" 
                                  className="badge bg-warning text-dark text-decoration-none mt-1 d-inline-block px-2 py-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  📎 {t('common.viewAttachment', 'View Attachment')}
                                </a>
                              </>
                            ) : n.message.replace(/You can now login at http:\/\/localhost:5173\/login\.?/g, '').replace(/\\n/g, '\n').trim()
                          ) : ""}
                        </p>
                        <div className="text-end">
                          <small style={{ fontSize: "0.7rem", color: "#ea580c" }}>✓ {t('common.clickToDismiss', 'Click to dismiss')}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Footer */}
                <div 
                  className="p-2 border-top text-center"
                  style={{ position: "sticky", bottom: 0, zIndex: 2, background: "#fff", borderRadius: "0 0 14px 14px" }}
                >
                  <Link 
                    to="/notifications" 
                    className="text-decoration-none fw-semibold"
                    style={{ fontSize: "0.85rem", color: "#ea580c" }}
                    onClick={() => setShowNotifDropdown(false)}
                  >
                    {t('common.viewAllNotifications', 'View All Notifications →')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="dropdown" ref={dropdownRef}>
            <div
              className="d-flex align-items-center gap-2 cursor-pointer text-white p-1 rounded-pill"
              role="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ transition: "all 0.2s ease" }}
            >
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: "36px", height: "36px", objectFit: "cover", border: "2px solid #ea580c" }}
                />
              ) : (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "white" }}
                >
                  <FaUserCircle size={32} />
                </div>
              )}
              <div className="d-none d-sm-block text-white">
                <small className="mb-0" style={{ color: "#fdba74", fontSize: "0.75rem" }}>
                  {profile?.role || t('common.user', 'User')}
                </small>
                <div className="fw-bold" style={{ fontSize: "0.88rem", lineHeight: "1.1" }}>
                  {profile?.name || t('common.guest', 'Guest')}
                </div>
              </div>
            </div>

            {dropdownOpen && (
              <ul
                className="dropdown-menu show mt-2 shadow-lg"
                style={{
                  position: "absolute",
                  right: 0,
                  minWidth: "200px",
                  maxWidth: "calc(100vw - 30px)",
                  zIndex: 1000,
                  borderRadius: "12px",
                  border: "1px solid rgba(234, 88, 12, 0.2)",
                  overflow: "hidden",
                  animation: "dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <li>
                  <Link className="text-decoration-none" to="/account">
                    <button
                      className="dropdown-item fw-medium py-2"
                      onClick={() => {
                        setDropdownOpen(false);
                      }}
                    >
                      👤 {t('nav.profile', 'Profile & Settings')}
                    </button>
                  </Link>
                </li>
                <li>
                  <Link 
                    className="text-decoration-none" 
                    to={
                      (() => {
                        const r = (profile?.role || user?.roleName || user?.role || '').toString().toLowerCase();
                        if (r.includes('superadmin') || r.includes('super admin') || r.includes('subadmin') || profile?.roleId === 1) return '/superadmin/how-to-use';
                        if (r.includes('receptionist') || r.includes('reception')) return '/receptionist/how-to-use';
                        if (r.includes('personaltrainer') || r.includes('personal trainer') || r === 'pt') return '/personaltrainer/how-to-use';
                        if (r.includes('generaltrainer') || r.includes('general trainer') || r === 'gt') return '/generaltrainer/how-to-use';
                        if (r.includes('sales')) return '/sales/how-to-use';
                        if (r.includes('manager')) return '/manager/how-to-use';
                        if (r.includes('housekeeping')) return '/housekeeping/how-to-use';
                        if (r.includes('member')) return '/member/how-to-use';
                        if (r.includes('admin')) return '/admin/how-to-use';
                        return '/how-to-use';
                      })()
                    }
                  >
                    <button
                      className="dropdown-item fw-medium py-2"
                      onClick={() => {
                        setDropdownOpen(false);
                      }}
                    >
                      📖 {t('nav.howToUse', 'How To Use')}
                    </button>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider my-1" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger fw-semibold py-2"
                    onClick={handleLogout}
                    style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                  >
                    🚪 {t('nav.logout', 'Logout')}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
