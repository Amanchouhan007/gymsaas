import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("7-Day Free Trial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    setIsLoading(true);
    setPasswordMismatch(false);
    setErrorMessage("");

    try {
      const emailPrefix = (email || '').split('@')[0] || 'Member';
      const derivedName = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) || 'Gym Owner';

      const payload = {
        fullName: derivedName,
        email: email.trim(),
        phone: "9999999999",
        gymName: `${derivedName}'s Gym`,
        password,
        roleId: 2,
        planName: selectedPlan || "7-Day Free Trial",
        selectedPlan: selectedPlan || "7-Day Free Trial"
      };

      // 1. Register User
      const regRes = await axiosInstance.post("/auth/register", payload);

      if (regRes.data?.success) {
        // 2. Auto Login to get Token
        try {
          const loginRes = await axiosInstance.post("/auth/login", { email: email.trim(), password });
          if (loginRes.data?.token) {
            localStorage.setItem("authToken", loginRes.data.token);
            localStorage.setItem("userRole", "ADMIN");
            localStorage.setItem("user", JSON.stringify(loginRes.data.user));
            localStorage.setItem("isAuthenticated", "true");
            navigate("/admin/admin-dashboard");
            return;
          }
        } catch (lErr) {
          // If auto login fails, redirect to login page
          navigate("/login");
          return;
        }
      } else {
        setErrorMessage(regRes.data?.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      setErrorMessage(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light p-2 p-sm-4" style={{ minHeight: "100dvh" }}>
      <div
        className="card shadow-lg w-100"
        style={{ maxWidth: "1000px", borderRadius: "1.5rem" }}
      >
        <div className="row g-0">
          {/* Left Form Section */}
          <div className="col-12 col-md-6 p-3 p-sm-4 p-md-5 text-center">
            <div className="d-flex justify-content-center align-items-center mb-4">
              <img
                src="https://i.postimg.cc/mZHz3k1Q/Whats-App-Image-2025-07-23-at-12-38-03-add5b5dd-removebg-preview-1.png"
                alt="logo"
                className="navbar-logo m-2"
                style={{ height: "50px" }}
              />
          
            </div>

            <h2 className="h5 text-secondary mt-3">Create an Account</h2>
            <p className="text-muted mb-4">Start your 7-Day Free Trial</p>

            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-3" role="alert">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignup}>
              {/* 1. Selected Plan */}
              <div className="mb-3 position-relative text-start">
                <label className="form-label small text-secondary fw-semibold mb-1">Selected Plan</label>
                <div className="position-relative">
                  <i className="bi bi-tag position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type="text"
                    className="form-control ps-5 bg-light"
                    value={selectedPlan}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* 2. Email Address */}
              <div className="mb-3 position-relative text-start">
                <label className="form-label small text-secondary fw-semibold mb-1">Email Address *</label>
                <div className="position-relative">
                  <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type="email"
                    className="form-control ps-5"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 3. Password */}
              <div className="mb-3 position-relative text-start">
                <label className="form-label small text-secondary fw-semibold mb-1">Password *</label>
                <div className="position-relative">
                  <i className="bi bi-lock position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control ps-5 pe-5"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} position-absolute top-50 end-0 translate-middle-y me-3 text-secondary cursor-pointer`}
                    role="button"
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>
              </div>

              {/* 4. Confirm Password */}
              <div className="mb-3 position-relative text-start">
                <label className="form-label small text-secondary fw-semibold mb-1">Confirm Password *</label>
                <div className="position-relative">
                  <i className="bi bi-shield-lock position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control ps-5 pe-5"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <i
                    className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"} position-absolute top-50 end-0 translate-middle-y me-3 text-secondary cursor-pointer`}
                    role="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  ></i>
                </div>
              </div>

              {passwordMismatch && (
                <p className="text-danger small mb-3">Passwords do not match</p>
              )}

              {/* Signup Button */}
              <button
                type="submit"
                className="btn btn-warning w-100 text-white fw-semibold mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating account...
                  </>
                ) : (
                  "Start 7-Day Free Trial"
                )}
              </button>

              <div className="text-center">
                <span className="text-muted">Already have an account? </span>
                <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: "#1f2937" }}>
                  Login
                </Link>
              </div>
            </form>
          </div>

          {/* Right Image Sectionhdf */}
          <div className="col-md-6 d-none d-md-block">
            <div className="h-100 position-relative">
              <img
                src="https://i.postimg.cc/GpVFJDn8/create-image-for-resturant-and-game-zone-pool-for-login-page-right-side-image-do-not-write-anything.jpg"
                alt="Signup Illustration"
                className="img-fluid h-100 w-100 object-fit-cover"
                style={{
                  borderTopRightRadius: "2rem",
                  borderBottomRightRadius: "2rem",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
