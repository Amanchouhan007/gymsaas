import { Route, Routes, useLocation, useParams, Navigate, Link, useNavigate } from "react-router-dom";
import "./App.css";
import { useState, useEffect, lazy, Suspense } from "react";

import Navbar from "./Layout/Navbar";
import Sidebar from "./Layout/Sidebar";
import ProtectedRoute, { getRoleDashboard } from "./Components/ProtectedRoute";
import ErrorBoundary from "./Components/ErrorBoundary";
import BaseUrl from "./Api/BaseUrl";
import OfflineBanner from "./Components/PWA/OfflineBanner";
import PWAUpdatePrompt from "./Components/PWA/PWAUpdatePrompt";
import InstallPrompt from "./Components/PWA/InstallPrompt";
import SplashScreen from "./Components/PWA/SplashScreen";
import { syncActivePurchasesOnResume, isAndroidNativeApp } from "./services/playBillingService";

// Lazy-loaded auth & website pages
const Login = lazy(() => import("./Auth/Login"));
const Signup = lazy(() => import("./Auth/Signup"));
const ForgotPassword = lazy(() => import("./Auth/ForgotPassword"));
const LendingPage = lazy(() => import("./Website/LendingPage"));
const PrivacyPolicy = lazy(() => import("./Website/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./Website/TermsOfService"));
const AboutUs = lazy(() => import("./Website/AboutUs"));
const PublicAttendance = lazy(() => import("./Website/PublicAttendance"));
const DynamicPage = lazy(() => import("./Layout/DynamicPage"));

