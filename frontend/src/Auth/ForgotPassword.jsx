import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../Api/axiosInstance";
import { toast } from "react-toastify";
import loginGymBg from "../assets/hero_attractive_gym.jpg";
import LanguageSelector from "../Components/LanguageSelector";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      if (res.data.success) {
        toast.success(res.data.message);
        setStep(2);
        setTimeLeft(180);
      } else {
        toast.error(res.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/verify-forgot-password-otp", { email, otp: otpValue });
      if (res.data.success) {
        toast.success(res.data.message);
        setResetToken(res.data.resetToken);
        setStep(3);
      } else {
        toast.error(res.data.message || "Invalid OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/resend-forgot-password-otp", { email });
      if (res.data.success) {
        toast.success(res.data.message);
        setTimeLeft(180);
        setOtp(["", "", "", "", "", ""]);
      } else {
        toast.error(res.data.message || "Failed to resend OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Please wait before resending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pass) => {
    const passRegex = /^(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passRegex.test(pass);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      toast.error("Password must be at least 8 characters, include a number and a special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/reset-password", { 
        email, 
        resetToken, 
        newPassword, 
        confirmPassword 
      });

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithOtp = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login-with-reset-token", { 
        email, 
        resetToken 
      });

      if (res.data.success) {
        toast.success("Login successful!");
        localStorage.setItem("token", res.data.token);
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          navigate(`/${res.data.user.roleName.toLowerCase()}-dashboard`);
        } else if (res.data.member) {
          localStorage.setItem("user", JSON.stringify({ ...res.data.member, roleName: "Member" }));
          navigate("/member-dashboard");
        }
        window.location.reload();
      } else {
        toast.error(res.data.message || "Failed to login with OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to login with OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="container-fluid vh-100 p-0 m-0 overflow-hidden position-relative"
      style={{
        background: "linear-gradient(135deg, #180903 0%, #2e1206 50%, #120602 100%)"
      }}
    >
      {/* Back Arrow to Login Page */}
      <button 
        onClick={() => navigate("/login")} 
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
        }}
        title="Back to Login"
      >
        <span style={{ fontSize: "20px", color: "#ffffff", fontWeight: "bold", transform: "translateY(-1px)" }}>←</span>
      </button>

      <div className="row g-0 vh-100 w-100 m-0">
        {/* Left Side — Full Screen Gym Showcase */}
        <div className="col-lg-7 col-md-6 d-none d-md-block position-relative min-vh-100 overflow-hidden" style={{ minHeight: "100dvh" }}>
          <img
            src={loginGymBg}
            alt="YOUR GYM Showcase"
            style={{ height: "100%", width: "100%", objectFit: "cover", objectPosition: "center" }} 
          />
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "linear-gradient(to right, rgba(24, 9, 3, 0.6) 0%, rgba(24, 9, 3, 0.75) 50%, rgba(24, 9, 3, 0.98) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "clamp(30px, 5vw, 60px)"
            }}
          >
            <h1 className="fw-extrabold text-white mb-3" style={{ fontSize: "clamp(2.2rem, 3.8vw, 3.2rem)", letterSpacing: "1px", lineHeight: "1.2" }}>
              YOUR <span style={{ color: "#ea580c" }}>GYM</span>
            </h1>
            <p className="text-white-50 mb-0" style={{ maxWidth: "500px", fontSize: "clamp(1rem, 1.3vw, 1.25rem)", lineHeight: "1.6" }}>
              Account security & password recovery. Streamline your gym management effortlessly.
            </p>
          </div>
        </div>

        {/* Right Side — Form */}
        <div className="col-lg-5 col-md-6 d-flex align-items-center justify-content-center vh-100 px-4 px-lg-5" style={{ backgroundColor: "#180903" }}>
          <div className="w-100" style={{ maxWidth: "440px" }}>
            <div className="text-center mb-4">
              <img
                src="/logo.png"
                alt="YOUR GYM Logo"
                style={{ height: "55px", objectFit: "contain", marginBottom: "12px" }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h2 className="fw-bold mb-2 text-white" style={{ fontSize: "1.8rem", letterSpacing: "-0.5px" }}>
                {step === 1 && "Forgot Password?"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Reset Password"}
              </h2>
              <p style={{ color: "#fdba74", fontSize: "0.95rem" }}>
                {step === 1 && "Enter your email to receive a password reset OTP"}
                {step === 2 && <>Enter the 6-digit code sent to <strong style={{ color: "#ffffff" }}>{email}</strong></>}
                {step === 3 && "Create a new secure password for your account"}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-white mb-1" style={{ fontSize: "0.9rem" }}>Email Address</label>
                  <div className="position-relative">
                    <input
                      type="email"
                      className="form-control py-2"
                      style={{
                        borderRadius: "10px",
                        borderColor: "#ea580c",
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        fontWeight: "500",
                        paddingLeft: "40px"
                      }}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "#ea580c", fontSize: "1.1rem" }}></i>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 py-3 fw-bold text-white shadow mb-3"
                  style={{
                    background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1.05rem",
                    transition: "all 0.2s ease-in-out"
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleOtpSubmit}>
                <div className="d-flex justify-content-center gap-2 mb-4">
                  {otp.map((data, index) => (
                    <input
                      className="form-control text-center"
                      type="text"
                      name="otp"
                      maxLength="1"
                      key={index}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onFocus={(e) => e.target.select()}
                      style={{
                        width: "48px",
                        height: "54px",
                        fontSize: "22px",
                        fontWeight: "bold",
                        borderRadius: "10px",
                        borderColor: "#ea580c",
                        backgroundColor: "#ffffff",
                        color: "#111827"
                      }}
                      required
                      disabled={isLoading}
                    />
                  ))}
                </div>
                
                <div className="mb-4 text-center" style={{ color: "#fdba74", fontSize: "0.95rem" }}>
                  Time remaining: <span className="fw-bold" style={{ color: "#ffffff" }}>{formatTime(timeLeft)}</span>
                </div>

                <button
                  type="submit"
                  className="btn w-100 py-3 fw-bold text-white shadow mb-3"
                  style={{
                    background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1.05rem",
                    transition: "all 0.2s ease-in-out"
                  }}
                  disabled={isLoading || timeLeft === 0}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
                
                <div className="text-center mb-3">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none p-0 fw-semibold"
                    style={{ color: "#ea580c" }}
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold text-white mb-1" style={{ fontSize: "0.9rem" }}>New Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control py-2"
                      style={{
                        borderRadius: "10px",
                        borderColor: "#ea580c",
                        backgroundColor: "#ffffff",
                        color: "#111827",
                        fontWeight: "500"
                      }}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y pe-3"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer", zIndex: 10, color: "#ea580c" }}
                    >
                      {showPassword ? (
                        <i className="bi bi-eye-slash-fill"></i>
                      ) : (
                        <i className="bi bi-eye-fill"></i>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3 text-start px-3 py-2" style={{ fontSize: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                  <div style={{ color: newPassword.length >= 8 ? '#4ade80' : '#ef4444', fontWeight: '500' }}>
                    <i className={`bi ${newPassword.length >= 8 ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> Min 8 characters
                  </div>
                  <div style={{ color: /\d/.test(newPassword) ? '#4ade80' : '#ef4444', fontWeight: '500' }}>
                    <i className={`bi ${/\d/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> 1 Number
                  </div>
                  <div style={{ color: /[\W_]/.test(newPassword) ? '#4ade80' : '#ef4444', fontWeight: '500' }}>
                    <i className={`bi ${/[\W_]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> 1 Special character
                  </div>
                </div>

                <div className="mb-4 position-relative">
                  <label className="form-label fw-semibold text-white mb-1" style={{ fontSize: "0.9rem" }}>Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control py-2"
                    style={{
                      borderRadius: "10px",
                      borderColor: "#ea580c",
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      fontWeight: "500"
                    }}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100 py-3 fw-bold text-white shadow mb-3"
                  style={{
                    background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1.05rem",
                    transition: "all 0.2s ease-in-out"
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
                
                <div className="text-center text-white-50 my-2" style={{ fontSize: "0.85rem" }}>OR</div>
                
                <button 
                  type="button" 
                  className="btn w-100 py-2 fw-semibold mb-3" 
                  style={{
                    border: "2px solid #ea580c",
                    color: "#ea580c",
                    backgroundColor: "transparent",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease-in-out"
                  }}
                  disabled={isLoading}
                  onClick={handleLoginWithOtp}
                >
                  {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
                  Login with OTP (Don't Reset Password)
                </button>
              </form>
            )}

            <div className="text-center mt-3">
              <Link to="/login" className="text-decoration-none fw-medium" style={{ fontSize: '0.9rem', color: '#ea580c' }}>
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
