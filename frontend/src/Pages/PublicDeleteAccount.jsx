import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaTrashAlt, FaArrowLeft, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import axios from "axios";

const PublicDeleteAccount = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("FORM"); // "FORM" | "OTP" | "COMPLETED"
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus({ type: "error", message: "Please enter a valid registered email address." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const cleanUrl = apiUrl.replace(/\/+$/, "");

      const res = await axios.post(`${cleanUrl}/auth/request-account-deletion`, {
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        reason: reason.trim()
      });

      if (res.data?.success) {
        setStep("OTP");
        setStatus({
          type: "success",
          message: res.data.message || "A 6-digit verification code has been sent to your email. Please enter it below."
        });
      } else {
        setStatus({
          type: "error",
          message: res.data?.message || "Failed to submit deletion request. Please try again."
        });
      }
    } catch (err) {
      console.error("Account deletion submission error:", err);
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Unable to reach server. Please try again later or contact support."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setStatus({ type: "error", message: "Please enter the 6-digit verification code sent to your email." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const cleanUrl = apiUrl.replace(/\/+$/, "");

      const res = await axios.post(`${cleanUrl}/auth/verify-account-deletion-otp`, {
        email: email.trim(),
        otp: otp.trim()
      });

      if (res.data?.success) {
        setStep("COMPLETED");
        setSubmitted(true);
        setStatus({
          type: "success",
          message: res.data.message || "Identity verified. Your account deletion request has been registered."
        });
      } else {
        setStatus({
          type: "error",
          message: res.data?.message || "Verification failed. Please check the code."
        });
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Invalid or expired verification code."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#120602", minHeight: "100vh", color: "#f8fafc", fontFamily: "Outfit, sans-serif" }}>
      {/* Header */}
      <header className="py-3 sticky-top shadow-sm" style={{ backgroundColor: "#1c0b05", borderBottom: "1px solid rgba(234, 88, 12, 0.25)" }}>
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2" style={{ color: "#fdba74" }}>
            <FaArrowLeft />
            <span className="fw-semibold small">Back to Home</span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <FaShieldAlt style={{ color: "#ea580c" }} className="fs-4" />
            <span className="fw-bold text-white fs-5">Gym Management</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div 
              className="rounded-4 p-4 p-md-5 shadow-lg"
              style={{
                backgroundColor: "#180903",
                border: "1px solid rgba(234, 88, 12, 0.3)",
                color: "#e2e8f0"
              }}
            >
              <div className="text-center mb-4">
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{ width: "64px", height: "64px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
                >
                  <FaTrashAlt size={28} />
                </div>
                <h2 className="fw-bold text-white mb-2">Request Account & Data Deletion</h2>
                <p className="text-muted small mb-0" style={{ color: "#94a3b8" }}>
                  Google Play Store Policy & Data Privacy Compliance
                </p>
              </div>

              {/* Policy Explanation Notice */}
              <div 
                className="p-3.5 rounded-3 mb-4"
                style={{
                  backgroundColor: "rgba(234, 88, 12, 0.08)",
                  border: "1px solid rgba(234, 88, 12, 0.25)",
                  fontSize: "0.9rem"
                }}
              >
                <div className="d-flex align-items-start gap-2 mb-2">
                  <FaInfoCircle className="mt-1" style={{ color: "#ea580c" }} />
                  <strong className="text-white">What data will be deleted?</strong>
                </div>
                <ul className="small mb-0 ps-3" style={{ color: "#cbd5e1" }}>
                  <li>Your user account credentials and profile information.</li>
                  <li>All gym membership records and attendance history.</li>
                  <li>Fitness logs, health assessments, and weight measurements.</li>
                  <li>In-app notification history and messaging sessions.</li>
                </ul>
                <p className="small text-muted mt-2 mb-0" style={{ color: "#94a3b8" }}>
                  *Financial invoice records may be retained for the minimum statutory period required under tax laws.
                </p>
              </div>

              {/* Google Play Active Subscription Warning */}
              <div 
                className="p-3.5 rounded-3 mb-4"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  fontSize: "0.9rem"
                }}
              >
                <div className="d-flex align-items-start gap-2">
                  <FaExclamationTriangle className="mt-1 flex-shrink-0" style={{ color: "#f59e0b" }} />
                  <div style={{ color: "#fef3c7" }}>
                    <strong className="text-white d-block mb-1">Important: Active Subscriptions Warning</strong>
                    Deleting your account will not automatically cancel your active Google Play subscription. Please manage or cancel recurring subscriptions in your{" "}
                    <a 
                      href="https://play.google.com/store/account/subscriptions" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "#f59e0b", textDecoration: "underline", fontWeight: "600" }}
                    >
                      Google Play Subscriptions settings
                    </a>.
                  </div>
                </div>
              </div>

              {status.message && (
                <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} d-flex align-items-center gap-2`}>
                  {status.type === "success" ? <FaCheckCircle size={18} /> : <FaExclamationTriangle size={18} />}
                  <span>{status.message}</span>
                </div>
              )}

              {step === "COMPLETED" || submitted ? (
                <div className="text-center py-4">
                  <div 
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: "56px", height: "56px", backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
                  >
                    <FaCheckCircle size={28} />
                  </div>
                  <h4 className="fw-bold text-white mb-3">Identity Verified & Request Registered</h4>
                  <p style={{ color: "#cbd5e1" }}>
                    Your identity has been verified for <strong className="text-white">{email}</strong>. 
                    In compliance with Google Play Store policies and global privacy regulations, your user profile, gym records, attendance, and fitness logs will be permanently purged within 30 days.
                  </p>
                  <Link to="/" className="btn mt-3 px-4 py-2" style={{ backgroundColor: "#ea580c", color: "#fff", fontWeight: "600" }}>
                    Return to Homepage
                  </Link>
                </div>
              ) : step === "OTP" ? (
                <form onSubmit={handleVerifyOtp}>
                  <div className="text-center mb-4">
                    <h5 className="fw-bold text-white mb-2">Enter Verification Code</h5>
                    <p className="small" style={{ color: "#cbd5e1" }}>
                      We sent a 6-digit confirmation code to <strong className="text-white">{email}</strong>. 
                      Please enter it below to confirm that you own this account.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-white">6-Digit Verification Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      className="form-control text-center fw-bold fs-4"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{
                        backgroundColor: "#241007",
                        borderColor: "#ea580c",
                        color: "#f8fafc",
                        letterSpacing: "8px"
                      }}
                    />
                    <small className="text-muted d-block mt-2 text-center" style={{ color: "#94a3b8" }}>
                      Code expires in 10 minutes.
                    </small>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="btn w-100 py-2.5 fw-bold mb-3"
                    style={{
                      backgroundColor: "#ef4444",
                      borderColor: "#dc2626",
                      color: "#ffffff"
                    }}
                  >
                    {loading ? "Verifying..." : "Verify & Permanently Register Deletion"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none small"
                      style={{ color: "#fdba74" }}
                      onClick={() => {
                        setStep("FORM");
                        setOtp("");
                        setStatus({ type: "", message: "" });
                      }}
                    >
                      ← Change Email or Re-enter Details
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-white">Registered Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      placeholder="e.g. yourname@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        backgroundColor: "#241007",
                        borderColor: "#7c2d12",
                        color: "#f8fafc"
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-white">Full Name (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        backgroundColor: "#241007",
                        borderColor: "#7c2d12",
                        color: "#f8fafc"
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-white">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        backgroundColor: "#241007",
                        borderColor: "#7c2d12",
                        color: "#f8fafc"
                      }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-white">Reason for Deletion (Optional)</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Let us know why you wish to delete your account..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        backgroundColor: "#241007",
                        borderColor: "#7c2d12",
                        color: "#f8fafc"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn w-100 py-2.5 fw-bold"
                    style={{
                      backgroundColor: "#ef4444",
                      borderColor: "#dc2626",
                      color: "#ffffff"
                    }}
                  >
                    {loading ? "Sending Verification Code..." : "Send Verification Code"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDeleteAccount;