// Lazy-loaded Dashboard & Module components
const AdminDashbaord = lazy(() => import("./Dashboard/Admin/AdminDashbaord"));
const MemberManagement = lazy(() => import("./Dashboard/Manager/MemberManagement"));
const StaffManagement = lazy(() => import("./Dashboard/Manager/StaffManagement"));
const ClassScheduling = lazy(() => import("./Dashboard/Manager/ClassScheduling"));
const Reports = lazy(() => import("./Dashboard/Manager/Reports"));
const Communication = lazy(() => import("./Dashboard/Manager/Communication"));
const Dashboard = lazy(() => import("./Dashboard/Manager/Dashboard"));
const Campaigns = lazy(() => import("./Dashboard/Admin/Marketing/Campaigns"));
const SuperAdminBranches = lazy(() => import("./Dashboard/Admin/SuperAdminBranches"));
const EmailsSms = lazy(() => import("./Dashboard/Admin/Marketing/EmailsSms"));
const ManageMembers = lazy(() => import("./Dashboard/Admin/Members/ManageMembers"));
const QrCodeAttendance = lazy(() => import("./Dashboard/Admin/Members/QrCodeAttendance"));
const WalkInRegistration = lazy(() => import("./Dashboard/Admin/Members/WalkInRegistration"));
const Membership = lazy(() => import("./Dashboard/Admin/Payments/Membership"));
const SalesReport = lazy(() => import("./Dashboard/Admin/Reports/SalesReport"));
const ManageStaff = lazy(() => import("./Dashboard/Admin/Staff/ManageStaff"));
const RolesPermissions = lazy(() => import("./Dashboard/Admin/Staff/RolesPermissions"));
const StaffAttendance = lazy(() => import("./Dashboard/Admin/Staff/StaffAttendance"));
const DutyRoster = lazy(() => import("./Dashboard/Admin/Staff/DutyRoster"));
const SalaryCalculator = lazy(() => import("./Dashboard/Admin/Staff/SalaryCalculator"));
const GeneralTrainerDashboard = lazy(() => import("./Dashboard/GeneralTrainer/GeneralTrainerDashboard"));
const GeneralQrCheckin = lazy(() => import("./Dashboard/GeneralTrainer/GeneralQrCheckin"));
const MemberDashboard = lazy(() => import("./Dashboard/Member/MemberDashboard"));
const Account = lazy(() => import("./Dashboard/Member/Account"));
const MemberQrCheckin = lazy(() => import("./Dashboard/Member/MemberQrCheckin"));
const ClassSchedule = lazy(() => import("./Dashboard/Member/ClassSchedule"));
const Report = lazy(() => import("./Dashboard/GeneralTrainer/Report"));
const AttendanceHistory = lazy(() => import("./Dashboard/Member/AttendanceHistory"));
const ReceptionistDashboard = lazy(() => import("./Dashboard/Receptionist/ReceptionistDashboard"));
const NewReceptionistDashboard = lazy(() => import("./Dashboard/Receptionist/NewReceptionistDashboard"));
const PersonalTrainerMessages = lazy(() => import("./Dashboard/PersonalTrainer/PersonalTrainerMessages"));
const PersonalTrainerGroupClasses = lazy(() => import("./Dashboard/PersonalTrainer/PersonalTrainerGroupClasses"));
const PersonalTrainerDashboard = lazy(() => import("./Dashboard/PersonalTrainer/PersonalTrainerDashboard"));
const PersonalTrainerQrCheckin = lazy(() => import("./Dashboard/PersonalTrainer/PersonsalTrainerQrCheckin"));
const Attendance = lazy(() => import("./Dashboard/GeneralTrainer/Attendance"));
const DailyScedule = lazy(() => import("./Dashboard/GeneralTrainer/DailyScedule"));
const ReceptionistWalkinMember = lazy(() => import("./Dashboard/Receptionist/ReceptionistWalkinMember"));
const ReceptionistMembershipSignups = lazy(() => import("./Dashboard/Receptionist/ReceptionistMembershipSignups"));
const ReceptionistQrCheckin = lazy(() => import("./Dashboard/Receptionist/ReceptionistQrCheckin"));
const ReceptionistQRCode = lazy(() => import("./Dashboard/Receptionist/ReceptionistQRCode"));
const ReceptionistPaymentCollection = lazy(() => import("./Dashboard/Receptionist/ReceptionistPaymentCollection"));
const ReceptionistBookGroupClasses = lazy(() => import("./Dashboard/Receptionist/ReceptionistBookGroupClasses"));
const BranchManagement = lazy(() => import("./Dashboard/Admin/Settings/BranchManagement"));
const RoleManagement = lazy(() => import("./Dashboard/Admin/Settings/RoleManagement"));
const SuperAdminOwner = lazy(() => import("./Dashboard/SuperAdmin/SuperAdminAdmin"));
const Plans = lazy(() => import("./Dashboard/SuperAdmin/Plans"));
const Payments = lazy(() => import("./Dashboard/SuperAdmin/Payments"));
const PaymentHistory = lazy(() => import("./Dashboard/Admin/Payments/PaymentHistory"));
const Request = lazy(() => import("./Dashboard/SuperAdmin/Requestplan"));
const ManageSubAdmins = lazy(() => import("./Dashboard/SuperAdmin/ManageSubAdmins"));
const Announcements = lazy(() => import("./Dashboard/SuperAdmin/Announcements"));
const Groups = lazy(() => import("./Dashboard/Admin/Groups"));
const ClassesSchedule = lazy(() => import("./Dashboard/Admin/ClassesSchedule"));
const AttendanceReport = lazy(() => import("./Dashboard/Admin/Reports/AttendanceReport"));
const PersonalTrainerSessionBookings = lazy(() => import("./Dashboard/Admin/Bookings/PersonalTrainerSessionBookings"));
const CreatePlan = lazy(() => import("./Dashboard/Admin/CreatePlan"));
const ViewPlan = lazy(() => import("./Dashboard/Member/ViewPlan"));
const PersonalPlansBookings = lazy(() => import("./Dashboard/PersonalTrainer/PersonalPlansBookings"));
const GroupPlansBookings = lazy(() => import("./Dashboard/GeneralTrainer/GroupPlansBookings"));
const AdminMember = lazy(() => import("./Dashboard/Admin/AdminMember"));
const AdminExpenses = lazy(() => import("./Dashboard/Admin/AdminExpenses"));
const PersonalTraining = lazy(() => import("./Dashboard/Admin/Bookings/PersonalTraining"));
const QrCheckin = lazy(() => import("./Dashboard/Admin/qrcheckin"));
const Setting = lazy(() => import("./Dashboard/SuperAdmin/Setting"));
const DashboardHomePage = lazy(() => import("./Dashboard/SuperAdmin/SuperAdminDashbaord"));
const ShiftManagement = lazy(() => import("./Dashboard/Admin/ShiftMangamenet"));
const AdminTaskManagement = lazy(() => import("./Dashboard/Admin/AdminTaskManagement"));
const PersonalAttendance = lazy(() => import("./Dashboard/PersonalTrainer/PersonalAttendance"));
const AdminSetting = lazy(() => import("./Dashboard/Admin/AdminSetting"));
const AuditLogs = lazy(() => import("./Dashboard/Admin/AuditLogs"));
const SystemBackup = lazy(() => import("./Dashboard/Admin/SystemBackup"));
const WhatsAppIntegrationPage = lazy(() => import("./Dashboard/Admin/WhatsAppIntegrationPage"));
const AdminMySubscription = lazy(() => import("./Dashboard/Admin/AdminMySubscription"));
const HowToUse = lazy(() => import("./Dashboard/Admin/HowToUse"));
const RequestPlan = lazy(() => import("./Dashboard/Member/RequestsPlan"));
const PersonalTrainerClassesSchedule = lazy(() => import("./Dashboard/PersonalTrainer/PersonalTrainerClassesSchedule"));
const GeneralClassesSchedule = lazy(() => import("./Dashboard/GeneralTrainer/GeneralClassesSchedule"));
const PersonalSessionBooking = lazy(() => import("./Dashboard/PersonalTrainer/PersonalSessionBooking"));
const GeneralSessionBooking = lazy(() => import("./Dashboard/GeneralTrainer/GeneralSessionBooking"));
const PersonsalTrainerShiftManagement = lazy(() => import("./Dashboard/PersonalTrainer/PersonsalTrainerShiftManagement"));
const GeneralTrainerShiftManagement = lazy(() => import("./Dashboard/GeneralTrainer/GeneralTrainerShiftManagement"));
const MemberAttendance = lazy(() => import("./Dashboard/Member/MemberAttendance"));
const ReportsAttendance = lazy(() => import("./Dashboard/Receptionist/ReportsAttendance"));
const ReportsClasses = lazy(() => import("./Dashboard/Receptionist/ReportsClasses"));
const PersonsalReportsClasses = lazy(() => import("./Dashboard/PersonalTrainer/PersonsalReportsClasses"));
const MemberAllPlans = lazy(() => import("./Dashboard/Member/MemberAllPlans"));
const Leads = lazy(() => import("./Dashboard/Receptionist/Leads"));
const MemberHealthLog = lazy(() => import("./Dashboard/Member/MemberHealthLog"));
const MemberLeaderboard = lazy(() => import("./Dashboard/Member/MemberLeaderboard"));
const TrainerHealthLog = lazy(() => import("./Dashboard/PersonalTrainer/TrainerHealthLog"));
const DietBuilder = lazy(() => import("./Dashboard/PersonalTrainer/DietBuilder"));
const MyDietPlan = lazy(() => import("./Dashboard/Member/MyDietPlan"));
const TrainerAssessmentForm = lazy(() => import("./Components/Assessment/TrainerAssessmentForm"));
const BodybuilderAssessmentForm = lazy(() => import("./Components/Assessment/BodybuilderAssessmentForm"));
const MemberAssessmentDashboard = lazy(() => import("./Components/Assessment/MemberAssessmentDashboard"));
const ClientAssessmentList = lazy(() => import("./Components/Assessment/ClientAssessmentList"));
const InventoryManagement = lazy(() => import("./Dashboard/Admin/Inventory/InventoryManagement"));
const AttendanceAlerts = lazy(() => import("./Dashboard/Admin/AttendanceAlerts"));
const AdminAnnouncements = lazy(() => import("./Dashboard/Admin/AdminAnnouncements"));
const WorkoutBuilder = lazy(() => import("./Dashboard/PersonalTrainer/WorkoutBuilder"));
const MemberWorkoutLog = lazy(() => import("./Dashboard/Member/MemberWorkoutLog"));
const AnnouncementsList = lazy(() => import("./Components/AnnouncementsList"));
const AutomationSettings = lazy(() => import("./Dashboard/SuperAdmin/AutomationSettings"));
const NotificationCredits = lazy(() => import("./Dashboard/Admin/NotificationCredits"));
const Notifications = lazy(() => import("./Pages/Notifications"));
const SuperAdminSupportTickets = lazy(() => import("./Dashboard/SuperAdmin/SuperAdminSupportTickets"));
const AdminSupportTickets = lazy(() => import("./Dashboard/Admin/AdminSupportTickets"));
const BookingDetailsList = lazy(() => import("./Dashboard/Admin/Bookings/BookingDetailsList"));
const HousekeepingDashboard = lazy(() => import("./Dashboard/Housekeeping/HousekeepingDashboard"));
const HousekeepingQrCheckin = lazy(() => import("./Dashboard/Housekeeping/HousekeepingQrCheckin"));
const GeneralTrainerAttendance = lazy(() => import("./Dashboard/GeneralTrainer/Attendance"));
const PublicDeleteAccount = lazy(() => import("./Pages/PublicDeleteAccount"));

