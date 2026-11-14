import React from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaArrowLeft, FaEnvelope, FaLock, FaCheckCircle, FaGlobe, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

const PrivacyPolicy = () => {
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
            <FaShieldAlt style={{ color: "#ea580c" }} className="fs-4" />
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
            Privacy Policy
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
                Welcome to <strong style={{ color: "#ffffff" }}>Kiaan Technology Private Limited</strong>. This Privacy Policy outlines how we collect, use, process, and protect your personal information when you use our website (<a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#ea580c", textDecoration: "underline" }}>https://kiaantechnology.com/</a>), SaaS platforms, mobile applications, and services. By using our services, you agree to the collection and use of information in accordance with this policy. This policy complies with the Indian IT Act 2000, DPDP Act 2023, GDPR, and app store guidelines.
              </p>

              {/* Section 1 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaCheckCircle style={{ color: "#ea580c" }} size={18} />
                  1. Information We Collect
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  We collect information necessary to deliver and improve our Gym Management SaaS Services. This includes:
                </p>
                <ul style={{ color: "#cbd5e1", paddingLeft: "20px" }}>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Gym Account Credentials:</strong> Gym Name, Owner Name, Contact Email, Contact Phone, and Billing Details.</li>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Staff & Trainer Records:</strong> Names, contact info, shift timings, and roles assigned by Gym Owners.</li>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Member Enrollment Info:</strong> Member Names, Email, Phone, plan details, attendance records, check-in history, and health log indexes (weight, height, BMI) stored by Gym Owners.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaCheckCircle style={{ color: "#ea580c" }} size={18} />
                  2. Consent for Communications (SMS & WhatsApp API)
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  Our SaaS platform integrates with messaging services, including Meta's WhatsApp Business Cloud API and SMS gateways, to automate gym operations.
                </p>
                <div 
                  className="p-3 rounded-3 mb-3"
                  style={{
                    backgroundColor: "rgba(234, 88, 12, 0.12)",
                    borderLeft: "4px solid #ea580c",
                    border: "1px solid rgba(234, 88, 12, 0.25)"
                  }}
                >
                  <p className="small fw-semibold mb-2" style={{ color: "#fdba74" }}>Notice for Members and Staff:</p>
                  <p className="small mb-0" style={{ color: "#e2e8f0" }}>
                    By registering with a gym tenant using our software, you explicitly consent to receive transactional and operational notifications (such as registration welcome notes, OTP verification codes, payment receipts, subscription expiration alerts, and shift schedules) sent on behalf of your Gym Owner via SMS, Email, and WhatsApp.
                  </p>
                </div>
                <p style={{ color: "#cbd5e1" }}>
                  You may opt-out or adjust your notification preferences by contacting your Gym Administrator or replying to the message templates with "STOP" where supported.
                </p>
              </div>

              {/* Section 3 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaLock style={{ color: "#ea580c" }} size={18} />
                  3. Data Security & Storage
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  We implement robust technical and organizational measures to safeguard your personal data:
                </p>
                <ul style={{ color: "#cbd5e1", paddingLeft: "20px" }}>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Encryption:</strong> Sensitive information (such as passwords) is hashed using strong cryptographic methods (bcrypt) before storage. Data in transit is protected using SSL/TLS encryption.</li>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Database Boundaries (Multi-Tenancy):</strong> We enforce strict database isolation policies. One Gym Owner's data (members, leads, revenue) is strictly isolated and can never be accessed by another Gym Owner or third parties.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaCheckCircle style={{ color: "#ea580c" }} size={18} />
                  4. Third-Party Integrations
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  We integrate with secure third-party platforms to provide standard platform functionalities:
                </p>
                <ul style={{ color: "#cbd5e1", paddingLeft: "20px" }}>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Payment Processing:</strong> Web-based transactions use secure gateways like Razorpay, while Android mobile app subscriptions utilize Google Play In-App Billing. We never store credit card or raw banking credentials on our servers.</li>
                  <li className="mb-2"><strong style={{ color: "#ffffff" }}>Developer API Infrastructure:</strong> Messaging delivery logs and notifications are routed securely via official partner platforms (such as Meta for WhatsApp Business and SendGrid for Email services).</li>
                </ul>
              </div>

              {/* Section 5: Account Deletion (Google Play Compliance) */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaCheckCircle style={{ color: "#ea580c" }} size={18} />
                  5. Account Deletion & Data Retention
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  In accordance with Google Play Store policies and global data privacy regulations, you have the full right to delete your user account and request erasure of all your personal data at any time:
                </p>
                <ul style={{ color: "#cbd5e1", paddingLeft: "20px" }}>
                  <li className="mb-2">
                    <strong style={{ color: "#ffffff" }}>In-App Deletion:</strong> Logged-in users and members can permanently delete their account under <strong style={{ color: "#fdba74" }}>Profile &gt; Account &gt; Danger Zone</strong>.
                  </li>
                  <li className="mb-2">
                    <strong style={{ color: "#ffffff" }}>Public Deletion Webpage:</strong> You can submit a deletion request without logging in by visiting our dedicated deletion portal at:{" "}
                    <Link to="/delete-account" style={{ color: "#ea580c", textDecoration: "underline", fontWeight: "600" }}>
                      https://gymsaas.app/delete-account
                    </Link>.
                  </li>
                  <li className="mb-2">
                    <strong style={{ color: "#ffffff" }}>Retention Exceptions:</strong> Upon deletion confirmation, your personal identity, contact details, attendance records, and health logs are purged permanently within 30 days. Aggregated statistical analytics or records strictly required by tax/financial laws may be kept for statutory durations.
                  </li>
                </ul>
              </div>

              {/* Section 6: Health & Fitness Data Declaration */}
              <div className="mb-5">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaCheckCircle style={{ color: "#ea580c" }} size={18} />
                  6. Health &amp; Fitness Data Protection
                </h4>
                <p style={{ color: "#cbd5e1" }}>
                  Our software provides fitness assessment and workout logging tools (such as height, weight, BMI, body measurements, and exercise history). This information is collected solely for your personal fitness progress tracking and authorized trainer consultations. We never sell, rent, or share your personal health or fitness metrics with any third-party advertisers.
                </p>
              </div>

              {/* Section 7 */}
              <div className="mb-4">
                <h4 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ea580c" }}>
                  <FaEnvelope style={{ color: "#ea580c" }} size={18} />
                  7. Contact Us
                </h4>
                <p style={{ color: "#cbd5e1" }} className="mb-3">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out to us:
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

export default PrivacyPolicy;
