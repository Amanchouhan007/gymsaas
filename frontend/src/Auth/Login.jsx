
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../Api/axiosInstance";
import loginGymBg from "../assets/hero_attractive_gym.jpg";
import LanguageSelector from "../Components/LanguageSelector";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleRedirectMap = {
    SUPERADMIN: "/superadmin/dashboard",
    SUBADMIN: "/superadmin/dashboard",
    ADMIN: "/admin/admin-dashboard",
    MANAGER: "/manager/dashboard",
    GENERALTRAINER: "/generaltrainer/dashboard",
    GENERAL_TRAINER: "/generaltrainer/dashboard",
    TRAINER: "/generaltrainer/dashboard",
    PERSONALTRAINER: "/personaltrainer/dashboard",
    PERSONAL_TRAINER: "/personaltrainer/dashboard",
    MEMBER: "/member/dashboard",
    RECEPTIONIST: "/receptionist/dashboard",
    SALES_AGENT: "/sales/dashboard",
    SALESAGENT: "/sales/dashboard",
    HOUSEKEEPING: "/housekeeping/dashboard",
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    if (token && role) {
      const normalizedRole = role.toUpperCase().replace(/\s+|-/g, "_").trim();
      const targetPath = roleRedirectMap[normalizedRole] || roleRedirectMap[role.toUpperCase()] || "/admin/admin-dashboard";
      navigate(targetPath, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;

      // ✅ Normalize role string to handle all variations (e.g. "sales_agent", "Sales Agent", "personaltrainer", "Personal Trainer")
      const rawRole = user.roleName || "";
      const normalizedRole = rawRole.toUpperCase().replace(/\s+|-/g, "_").trim();

      // Save auth info in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", normalizedRole);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      const redirectPath = roleRedirectMap[normalizedRole] || (roleRedirectMap[rawRole.toUpperCase()] || "/");
      navigate(redirectPath);
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
      // ❌ Removed alert — better UX to show inline error only
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="container-fluid min-vh-100 p-0 m-0 position-relative"
      style={{
        background: "linear-gradient(135deg, #180903 0%, #2e1206 50%, #120602 100%)",
        minHeight: "100dvh"
      }}
    >
      {/* Back Arrow to Home Page */}
      <button 
        onClick={() => navigate("/")} 
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          width: "40px",
          height: "40px",
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
        title="Go to Home"
      >
        <span style={{ fontSize: "18px", color: "#ffffff", fontWeight: "bold", transform: "translateY(-1px)" }}>←</span>
      </button>

      <div className="row g-0 min-vh-100 w-100 m-0" style={{ minHeight: "100dvh" }}>
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
              Streamline member management, track attendance, automated billing, and scale your fitness business effortlessly.
            </p>
          </div>
        </div>

        {/* Right Side — Full Height Form */}
        <div className="col-lg-5 col-md-6 d-flex align-items-center justify-content-center min-vh-100 px-3 px-sm-4 px-lg-5 py-5 position-relative" style={{ backgroundColor: "#180903", minHeight: "100dvh" }}>
          
          <div style={{ position: "absolute", top: "24px", right: "24px", zIndex: 10 }}>
            <LanguageSelector variant="compact" />
          </div>

          <div className="w-100" style={{ maxWidth: "440px" }}>
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2 text-white" style={{ fontSize: "2rem", letterSpacing: "-0.5px" }}>{t('auth.loginTitle')}</h2>
              <p style={{ color: "#fdba74", fontSize: "0.95rem" }}>{t('auth.loginSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger py-2 mb-3 fs-6" role="alert" style={{ borderRadius: "10px" }}> 
                  {error}
                </div> 
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold text-white mb-1" style={{ fontSize: "0.9rem" }}>{t('auth.emailLabel')}</label>
                <input
                  type="email"
                  className="form-control py-2"
                  style={{
                    borderRadius: "10px",
                    borderColor: "#ea580c",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    fontWeight: "500"
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>

              <div className="mb-3 position-relative">
                <label className="form-label fw-semibold text-white mb-1" style={{ fontSize: "0.9rem" }}>{t('auth.passwordLabel')}</label>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    placeholder="••••••••"
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

              <div className="d-flex justify-content-end mb-4">
                <Link to="/forgot-password" className="text-decoration-none fw-medium" style={{ fontSize: '0.88rem', color: '#ea580c' }}>
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                className="btn w-100 py-3 fw-bold text-white shadow"
                style={{
                  background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1.05rem",
                  transition: "all 0.2s ease-in-out"
                }}
                disabled={loading}
              >
                {loading ? t('common.loading') : t('auth.signInBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