// Lightweight PageLoader for instant feedback during route chunk loading
const PageLoader = () => (
  <div 
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%'
    }}
  >
    <div 
      className="spinner-border" 
      style={{ color: '#ea580c', width: '2.5rem', height: '2.5rem' }} 
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Wrapper to extract memberId from URL params
const MemberAssessmentWrapper = () => {
  const { memberId } = useParams();
  return <MemberAssessmentDashboard memberId={parseInt(memberId)} />;
};

// Wrapper for logged-in member's own assessment dashboard (dynamically resolves memberId)
const MemberSelfAssessmentWrapper = () => {
  let memberId = 1;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    memberId = user?.memberId || user?.id || 1;
  } catch (_) {}
  return <MemberAssessmentDashboard memberId={parseInt(memberId)} />;
};

const TrialCountdownBanner = () => {
  const [daysLeft, setDaysLeft] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const role = localStorage.getItem("userRole")?.toUpperCase();
    const token = localStorage.getItem("authToken");

    const fetchLatestUser = async () => {
      if (userStr && role === "ADMIN" && token) {
        const user = JSON.parse(userStr);
        try {
          const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
          const response = await fetch(`${cleanUrl}/auth/user/${user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (response.ok) {
            const result = await response.json();
            const freshUser = result.user || result.data || result;

            // Allow active trial check fallback to planName
            const isTrial = freshUser.isTrial === 1 ||
              freshUser.trialStatus === "Active" ||
              (freshUser.planName && freshUser.planName.toLowerCase().includes("trial"));

            if (isTrial) {
              const startDate = freshUser.trialStartDate ? new Date(freshUser.trialStartDate) : new Date();
              const expDate = freshUser.trialEndDate || freshUser.licenseExpiryDate;
              if (expDate) {
                const now = new Date();
                const expiry = new Date(expDate);

                let diffDays = 7;
                if (now < startDate) {
                  const totalDuration = Math.max(0, Math.round((expiry - startDate) / (1000 * 60 * 60 * 24)));
                  diffDays = totalDuration || 7;
                } else {
                  const diffTime = expiry - now;
                  diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                }

                setDaysLeft(diffDays);
                setExpiryDate(expiry);
                setShowBanner(true);

                // Show popup once per session
                const popupKey = `trial_popup_shown_${user.id}`;
                if (!sessionStorage.getItem(popupKey)) {
                  sessionStorage.setItem(popupKey, "1");
                  setShowPopup(true);
                }
                return;
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch fresh user details for countdown banner:", error);
        }
      }
      setShowBanner(false);
    };

    fetchLatestUser();

    // Listen to custom upgrade event for real-time reactivity without page reloads
    window.addEventListener("userUpgrade", fetchLatestUser);
    return () => {
      window.removeEventListener("userUpgrade", fetchLatestUser);
    };
  }, [location]);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const urgencyColor = daysLeft <= 2 ? "#dc2626" : daysLeft <= 4 ? "#c2410c" : "#ea580c";
  const urgencyBg = daysLeft <= 2
    ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
    : "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)";

  return (
    <>
      {/* ── POPUP MODAL ── */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              animation: "trialPopupIn 0.3s ease",
            }}
          >
            <style>{`
              @keyframes trialPopupIn {
                from { opacity: 0; transform: scale(0.92) translateY(16px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
              }
              .trial-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
              .trial-btn-outline:hover { background: #f9fafb !important; }
            `}</style>

            {/* Header */}
            <div
              style={{
                background: urgencyBg,
                padding: "28px 28px 24px",
                position: "relative",
                textAlign: "center",
                color: "#fff",
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowPopup(false)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                ×
              </button>

              {/* Timer circle */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "3px solid rgba(255,255,255,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <span style={{ fontSize: "28px", fontWeight: "800", lineHeight: 1 }}>{daysLeft}</span>
                <span style={{ fontSize: "11px", fontWeight: "600", opacity: 0.9 }}>
                  {daysLeft === 1 ? "DAY" : "DAYS"}
                </span>
              </div>

              <h4 style={{ margin: "0 0 6px", fontWeight: "800", fontSize: "1.2rem" }}>
                {daysLeft === 0
                  ? "⚠️ Trial Expires Today!"
                  : daysLeft <= 2
                  ? "🚨 Trial Expiring Soon!"
                  : "⏳ Free Trial Active"}
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.95, fontWeight: 500 }}>
                Your 7-Day Free Trial is currently active
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px 28px" }}>
              {/* Info rows */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Remaining Days</span>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: urgencyColor,
                      background: daysLeft <= 2 ? "#fef2f2" : "#fff7ed",
                      padding: "2px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Trial Expiry Date</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b" }}>
                    {formatDate(expiryDate)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Plan</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#ea580c" }}>7-Day Free Trial</span>
                </div>
              </div>

              {/* Warning message */}
              <p style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "20px", lineHeight: 1.6, textAlign: "center" }}>
                {daysLeft <= 2
                  ? "⚠️ Your software access will be locked once your trial expires. Upgrade now to ensure uninterrupted access to your gym data."
                  : `Upgrade your plan before your trial ends to maintain continuous access to all features.`}
              </p>

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  to="/admin/my-subscription"
                  onClick={() => setShowPopup(false)}
                  className="trial-btn-primary"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "13px 0",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.92rem",
                    color: "#fff",
                    background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                    textDecoration: "none",
                    transition: "opacity 0.2s, transform 0.2s",
                    boxShadow: "0 4px 14px rgba(234, 88, 12, 0.4)",
                  }}
                >
                  🛒 Buy Plan Now
                </Link>
                <Link
                  to="/admin/my-subscription"
                  onClick={() => setShowPopup(false)}
                  className="trial-btn-outline"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 0",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "0.88rem",
                    color: "#ea580c",
                    background: "#fff",
                    textDecoration: "none",
                    border: "1.5px solid #ea580c",
                    transition: "background 0.2s",
                  }}
                >
                  📋 View Plans
                </Link>
                <button
                  onClick={() => setShowPopup(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    padding: "6px 0 0",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY TOP BANNER ── */}
      {showBanner && !dismissed && !location.pathname.toLowerCase().includes('/my-subscription') && (
        <div
          className="d-flex align-items-center justify-content-between text-white px-3 py-2 flex-wrap w-100 fw-semibold"
          style={{
            background: urgencyBg,
            fontSize: "0.9rem",
            color: "#ffffff",
            borderRadius: "8px",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            gap: "8px",
          }}
        >
          <span style={{ flex: 1, color: "#ffffff", fontWeight: "600" }}>
            {daysLeft === 0
              ? "🚨 Your free trial expires today!"
              : `⚠️ Your 7-Day Free Trial will expire in ${daysLeft} ${daysLeft === 1 ? "day" : "days"} (${formatDate(expiryDate)}).`}
            {" "}Upgrade your subscription to maintain active access.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <Link
              to="/admin/my-subscription"
              onClick={() => setShowPopup(false)}
              style={{
                background: "#ffffff",
                color: "#ea580c",
                fontWeight: "700",
                fontSize: "0.82rem",
                padding: "6px 16px",
                borderRadius: "20px",
                textDecoration: "none",
                border: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              Buy Plan
            </Link>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss banner"
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                fontSize: "1.1rem",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
                opacity: 0.9,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};


/* ─────────────────────────────────────────
   Trial Expired Full-Screen Block
───────────────────────────────────────── */
const TrialExpiredScreen = ({ onLogout }) => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '24px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          animation: 'expiredFadeIn 0.4s ease',
        }}
      >
        <style>{`
          @keyframes expiredFadeIn {
            from { opacity:0; transform:translateY(24px); }
            to   { opacity:1; transform:translateY(0); }
          }
          .exp-btn-primary { transition: opacity 0.2s, transform 0.2s; }
          .exp-btn-primary:hover { opacity:0.9; transform:translateY(-2px); }
          .exp-btn-outline:hover { background:rgba(255,255,255,0.06) !important; }
        `}</style>

        {/* Lock Icon */}
        <div style={{
          width: '80px', height: '80px',
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)',
          border: '2px solid rgba(239,68,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '36px',
        }}>🔒</div>

        <h2 style={{ color: '#f1f5f9', fontWeight: '800', fontSize: '1.6rem', marginBottom: '8px' }}>
          Your Free Trial Has Expired
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '28px' }}>
          Your 7-day free trial has expired. Upgrade to a paid plan now to restore full access to your gym management software and data.
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px' }} />

        {/* Feature warning */}
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '28px',
          textAlign: 'left',
        }}>
          <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: 0, fontWeight: 600 }}>
            ⚠️ Access Blocked:
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.80rem', margin: '6px 0 0', lineHeight: 1.6 }}>
            Dashboard, Members, Staff, Reports, Payments and all other modules will remain restricted until an active subscription plan is purchased.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            to="/admin/my-subscription"
            className="exp-btn-primary"
            style={{
              display: 'block',
              padding: '14px 0',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#fff',
              fontWeight: '700',
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(220,38,38,0.4)',
            }}
          >
            🛒 Buy Plan Now
          </Link>

          <Link
            to="/admin/my-subscription"
            className="exp-btn-outline"
            style={{
              display: 'block',
              padding: '13px 0',
              borderRadius: '12px',
              background: 'transparent',
              color: '#94a3b8',
              fontWeight: '600',
              fontSize: '0.88rem',
              textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.12)',
              transition: 'background 0.2s',
            }}
          >
            📋 View Plans
          </Link>

          <a
            href="mailto:support@gymmanagement.com"
            className="exp-btn-outline"
            style={{
              display: 'block',
              padding: '13px 0',
              borderRadius: '12px',
              background: 'transparent',
              color: '#94a3b8',
              fontWeight: '600',
              fontSize: '0.88rem',
              textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.12)',
              transition: 'background 0.2s',
            }}
          >
            💬 Contact Support
          </a>

          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '0.82rem',
              cursor: 'pointer',
              padding: '8px 0 0',
              fontWeight: 500,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const RoleBasedRedirect = () => {
  const token = localStorage.getItem("authToken");
  const userRole = localStorage.getItem("userRole");
  if (!token) return <Navigate to="/login" replace />;
  const targetPath = getRoleDashboard(userRole);
  return <Navigate to={targetPath} replace />;
};

function App() {
  useEffect(() => {
    document.title = "YOUR GYM";
  }, []);

  // ── Android Lifecycle App Resume Sync (Google Play Purchases) ──
  useEffect(() => {
    if (!isAndroidNativeApp()) return;

    const handleResume = () => {
      if (document.visibilityState === "visible") {
        syncActivePurchasesOnResume();
      }
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    // Initial check on app startup
    syncActivePurchasesOnResume();

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, []);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen on initial app load in session
    return !sessionStorage.getItem('splash_shown');
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  useEffect(() => {
    const checkIfMobile = () => window.innerWidth <= 768;
    if (checkIfMobile()) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const location = useLocation();

  // ── Trial Expiry Guard (Admin only) ──
  useEffect(() => {
    const role = localStorage.getItem("userRole")?.toUpperCase();
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("user");

    if (role !== "ADMIN" || !token || !userStr) {
      setTrialExpired(false);
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (err) {
      setTrialExpired(false);
      return;
    }

    if (!user || !user.id || user.id === "undefined") {
      setTrialExpired(false);
      return;
    }

    const checkExpiry = async () => {
      try {
        const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
        const res = await fetch(`${cleanUrl}/auth/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const result = await res.json();
        const freshUser = result.user || result.data || result;

        const isTrial = freshUser.isTrial === 1 ||
          freshUser.trialStatus === 'Active' || freshUser.trialStatus === 'Expired' ||
          (freshUser.planName && freshUser.planName.toLowerCase().includes('trial'));

        if (!isTrial) { setTrialExpired(false); return; }

        const expDate = freshUser.trialEndDate || freshUser.licenseExpiryDate;
        if (!expDate) { setTrialExpired(false); return; }

        const now = new Date();
        const expiry = new Date(expDate);
        const expired = now > expiry;
        const statusExpired = freshUser.trialStatus === 'Expired' || freshUser.status === 'Inactive';
        setTrialExpired(expired || statusExpired);
      } catch (e) {
        console.error('Trial expiry check failed:', e);
      }
    };

    checkExpiry();
    const resetOnUpgrade = () => setTrialExpired(false);
    window.addEventListener('userUpgrade', resetOnUpgrade);
    return () => window.removeEventListener('userUpgrade', resetOnUpgrade);
  }, [location]);

  const handleExpiredLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const isDynamicPage =
    /^\/[^\/]+\/\d+$/.test(location.pathname) ||  // /gym/90
    /^\/\d+$/.test(location.pathname);             // /90

  const hideLayout =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/about-us" ||
    location.pathname === "/privacy-policy" ||
    location.pathname === "/privacy" ||
    location.pathname === "/terms-of-service" ||
    location.pathname === "/terms-and-conditions" ||
    location.pathname === "/terms" ||
    location.pathname.startsWith("/public-attendance") ||
    isDynamicPage;

  // Routes allowed even when trial is expired
  const isAllowedWhenExpired =
    location.pathname === '/admin/my-subscription' ||
    location.pathname === '/admin/support' ||
    location.pathname === '/login' ||
    location.pathname === '/forgot-password';

  return (
    <Suspense fallback={<PageLoader />}>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <OfflineBanner />
      <PWAUpdatePrompt />
      <InstallPrompt />
      {hideLayout ? (
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<LendingPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/terms-and-conditions" element={<TermsOfService />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/delete-account" element={<PublicDeleteAccount />} />
            <Route path="/account-deletion" element={<PublicDeleteAccount />} />
            <Route path="/public-attendance" element={<PublicAttendance />} />
            <Route path="/:slug/:adminId" element={<DynamicPage />} />
            <Route path="/:adminId" element={<DynamicPage />} />
          </Routes>
        </ErrorBoundary>
      ) : (
        <>
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="main-content">
            <Sidebar
              collapsed={isSidebarCollapsed}
              setCollapsed={setIsSidebarCollapsed}
            />
            <div
              className={`right-side-content ${isSidebarCollapsed ? "collapsed" : ""
                }`}
            >
              {/* ── Trial Expired Full-Screen Block ── */}
              {trialExpired && !isAllowedWhenExpired ? (
                <TrialExpiredScreen onLogout={handleExpiredLogout} />
              ) : (
                <>
              <TrialCountdownBanner />
              <ErrorBoundary>
                <Routes>

                  <Route path="/superadmin/dashboard" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><DashboardHomePage /></ProtectedRoute>} />
                  <Route path="/superadmin/Admin" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><SuperAdminOwner /></ProtectedRoute>} />
                  <Route path="/superadmin/Plans&Pricing" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><Plans /></ProtectedRoute>} />
                  <Route path="superadmin/payments" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><Payments /></ProtectedRoute>} />
                  <Route path="/superadmin/setting" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><Setting /></ProtectedRoute>} />
                  <Route path="/superadmin/request-plan" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><Request /></ProtectedRoute>} />
                  <Route path="/superadmin/subadmins" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><ManageSubAdmins /></ProtectedRoute>} />
                  <Route path="/superadmin/announcements" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><Announcements /></ProtectedRoute>} />
                  <Route path="/superadmin/automation-settings" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><AutomationSettings /></ProtectedRoute>} />
                  <Route path="/superadmin/support" element={<ProtectedRoute allowedRoles={["SUPERADMIN", "SUBADMIN"]}><SuperAdminSupportTickets /></ProtectedRoute>} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminDashbaord /></ProtectedRoute>} />
                  <Route path="/admin/admindashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminDashbaord /></ProtectedRoute>} />
                  <Route path="/admin/notification-credits" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><NotificationCredits /></ProtectedRoute>} />
                  <Route path="/admin/group" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><Groups /></ProtectedRoute>} />
                  <Route path="/admin/CreatePlan" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><CreatePlan /></ProtectedRoute>} />
                  <Route path="/admin/createplan" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><CreatePlan /></ProtectedRoute>} />

                  {/* admin dahsboard */}
                  <Route path="/admin/admin-dashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminDashbaord /></ProtectedRoute>} />
                  <Route path="/admin/admin dashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminDashbaord /></ProtectedRoute>} />
                  <Route path="/admin/admin%20dashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminDashbaord /></ProtectedRoute>} />
                  <Route path="/admin/admin_dashboard" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminDashbaord /></ProtectedRoute>} />
                  <Route path="/admin/qrcheckin" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><QrCheckin /></ProtectedRoute>} />
                  <Route path="/admin/AdminMember" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "GENERALTRAINER", "PERSONALTRAINER", "SALES_AGENT"]}><AdminMember /></ProtectedRoute>} />
                  <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminExpenses /></ProtectedRoute>} />
                  <Route path="/admin/member-assessment/:memberId" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><MemberAssessmentWrapper /></ProtectedRoute>} />

                  {/* booking */}
                  <Route path="/admin/booking/attendance" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AttendanceReport /></ProtectedRoute>} />
                  <Route path="/admin/booking/personal-training" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><PersonalTraining /></ProtectedRoute>} />
                  <Route path="/admin/AdminBranches" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "SUBADMIN"]}><SuperAdminBranches /></ProtectedRoute>} />
                  <Route path="/admin/booking-details" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><BookingDetailsList /></ProtectedRoute>} />
                  <Route path="/admin/ClassesSchedule" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><ClassesSchedule /></ProtectedRoute>} />
                  <Route path="/admin/classesSchedule" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><ClassesSchedule /></ProtectedRoute>} />
                  <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><PersonalTrainerSessionBookings /></ProtectedRoute>} />

                  {/* Marketibg */}
                  <Route path="/marketing/campaigns" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><Campaigns /></ProtectedRoute>} />
                  <Route path="/marketing/email-sms" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><EmailsSms /></ProtectedRoute>} />

                  {/* Members */}
                  <Route path="/admin/members/manage-members" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><ManageMembers /></ProtectedRoute>} />
                  <Route path="/admin/members/qr-code-attendance" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "RECEPTIONIST"]}><QrCodeAttendance /></ProtectedRoute>} />
                  <Route path="/admin/members/walk-in-registration" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "RECEPTIONIST"]}><WalkInRegistration /></ProtectedRoute>} />

                  {/* Payments Routes */}
                  <Route path="/admin/payments/membership" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><Membership /></ProtectedRoute>} />

                  {/* Reports  */}
                  <Route path="/admin/reports/sales" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "MANAGER"]}><SalesReport /></ProtectedRoute>} />
                  <Route path="/admin/reports/AttendanceReport" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "MANAGER"]}><AttendanceReport /></ProtectedRoute>} />

                  {/* Staff Routes */}
                  <Route path="/admin/staff/manage-staff" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><ManageStaff /></ProtectedRoute>} />
                  <Route path="/admin/staff/roles-permissions" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><RolesPermissions /></ProtectedRoute>} />
                  <Route path="/admin/staff/attendance" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><StaffAttendance /></ProtectedRoute>} />
                  <Route path="/admin/staff/duty-roster" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><DutyRoster /></ProtectedRoute>} />
                  <Route path="/staff/salary-calculator" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "RECEPTIONIST"]}><SalaryCalculator /></ProtectedRoute>} />
                  <Route path="/admin/shift-managment" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><ShiftManagement /></ProtectedRoute>} />
                  <Route path="/admin/task-managment" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminTaskManagement /></ProtectedRoute>} />
                  <Route path="/admin/task-management" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminTaskManagement /></ProtectedRoute>} />
                  <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "MANAGER", "GENERALTRAINER", "PERSONALTRAINER", "SALES_AGENT"]}><InventoryManagement /></ProtectedRoute>} />
                  <Route path="/admin/at-risk-members" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "MANAGER", "SALES_AGENT"]}><AttendanceAlerts /></ProtectedRoute>} />
                  <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "MANAGER"]}><AdminAnnouncements /></ProtectedRoute>} />
                  <Route path="/admin/settings/backup-restore" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminSetting /></ProtectedRoute>} />
                  <Route path="/admin/settings/BranchManagement" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><BranchManagement /></ProtectedRoute>} />
                  <Route path="/admin/settings/RoleManagement" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><RoleManagement /></ProtectedRoute>} />
                  <Route path="/admin/my-subscription" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminMySubscription /></ProtectedRoute>} />
                  <Route path="/admin/payment-history" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><PaymentHistory /></ProtectedRoute>} />
                  <Route path="/admin/support" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "RECEPTIONIST", "RECEPTION", "MANAGER", "STAFF", "SALES_AGENT", "PERSONALTRAINER", "GENERALTRAINER", "HOUSEKEEPING", "housekeeping"]}><AdminSupportTickets /></ProtectedRoute>} />
                  <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AuditLogs /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><AdminSetting /></ProtectedRoute>} />
                  <Route path="/admin/system-backups" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "SUBADMIN"]}><SystemBackup /></ProtectedRoute>} />
                  <Route path="/admin/whatsapp-integration" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}><WhatsAppIntegrationPage /></ProtectedRoute>} />
                  <Route path="/superadmin/backups" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SystemBackup /></ProtectedRoute>} />
                  <Route path="/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/admin/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/superadmin/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/receptionist/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/sales/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/personaltrainer/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/generaltrainer/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/manager/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/housekeeping/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />
                  <Route path="/member/how-to-use" element={<ProtectedRoute><HowToUse /></ProtectedRoute>} />

                  {/* admin dahsboard end */}

                  {/* Manager Dashbaord */}
                  <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "SUPERADMIN"]}><Dashboard /></ProtectedRoute>} />
                  <Route path="/manager/members" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "SUPERADMIN"]}><MemberManagement /></ProtectedRoute>} />
                  {/* <Route path="/manager/membership-plan" element={<MembershipPlans />} /> */}
                  <Route path="/manager/duty-roster" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "SUPERADMIN"]}><StaffManagement /></ProtectedRoute>} />
                  <Route path="/manager/class-schedule" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "SUPERADMIN"]}><ClassScheduling /></ProtectedRoute>} />
                  <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "SUPERADMIN"]}><Reports /></ProtectedRoute>} />
                  <Route path="/manager/communication" element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "SUPERADMIN"]}><Communication /></ProtectedRoute>} />

                  {/* Member Dashboard */}

                  <Route path="/member/dashboard" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberDashboard /></ProtectedRoute>} />
                  <Route path="/member/assessment-dashboard" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberSelfAssessmentWrapper /></ProtectedRoute>} />
                  <Route path="/member/health-log" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberHealthLog /></ProtectedRoute>} />
                  <Route path="/member/leaderboard" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberLeaderboard /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN", "SUPERADMIN", "PERSONALTRAINER", "GENERALTRAINER", "MANAGER"]}><MemberLeaderboard /></ProtectedRoute>} />
                  <Route path="/member/my-diet" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MyDietPlan /></ProtectedRoute>} />
                  <Route path="/member/my-workouts" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberWorkoutLog /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path="/member/classschedule" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><ClassSchedule /></ProtectedRoute>} />
                  <Route path="/member/attendance-history" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><AttendanceHistory /></ProtectedRoute>} />
                  <Route path="/member/qrcheckin" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberQrCheckin /></ProtectedRoute>} />
                  <Route path="/member/memberattendance" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberAttendance /></ProtectedRoute>} />
                  <Route path="/member/viewplan" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><ViewPlan /></ProtectedRoute>} />
                  <Route path="/member/requestplan" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><RequestPlan /></ProtectedRoute>} />
                  <Route path="/member/allplans" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><MemberAllPlans /></ProtectedRoute>} />
                  <Route path="/member/announcements" element={<ProtectedRoute allowedRoles={["MEMBER", "ADMIN"]}><AnnouncementsList roleGroup="MEMBERS" /></ProtectedRoute>} />
                  {/* <Route path="/member/memberbooking" element={<MemberBooking />} /> */}
                  {/* ── Receptionist Routes (/receptionist/*) ── */}
                  <Route path="/receptionist/dashboard" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><NewReceptionistDashboard /></ProtectedRoute>} />
                  <Route path="/receptionist/walk-in-registration" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ReceptionistWalkinMember /></ProtectedRoute>} />
                  <Route path="/receptionist/leads" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><Leads /></ProtectedRoute>} />
                  <Route path="/receptionist/members" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><AdminMember /></ProtectedRoute>} />
                  <Route path="/receptionist/at-risk-members" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><AttendanceAlerts /></ProtectedRoute>} />
                  <Route path="/receptionist/classes-schedule" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ClassesSchedule /></ProtectedRoute>} />
                  <Route path="/receptionist/session-bookings" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ReceptionistBookGroupClasses /></ProtectedRoute>} />
                  <Route path="/receptionist/qrcheckin" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ReceptionistQrCheckin /></ProtectedRoute>} />
                  <Route path="/receptionist/qr-attendance" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ReceptionistQRCode /></ProtectedRoute>} />
                  <Route path="/receptionist/payment" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ReceptionistPaymentCollection /></ProtectedRoute>} />
                  <Route path="/receptionist/renewals" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><ReportsAttendance /></ProtectedRoute>} />
                  <Route path="/receptionist/inventory" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><InventoryManagement /></ProtectedRoute>} />
                  <Route path="/receptionist/task-management" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><AdminTaskManagement /></ProtectedRoute>} />
                  <Route path="/receptionist/announcements" element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]}><AnnouncementsList roleGroup="STAFF" /></ProtectedRoute>} />

                  {/* ── Sales Agent Routes (/sales/*) ── */}
                  <Route path="/sales/dashboard" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistDashboard /></ProtectedRoute>} />
                  <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "SUBADMIN"]}><Leads /></ProtectedRoute>} />
                  <Route path="/sales/leads" element={<ProtectedRoute allowedRoles={["SALES_AGENT"]}><Leads /></ProtectedRoute>} />
                  <Route path="/sales/walk-in-registration" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistWalkinMember /></ProtectedRoute>} />
                  <Route path="/sales/new-sign-ups" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistMembershipSignups /></ProtectedRoute>} />
                  <Route path="/sales/qr-attendance" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistQRCode /></ProtectedRoute>} />
                  <Route path="/sales/qrcheckin" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistQrCheckin /></ProtectedRoute>} />
                  <Route path="/sales/book-classes-sessions" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistBookGroupClasses /></ProtectedRoute>} />
                  <Route path="/sales/payment" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReceptionistPaymentCollection /></ProtectedRoute>} />
                  <Route path="/sales/payemnet" element={<Navigate to="/sales/payment" replace />} />
                  <Route path="/sales/reportattendance" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReportsAttendance /></ProtectedRoute>} />
                  <Route path="/sales/report" element={<ProtectedRoute allowedRoles={["SALES_AGENT", "ADMIN", "SUPERADMIN"]}><ReportsClasses /></ProtectedRoute>} />
                  <Route path="/sales/task-management" element={<ProtectedRoute allowedRoles={["SALES_AGENT"]}><AdminTaskManagement /></ProtectedRoute>} />

                  <Route path="/personaltrainer/dashboard" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalTrainerDashboard /></ProtectedRoute>} />
                  <Route path="/personaltrainer/assessment-form" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN", "GENERALTRAINER"]}><TrainerAssessmentForm /></ProtectedRoute>} />
                  <Route path="/bodybuilder-assessment" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN", "GENERALTRAINER"]}><BodybuilderAssessmentForm /></ProtectedRoute>} />
                  <Route path="/personaltrainer/client-progress" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN", "GENERALTRAINER"]}><ClientAssessmentList /></ProtectedRoute>} />
                  <Route path="/personaltrainer/member-assessment/:memberId" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN", "GENERALTRAINER"]}><MemberAssessmentWrapper /></ProtectedRoute>} />
                  <Route path="/personaltrainer/health-log" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><TrainerHealthLog /></ProtectedRoute>} />
                  <Route path="/personaltrainer/diet-builder" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><DietBuilder /></ProtectedRoute>} />
                  <Route path="/personaltrainer/workout-builder" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><WorkoutBuilder /></ProtectedRoute>} />
                  <Route path="/personaltrainer/classesschedule" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalTrainerClassesSchedule /></ProtectedRoute>} />
                  <Route path="/personaltrainer/booking-details" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><BookingDetailsList /></ProtectedRoute>} />
                  <Route path="/personaltrainer/messages" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalTrainerMessages /></ProtectedRoute>} />
                  <Route path="/personaltrainer/group-classes" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalTrainerGroupClasses /></ProtectedRoute>} />
                  <Route path="/personaltrainer/bookings" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalSessionBooking /></ProtectedRoute>} />
                  <Route path="/personaltrainer/qrcheckin" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalTrainerQrCheckin /></ProtectedRoute>} />
                  <Route path="/personaltrainer/personalattendance" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalAttendance /></ProtectedRoute>} />
                  <Route path="/personaltrainer/personalplansbookings" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalPlansBookings /></ProtectedRoute>} />
                  <Route path="/personaltrainer/PersonalPlansBookings" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonalPlansBookings /></ProtectedRoute>} />
                  <Route path="/personaltrainer/shift-managment" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonsalTrainerShiftManagement /></ProtectedRoute>} />
                  <Route path="/personaltrainer/report" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER", "ADMIN", "SUPERADMIN"]}><PersonsalReportsClasses /></ProtectedRoute>} />
                  <Route path="/personaltrainer/task-management" element={<ProtectedRoute allowedRoles={["PERSONALTRAINER"]}><AdminTaskManagement /></ProtectedRoute>} />

                  {/* ── General Trainer Routes (/generaltrainer/*) ── */}
                  <Route path="/generaltrainer/dashboard" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><GeneralTrainerDashboard /></ProtectedRoute>} />
                  <Route path="/generaltrainer/diet-builder" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><DietBuilder /></ProtectedRoute>} />
                  <Route path="/generaltrainer/workout-builder" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><WorkoutBuilder /></ProtectedRoute>} />
                  <Route path="/generaltrainer/health-log" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><TrainerHealthLog /></ProtectedRoute>} />
                  <Route path="/generaltrainer/classesschedule" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><GeneralClassesSchedule /></ProtectedRoute>} />
                  <Route path="/generaltrainer/shift-managment" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><GeneralTrainerShiftManagement /></ProtectedRoute>} />
                  <Route path="/GeneralTrainer/shift-managment" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><GeneralTrainerShiftManagement /></ProtectedRoute>} />
                  <Route path="/generaltrainer/attendance" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><GeneralTrainerAttendance /></ProtectedRoute>} />
                  <Route path="/generaltrainer/qrcheckin" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "ADMIN", "SUPERADMIN"]}><GeneralQrCheckin /></ProtectedRoute>} />
                  <Route path="/generaltrainer/task-management" element={<ProtectedRoute allowedRoles={["GENERALTRAINER"]}><AdminTaskManagement /></ProtectedRoute>} />

                  {/* ── Housekeeping Routes (/housekeeping/*) ── */}
                  <Route path="/housekeeping/dashboard" element={<ProtectedRoute allowedRoles={["HOUSEKEEPING", "ADMIN", "SUPERADMIN", "MANAGER"]}><HousekeepingDashboard /></ProtectedRoute>} />
                  <Route path="/housekeeping/tasks" element={<ProtectedRoute allowedRoles={["HOUSEKEEPING", "ADMIN", "SUPERADMIN", "MANAGER"]}><HousekeepingDashboard /></ProtectedRoute>} />
                  <Route path="/housekeeping/qrcheckin" element={<ProtectedRoute allowedRoles={["HOUSEKEEPING", "ADMIN", "SUPERADMIN", "MANAGER"]}><HousekeepingQrCheckin /></ProtectedRoute>} />
                  <Route path="/housekeeping/announcements" element={<ProtectedRoute allowedRoles={["HOUSEKEEPING", "ADMIN", "SUPERADMIN", "MANAGER"]}><AnnouncementsList roleGroup="STAFF" /></ProtectedRoute>} />

                  {/* Staff Announcements */}
                  <Route path="/staff/announcements" element={<ProtectedRoute allowedRoles={["GENERALTRAINER", "PERSONALTRAINER", "RECEPTIONIST", "MANAGER", "ADMIN", "HOUSEKEEPING"]}><AnnouncementsList roleGroup="STAFF" /></ProtectedRoute>} />

                  {/* Public Test Routes for Assessment Validation */}
                  <Route path="/test-assessment-form" element={<TrainerAssessmentForm />} />
                  <Route path="/test-assessment-dashboard" element={<MemberAssessmentDashboard memberId={146} />} />

                  {/* Global Notifications Page */}
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                  {/* Fallback Catch-all Route to prevent blank screen */}
                  <Route path="*" element={<RoleBasedRedirect />} />
                </Routes>
              </ErrorBoundary>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Suspense>
  );
}

export default App;
