import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faCodeBranch,
  faUserShield,
  faClipboardList,
  faTags,
  faCreditCard,
  faCogs,
  faUsers,
  faPlusCircle,
  faChalkboardTeacher,
  faCalendarCheck,
  faUserTie,
  faClock,
  faChevronDown,
  faTasks,
  faDumbbell,
  faChartPie,
  faTools,
  faBroom,
  faQrcode,
  faUserCheck,
  faCalendar,
  faClipboardCheck,
  faLayerGroup,
  faFileInvoice,
  faBookAtlas,
  faUserPlus,
  faDoorOpen,
  faMoneyCheckAlt,
  faUserFriends,
  faComments,
  faEye,
  faClapperboard,
  faIdCard,
  faAddressBook,
  faHeartbeat,
  faTrophy,
  faBoxes,
  faBullhorn,
  faCoins,
  faEnvelope,
  faHeadset,
  faDatabase,
  faBookOpen
} from "@fortawesome/free-solid-svg-icons";


import "./Sidebar.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("userRole")?.toUpperCase() || "ADMIN";
  });
  const [userPermissions, setUserPermissions] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role.toUpperCase());
    }
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.permissions) {
          let perms = userObj.permissions;
          if (typeof perms === "string") {
            try {
              perms = JSON.parse(perms);
              if (typeof perms === "string") {
                perms = JSON.parse(perms);
              }
            } catch (e) { }
          }
          setUserPermissions(Array.isArray(perms) ? perms : []);
        }
      }
    } catch (e) { }
  }, []); // Add empty dependency array to run only once on mount

  // Listen for storage changes to update role when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      const role = localStorage.getItem("userRole");
      if (role) {
        setUserRole(role.toUpperCase());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-close sidebar on route change on mobile (<992px)
  useEffect(() => {
    if (window.innerWidth < 992) {
      setCollapsed(true);
    }
  }, [location.pathname, setCollapsed]);

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !collapsed && window.innerWidth < 992) {
        setCollapsed(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, setCollapsed]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (window.innerWidth < 992) {
      if (!collapsed) {
        document.body.classList.add("drawer-open");
      } else {
        document.body.classList.remove("drawer-open");
      }
    }
    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [collapsed]);

  const toggleMenu = (menuKey) => {
    setActiveMenu(activeMenu === menuKey ? null : menuKey);
  };

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 992) setCollapsed(true);
  };

  // ------------------ MENUS ------------------
  const allMenus = {
    SUPERADMIN: [
      { name: "Dashboard", icon: faChartBar, path: "/superadmin/dashboard" },
      { name: "Admins", icon: faUserShield, path: "/superadmin/Admin" },
      { name: "Payments", icon: faMoneyCheckAlt, path: "/superadmin/payments" },
      { name: "Setting", icon: faCogs, path: "/superadmin/setting" },
      { name: "System Backups", icon: faDatabase, path: "/superadmin/backups" },
    ],

    SUBADMIN: [
      { name: "Dashboard", icon: faChartBar, path: "/superadmin/dashboard", module: "Dashboard" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/admin/leads", module: "Leads / Inquiries" },
      { name: "Gym Owners", icon: faUserShield, path: "/superadmin/Admin", module: "Gym Owners" },
      { name: "Request Plan", icon: faClipboardList, path: "/superadmin/request-plan", module: "Request Plan" },
      { name: "Plans & Pricing", icon: faTags, path: "/superadmin/Plans&Pricing", module: "Plans & Pricing" },
      { name: "Payments", icon: faMoneyCheckAlt, path: "/superadmin/payments", module: "Payments" },
      { name: "Announcements", icon: faComments, path: "/superadmin/announcements", module: "Announcements" },
      { name: "Message Templates", icon: faEnvelope, path: "/superadmin/automation-settings", module: "Message Templates" },
      { name: "Setting", icon: faCogs, path: "/superadmin/setting", module: "Setting" },
    ].filter(m => userPermissions.includes(m.module)),

    ADMIN: [
      { name: "Dashboard", icon: faChartPie, path: "/admin/admin-dashboard" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/admin/leads" },
      { name: "Members", icon: faUsers, path: "/admin/AdminMember" },
      { name: "At-Risk Members", icon: faHeartbeat, path: "/admin/at-risk-members" },
      { name: "QR Check-in", icon: faQrcode, path: "/admin/qrcheckin" },
      { name: "Create Plan", icon: faPlusCircle, path: "/admin/createplan" },
      {
        name: "Classes & Sessions",
        icon: faChalkboardTeacher,
        key: "Classes",
        subItems: [
          { label: "Class Timetable", path: "/admin/classesSchedule" },
          { label: "Member Bookings", path: "/admin/bookings" },
          { label: "PT Bookings", path: "/admin/booking/personal-training" }
        ]
      },
      {
        name: "Payments",
        icon: faMoneyCheckAlt,
        key: "Payments",
        subItems: [
          { label: "Membership Payments", path: "/admin/payments/membership" }
        ]
      },
      { name: "Expenses & Profit", icon: faCoins, path: "/admin/expenses" },
      { name: "Body Builder", icon: faHeartbeat, path: "/bodybuilder-assessment" },
      { name: "Inventory", icon: faBoxes, path: "/admin/inventory" },
      {
        name: "Staff",
        icon: faUserTie,
        key: "Staff",
        subItems: [
          { label: "Manage Staff", path: "/admin/staff/manage-staff" },
          { label: "Attendance", path: "/admin/staff/attendance" },
          { label: "Salary Calculator", path: "/staff/salary-calculator" }
        ]
      },
      { name: "Shift Management", icon: faClock, path: "/admin/shift-managment" },
      { name: "Task Management", icon: faTasks, path: "/admin/task-managment" },
      { name: "Announcements", icon: faBullhorn, path: "/admin/announcements" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
      {
        name: "Reports",
        icon: faFileInvoice,
        key: "reports",
        subItems: [
          { label: "Sales Report", path: "/admin/reports/sales" },
          { label: "Attendance Report", path: "/admin/reports/AttendanceReport" }
        ]
      },
      { name: "Settings", icon: faTools, path: "/admin/settings" },
      { name: "Audit Logs", icon: faClipboardCheck, path: "/admin/audit-logs" },
      { name: "My Subscription", icon: faTags, path: "/admin/my-subscription" },
      { name: "System Backups", icon: faDatabase, path: "/admin/system-backups" },
    ],

    GENERALTRAINER: [
      { name: "Dashboard", icon: faDumbbell, path: "/generaltrainer/dashboard" },
      { name: "Members", icon: faUsers, path: "/admin/AdminMember" },
      { name: "Client Progress", icon: faChartBar, path: "/personaltrainer/client-progress" },
      { name: "New Assessment", icon: faHeartbeat, path: "/personaltrainer/assessment-form" },
      { name: "Body Builder", icon: faDumbbell, path: "/bodybuilder-assessment" },
      { name: "Diet Builder", icon: faClipboardList, path: "/generaltrainer/diet-builder" },
      { name: "Workout Builder", icon: faDumbbell, path: "/generaltrainer/workout-builder" },
      { name: "Health & BMI Log", icon: faHeartbeat, path: "/generaltrainer/health-log" },
      { name: "Classes Schedule", icon: faCalendar, path: "/generaltrainer/classesschedule" },
      { name: "Shift Management", icon: faClock, path: "/GeneralTrainer/shift-managment" },
      { name: "Attendance", icon: faClipboardCheck, path: "/generaltrainer/attendance" },
      { name: "QR Check-in", icon: faQrcode, path: "/generaltrainer/qrcheckin" },
      { name: "Task Management", icon: faTasks, path: "/generaltrainer/task-management" },
      { name: "Inventory & Requests", icon: faBoxes, path: "/admin/inventory" },
      { name: "Announcements", icon: faBullhorn, path: "/staff/announcements" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    PERSONALTRAINER: [
      { name: "Dashboard", icon: faDumbbell, path: "/personaltrainer/dashboard" },
      { name: "Members", icon: faUsers, path: "/admin/AdminMember" },
      { name: "Client Progress", icon: faChartBar, path: "/personaltrainer/client-progress" },
      { name: "New Assessment", icon: faHeartbeat, path: "/personaltrainer/assessment-form" },
      { name: "Body Builder", icon: faDumbbell, path: "/bodybuilder-assessment" },
      { name: "Diet Builder", icon: faClipboardList, path: "/personaltrainer/diet-builder" },
      { name: "Workout Builder", icon: faDumbbell, path: "/personaltrainer/workout-builder" },
      { name: "Health & BMI Log", icon: faHeartbeat, path: "/personaltrainer/health-log" },
      { name: "Classes Schedule", icon: faCalendar, path: "/personaltrainer/classesschedule" },
      { name: "Shift Management", icon: faClock, path: "/personaltrainer/shift-managment" },
      { name: "Session Bookings", icon: faCalendarCheck, path: "/personaltrainer/bookings" },
      { name: "Attendance", icon: faClipboardCheck, path: "/personaltrainer/personalattendance" },
      { name: "QR Check-in", icon: faQrcode, path: "/personaltrainer/qrcheckin" },
      { name: "Task Management", icon: faTasks, path: "/personaltrainer/task-management" },
      { name: "Inventory & Requests", icon: faBoxes, path: "/admin/inventory" },
      { name: "Announcements", icon: faBullhorn, path: "/staff/announcements" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    SALES_AGENT: [
      { name: "Sales Dashboard", icon: faChartBar, path: "/sales/dashboard" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/sales/leads" },
      { name: "New Registrations", icon: faUserPlus, path: "/sales/walk-in-registration" },
      { name: "Members", icon: faUserFriends, path: "/admin/AdminMember" },
      { name: "At-Risk Members", icon: faHeartbeat, path: "/admin/at-risk-members" },
      { name: "Payments &  Member Attendence", icon: faMoneyCheckAlt, path: "/sales/payment" },
      { name: "Renewals & Follow-ups", icon: faCalendarCheck, path: "/sales/reportattendance" },
      { name: "Task Management", icon: faTasks, path: "/sales/task-management" },
      { name: "Member Attendance Report", icon: faChartPie, path: "/sales/report" },
      { name: " Equipment & Inventory ", icon: faBoxes, path: "/admin/inventory" },
    ],

    RECEPTIONIST: [
      { name: "Reception Dashboard", icon: faUserCheck, path: "/receptionist/dashboard" },
      { name: "New Registrations", icon: faUserPlus, path: "/receptionist/walk-in-registration" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/receptionist/leads" },
      { name: "Members", icon: faUserFriends, path: "/receptionist/members" },
      { name: "At-Risk Members", icon: faHeartbeat, path: "/receptionist/at-risk-members" },
      { name: "Classes Schedule", icon: faCalendar, path: "/receptionist/classes-schedule" },
      { name: "Session Bookings", icon: faCalendarCheck, path: "/receptionist/session-bookings" },
      { name: "QR Check-in", icon: faQrcode, path: "/receptionist/qrcheckin" },
      { name: "Daily Attendance", icon: faClipboardCheck, path: "/receptionist/qr-attendance" },
      { name: "Payments & Member Attendence", icon: faMoneyCheckAlt, path: "/receptionist/payment" },
      { name: "Renewals & Follow-ups", icon: faCalendarCheck, path: "/receptionist/renewals" },
      { name: "Inventory & Requests", icon: faBoxes, path: "/receptionist/inventory" },
      { name: "Task Management", icon: faTasks, path: "/receptionist/task-management" },
      { name: "Announcements", icon: faBullhorn, path: "/receptionist/announcements" },
    ],

    MANAGER: [
      { name: "Dashboard", icon: faChartBar, path: "/manager/dashboard" },
      { name: "Members", icon: faUserFriends, path: "/manager/members" },
      { name: "Duty Roster", icon: faClipboardCheck, path: "/manager/duty-roster" },
      { name: "Class Schedule", icon: faCalendar, path: "/manager/class-schedule" },
      { name: "Reports", icon: faFileInvoice, path: "/manager/reports" },
      { name: "Inventory", icon: faBoxes, path: "/admin/inventory" },
      { name: "Communication", icon: faComments, path: "/manager/communication" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    HOUSEKEEPING: [
      { name: "Dashboard", icon: faTasks, path: "/housekeeping/dashboard" },
      { name: "My Tasks", icon: faClipboardCheck, path: "/housekeeping/dashboard" },
      { name: "QR Check-in", icon: faQrcode, path: "/housekeeping/qrcheckin" },
      { name: "Announcements", icon: faBullhorn, path: "/staff/announcements" },
    ],

    MEMBER: [
      { name: "Dashboard", icon: faEye, path: "/member/dashboard" },
      { name: "My Diet Plan", icon: faClipboardList, path: "/member/my-diet" },
      { name: "My Workouts", icon: faDumbbell, path: "/member/my-workouts" },
      { name: "My Health Log", icon: faHeartbeat, path: "/member/health-log" },
      { name: "Leaderboard", icon: faTrophy, path: "/member/leaderboard" },
      { name: "QR Check-in", icon: faQrcode, path: "/member/qrcheckin" },
      { name: "Attendance", icon: faClipboardCheck, path: "/member/memberattendance" },
      { name: "My Plan", icon: faBookAtlas, path: "/member/viewplan" },
      { name: "Class Schedule", icon: faClapperboard, path: "/member/classSchedule" },
      { name: "Announcements", icon: faBullhorn, path: "/member/announcements" },
      { name: "My Account", icon: faIdCard, path: "/account" },
      { name: "All Plans", icon: faIdCard, path: "/member/allplans" },
    ],
  };

  // Default to ADMIN if no role is found
  let userMenus = userRole ? (allMenus[userRole] || []) : (allMenus.ADMIN || []);

  // Filter out QR Check-in menu for Starter (₹999) plan users
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const uObj = JSON.parse(userStr);
      const userPlan = (uObj?.planName || '').toLowerCase();
      if (userPlan.includes('starter') || userPlan === '999') {
        userMenus = userMenus.filter(m => m.name !== 'QR Check-in');
      }
    }
  } catch (e) {}

  // Add a loading state or fallback if userRole is still null
  if (!userRole) {
    return <div className="sidebar-container">
      <div className="sidebar">
        <div className="p-3 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>;
  }

  const getMenuLabel = (name) => {
    if (!name) return "";
    const key = name.trim();
    const map = {
      "Dashboard": t("nav.dashboard", "Dashboard"),
      "Leads / Inquiries": t("nav.leads", "Leads / Inquiries"),
      "Members": t("nav.members", "Members"),
      "Manage Members": t("nav.manageMembers", "Manage Members"),
      "At-Risk Members": t("nav.atRiskMembers", "At-Risk Members"),
      "Walk-In Member": t("nav.walkIn", "Walk-In Member"),
      "QR Code Attendance": t("nav.qrAttendance", "QR Code Attendance"),
      "QR Check-in": t("nav.qrCheckin", "QR Check-in"),
      "Memberships": t("nav.memberships", "Memberships"),
      "Create Plan": t("nav.createPlan", "Create Plan"),
      "Staff": t("nav.staffManagement", "Staff Management"),
      "Staff Management": t("nav.staffManagement", "Staff Management"),
      "Manage Staff": t("nav.manageStaff", "Manage Staff"),
      "Roles & Permissions": t("nav.rolesPermissions", "Roles & Permissions"),
      "Staff Attendance": t("nav.staffAttendance", "Staff Attendance"),
      "Attendance": t("nav.attendance", "Attendance"),
      "Duty Roster": t("nav.dutyRoster", "Duty Roster"),
      "Salary Calculator": t("nav.salaryCalculator", "Salary Calculator"),
      "Trainers": t("nav.trainers", "Trainers"),
      "General Trainers": t("nav.generalTrainers", "General Trainers"),
      "Personal Trainers": t("nav.personalTrainers", "Personal Trainers"),
      "Marketing": t("nav.marketing", "Marketing"),
      "Campaigns": t("nav.campaigns", "Campaigns"),
      "Emails & SMS": t("nav.emailsSms", "Emails & SMS"),
      "Classes & Schedules": t("nav.classes", "Classes & Schedules"),
      "Classes & Sessions": t("nav.classes", "Classes & Schedules"),
      "Class Schedule": t("nav.classSchedule", "Class Schedule"),
      "Classes Schedule": t("nav.classesSchedule", "Classes Schedule"),
      "Class Timetable": t("nav.classSchedule", "Class Timetable"),
      "Member Bookings": t("nav.bookings", "Member Bookings"),
      "Membership Payments": t("nav.membershipPayments", "Membership Payments"),
      "Groups": t("nav.groups", "Groups"),
      "Bookings": t("nav.bookings", "Bookings"),
      "PT Bookings": t("nav.ptBookings", "PT Bookings"),
      "Personal Training": t("nav.personalTraining", "Personal Training"),
      "Expenses & Profit": t("nav.expenses", "Expenses & Profit"),
      "Body Builder": t("nav.bodybuilder", "Body Builder"),
      "Client Progress": t("nav.clientProgress", "Client Progress"),
      "New Assessment": t("nav.newAssessment", "New Assessment"),
      "Diet Builder": t("nav.dietBuilder", "Diet Builder"),
      "Workout Builder": t("nav.workoutBuilder", "Workout Builder"),
      "Health & BMI Log": t("nav.healthLog", "Health & BMI Log"),
      "Session Bookings": t("nav.sessionBookings", "Session Bookings"),
      "Daily Attendance": t("nav.dailyAttendance", "Daily Attendance"),
      "Renewals & Follow-ups": t("nav.renewalsFollowups", "Renewals & Follow-ups"),
      "Inventory & Requests": t("nav.inventoryRequests", "Inventory & Requests"),
      "Equipment & Inventory": t("nav.inventory", "Equipment & Inventory"),
      "Shift Management": t("nav.shiftManagement", "Shift Management"),
      "Task Management": t("nav.tasks", "Task Management"),
      "My Tasks": t("nav.myTasks", "My Tasks"),
      "Announcements": t("nav.announcements", "Announcements"),
      "Leaderboard": t("nav.leaderboard", "Leaderboard"),
      "Inventory": t("nav.inventory", "Inventory"),
      "Reports": t("nav.reports", "Reports"),
      "Sales Report": t("reports.salesReport", "Sales Report"),
      "Sales & Revenue Report": t("reports.salesReport", "Sales & Revenue Report"),
      "Attendance Report": t("reports.attendanceReport", "Attendance Report"),
      "Attendance Logs Report": t("reports.attendanceReport", "Attendance Logs Report"),
      "Settings": t("nav.settings", "Settings"),
      "Setting": t("nav.settings", "Setting"),
      "Audit Logs": t("nav.auditLogs", "Audit Logs"),
      "System Backups": t("nav.systemBackups", "System Backups"),
      "WhatsApp Integration": t("nav.whatsappIntegration", "WhatsApp Integration"),
      "My Subscription": t("nav.subscription", "My Subscription"),
      "How To Use": t("nav.howToUse", "How To Use"),
      "Help Desk": t("nav.helpDesk", "Help Desk"),
      "Support": t("nav.helpDesk", "Help Desk"),
      "Support Tickets": t("nav.helpDesk", "Help Desk"),
      "Notification Credits": t("nav.credits", "Notification Credits"),
      "Admins": t("nav.manageSubAdmins", "Admins"),
      "Gym Owners": t("nav.gymOwners", "Gym Owners"),
      "Payments": t("nav.saasPayments", "Payments"),
      "SaaS Payments": t("nav.saasPayments", "SaaS Payments"),
      "Branches": t("nav.branches", "Branches"),
      "Request Plan": t("nav.requestPlan", "Request Plan"),
      "Plans & Pricing": t("nav.plansPricing", "Plans & Pricing"),
      "Message Templates": t("nav.messageTemplates", "Message Templates"),
      "My Diet Plan": t("nav.myDietPlan", "My Diet Plan"),
      "My Workouts": t("nav.myWorkouts", "My Workouts"),
      "My Health Log": t("nav.myHealthLog", "My Health Log"),
      "My Plan": t("nav.myPlan", "My Plan"),
      "My Account": t("nav.myAccount", "My Account"),
      "All Plans": t("nav.allPlans", "All Plans"),
      "New Registrations": t("nav.newRegistrations", "New Registrations"),
      "Payments & Member Attendence": t("nav.paymentsAttendance", "Payments & Member Attendance"),
      "Payments &  Member Attendence": t("nav.paymentsAttendance", "Payments & Member Attendance"),
      "Member Attendance Report": t("reports.attendanceReport", "Member Attendance Report"),
      "Reception Dashboard": t("nav.receptionDashboard", "Reception Dashboard"),
      "Sales Dashboard": t("nav.salesDashboard", "Sales Dashboard"),
    };
    const trimmedKey = (key || '').trim();
    return map[key] || map[trimmedKey] || t(`nav.${trimmedKey.toLowerCase().replace(/[^a-z0-9]/g, '')}`, trimmedKey);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {!collapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setCollapsed(true)}
        />
      )}
      <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar d-flex flex-column justify-content-between">

          <ul className="menu flex-grow-1">
            {userMenus.map((menu, index) => {
              if (menu.isDivider) {
                return (
                  <li key={`div-${index}`} className="sidebar-divider my-2" />
                );
              }

              if (!menu.subItems) {
                return (
                  <li key={index} className="menu-item">
                    <div
                      className={`menu-link ${isActive(menu.path) ? "active" : ""} ${menu.isHighlighted ? "how-to-use-link" : ""}`}
                      onClick={() => handleNavigate(menu.path)}
                    >
                      <FontAwesomeIcon icon={menu.icon} className={`menu-icon ${menu.isHighlighted ? "how-to-use-icon" : ""}`} />
                      {!collapsed && (
                        <span className="menu-text fw-semibold d-flex align-items-center justify-content-between w-100">
                          {getMenuLabel(menu.name)}
                          {menu.isHighlighted && (
                            <span className="badge bg-warning text-dark px-1.5 py-0.5 rounded-pill ms-2" style={{ fontSize: "10px" }}>
                              Guide
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </li>
                );
              }

              return (
                <li key={index} className="menu-item">
                  <div
                    className="menu-link mb-2"
                    onClick={() => toggleMenu(menu.key)}
                  >
                    <FontAwesomeIcon icon={menu.icon} className="menu-icon" />
                    {!collapsed && <span className="menu-text">{getMenuLabel(menu.name)}</span>}
                    {!collapsed && (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`arrow-icon ${activeMenu === menu.key ? "rotate" : ""}`}
                      />
                    )}
                  </div>

                  {!collapsed && activeMenu === menu.key && (
                    <ul className="submenu">
                      {menu.subItems.map((sub, i) => (
                        <li
                          key={i}
                          className={`submenu-item mb-2 ${isActive(sub.path) ? "active-sub" : ""}`}
                          onClick={() => handleNavigate(sub.path)}
                        >
                          {getMenuLabel(sub.label)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
