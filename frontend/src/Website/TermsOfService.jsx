import React from "react";
import { Link } from "react-router-dom";
import { FaFileSignature, FaArrowLeft, FaEnvelope, FaExclamationCircle, FaUserCheck } from "react-icons/fa";

const TermsOfService = () => {
  return (
    <div style={{ backgroundColor: "#120602", minHeight: "100vh", color: "#f8fafc", fontFamily: "Outfit, sans-serif" }}>
      {/* Navigation Header */}
      <header className="py-3 sticky-top shadow-sm" style={{ backgroundColor: "#1c0b05", borderBottom: "1px solid rgba(234, 88, 12, 0.25)" }}>
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2" style={{ color: "#fdba74" }}>
            <FaArrowLeft />
            <span className="fw-semibold small">Back to Home</span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <FaFileSignature style={{ color: "#ea580c" }} className="fs-4" />
            <span className="fw-bold text-white fs-5">Gym Management</span>
          </div>
        </div>
      </header>

      {/* Main Banner */}
      <section 
        className="text-white py-5 text-center position-relative" 
        style={{ 
          background: "linear-gradient(135deg, #120602 0%, #1c0b05 50%, #271107 100%)",
          borderBottom: "1px solid rgba(234, 88, 12, 0.2)" 
        }}
      >
        <div className="container py-4 position-relative" style={{ zIndex: 2 }}>
          <h1 className="fw-bold display-4 mb-2" style={{ background: "linear-gradient(135deg, #ffffff 0%, #fed7aa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Terms & Conditions
          </h1>
          <p className="lead mb-0" style={{ color: "#fdba74", fontSize: "0.95rem" }}>Last Updated: July 4, 2026</p>
        </div>
      </section>

      {/* Content Container */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div 
              className="rounded-4 p-4 p-md-5 shadow-lg"
              style={{
                backgroundColor: "#180903",
                border: "1px solid rgba(234, 88, 12, 0.3)",
                color: "#e2e8f0"
              }}
            >
              <p className="mb-4 lead" style={{ fontSize: "1.05rem", lineHeight: "1.7", color: "#e2e8f0" }}>
                Welcome to <strong style={{ color: "#ffffff" }}>Kiaan Technology Private Limited</strong>. These Terms & Conditions govern your access to and use of our website (<a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c", textDecoration: "underline" }}>https://kiaantechnology.com/</a>), SaaS platforms, mobile applications, and gym management services. By accessing or using our services, you agree to comply with these terms.
              </p>

              {/* Section 1 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaUserCheck style={{ color: "#ea580c" }} size={18} />
                  1. User Account & Registration
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  To access SaaS features, users must register an account with accurate business details. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
                </p>
              </div>

              {/* Section 2 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaFileSignature style={{ color: "#ea580c" }} size={18} />
                  2. Subscription Plans & Payment Terms
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  Subscription fees are payable in advance based on the plan selected. All payment processing is securely handled via integrated payment gateways (such as Razorpay). Rates and taxes comply with Indian IT Act 2000 guidelines.
                </p>
              </div>

              {/* Section 3 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaExclamationCircle style={{ color: "#ea580c" }} size={18} />
                  3. Free Trial Policy
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  Free trial accounts are provided for demonstration purposes. Trial access duration is strictly limited. Each email address is eligible for only one free trial. Upon expiration, access requires plan subscription.
                </p>
              </div>

              {/* Section 4 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaExclamationCircle style={{ color: "#ea580c" }} size={18} />
                  4. Acceptable Use Policy & Messaging Regulations
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  You agree not to use the services for any unlawful purpose, interfere with system operations, reverse engineer components, or transmit unauthorized data under DPDP Act 2023 and GDPR guidelines.
                </p>
                <div 
                  className="p-3 rounded-3 mb-3"
                  style={{
                    backgroundColor: "rgba(234, 88, 12, 0.12)",
                    borderLeft: "4px solid #ea580c",
                    border: "1px solid rgba(234, 88, 12, 0.25)"
                  }}
                >
                  <p className="small fw-semibold mb-2" style={{ color: "#fdba74" }}>Anti-Spam WhatsApp Guidelines:</p>
                  <p className="small mb-0" style={{ color: "#e2e8f0" }}>
                    You must comply with Meta's Commerce Policy and WhatsApp Business Policy. You agree NOT to send unsolicited spam, promotional links without prior opt-in consent, or harassing messages to gym members.
                  </p>
                </div>
              </div>

              {/* Section 5 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaExclamationCircle style={{ color: "#ea580c" }} size={18} />
                  5. Termination & Limitation of Liability
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  We reserve the right to suspend or terminate service access for violations of these terms. In no event shall Kiaan Technology be liable for indirect or consequential damages arising out of service usage.
                </p>
              </div>

              {/* Section 6 */}
              <div className="mb-4">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaEnvelope style={{ color: "#ea580c" }} size={18} />
                  6. Contact Information
                </h4>
                <p style={{ color: "#cbd5e1" }} className="mb-3">
                  For any queries regarding these Terms & Conditions, please reach out to us:
                </p>
                <div 
                  className="p-3.5 rounded-3"
                  style={{
                    backgroundColor: "rgba(234, 88, 12, 0.08)",
                    border: "1px solid rgba(234, 88, 12, 0.25)",
                    fontSize: "0.9rem"
                  }}
                >
                  <p className="mb-1"><strong style={{ color: "#ffffff" }}>Company:</strong> Kiaan Technology Private Limited</p>
                  <p className="mb-1"><strong style={{ color: "#ffffff" }}>Address:</strong> 2341/E, Sudama Nagar, Indore, Madhya Pradesh, India</p>
                  <p className="mb-1"><strong style={{ color: "#ffffff" }}>Phone:</strong> +91-97521 00980</p>
                  <p className="mb-1"><strong style={{ color: "#ffffff" }}>Email:</strong> info@kiaantechnology.com</p>
                  <p className="mb-0"><strong style={{ color: "#ffffff" }}>Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c", textDecoration: "underline" }}>https://kiaantechnology.com/</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Footer */}
      <footer className="py-4 text-center text-muted small" style={{ backgroundColor: "#1c0b05", borderTop: "1px solid rgba(234, 88, 12, 0.2)" }}>
        <p className="mb-0" style={{ color: "#94a3b8" }}>&copy; {new Date().getFullYear()} Kiaan Technology Private Limited. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TermsOfService;
