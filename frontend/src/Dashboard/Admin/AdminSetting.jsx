import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Image,
  Nav,
  Tab,
  Alert,
  Spinner,
  InputGroup,
  Modal,
} from "react-bootstrap";
import {
  FaBuilding,
  FaImage,
  FaGlobe,
  FaFileInvoice,
  FaCheck,
  FaExclamationTriangle,
  FaCopy,
  FaDownload,
  FaLock,
  FaTrashAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../Components/LanguageSelector";
import CreatePlan from "./CreatePlan";
import BranchManagement from "./Settings/BranchManagement";
import IntegrationsSettings from "./Settings/IntegrationsSettings";
import PaymentGatewaysSettings from "./Settings/PaymentGatewaysSettings";
import CurrencySettings from "./Settings/CurrencySettings";
import { FaMapMarkerAlt, FaCreditCard, FaCoins, FaDatabase } from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import QRCode from "qrcode";

import BackupRestoreSettings from "./Settings/BackupRestoreSettings";
import WhatsAppIntegrationPage from "./WhatsAppIntegrationPage";
import { FaWhatsapp } from "react-icons/fa";

const AdminSetting = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("company");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settingsId, setSettingsId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [adminDetails, setAdminDetails] = useState(null);

  const [formData, setFormData] = useState({
    companyLogo: null,
    companyDescription: "",
    companyWebsite: "",
    gymName: "",
    gymAddress: "",
    gstNumber: "",
    phone: "",
    email: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    whatsappAccessToken: "",
    whatsappPhoneNumberId: "",
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
  });

  const [previewImages, setPreviewImages] = useState({
    companyLogo: "",
  });

  // Security Form State
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityFormData, setSecurityFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Danger Zone: Delete Admin Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAdminAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Password is required to confirm account deletion.");
      return;
    }
    setDeletingAccount(true);
    setDeleteError("");
    try {
      const res = await axiosInstance.delete("/auth/delete-account", {
        data: { password: deletePassword }
      });
      if (res.data?.success) {
        localStorage.clear();
        window.location.href = "/login";
      } else {
        setDeleteError(res.data?.message || "Failed to delete account.");
        setDeletingAccount(false);
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Incorrect password or error deleting account.");
      setDeletingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityError("");
    setSecuritySuccess("");

    if (securityFormData.newPassword.length < 6) {
      setSecurityError("New password must be at least 6 characters long.");
      return;
    }

    if (securityFormData.newPassword !== securityFormData.confirmPassword) {
      setSecurityError("New password and confirm password do not match.");
      return;
    }

    setSecurityLoading(true);

    try {
      const response = await axiosInstance.put("auth/changepassword", {
        oldPassword: securityFormData.oldPassword,
        newPassword: securityFormData.newPassword,
        id: adminId
      });

      if (response.data.success) {
        setSecuritySuccess("Password updated successfully!");
        setSecurityFormData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setSecurityError(response.data.message || "Failed to update password.");
      }
    } catch (err) {
      setSecurityError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSecurityLoading(false);
    }
  };

  // 🔹 Generate QR code
  useEffect(() => {
    const generatedUrl = formData.companyWebsite && adminId
      ? `https://gymsoftware.space/${formData.companyWebsite}/${adminId}`
      : "";

    if (generatedUrl) {
      QRCode.toDataURL(generatedUrl, { margin: 1, width: 250 })
        .then((url) => setQrCodeUrl(url))
        .catch(console.error);
    } else {
      setQrCodeUrl("");
    }
  }, [formData.companyWebsite, adminId]);

  // 🔹 Fetch admin details and settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("Admin not found");

        setAdminId(user.id);
        setFetching(true);

        // Fetch admin details to get gym name
        try {
          const adminRes = await axiosInstance.get(`auth/user/${user.id}`);
          if (adminRes.data) {
            setAdminDetails(adminRes.data);
            setFormData(prev => ({
              ...prev,
              gymName: adminRes.data.user?.gymName || adminRes.data.gymName || "",
              gymAddress: adminRes.data.user?.gymAddress || adminRes.data.gymAddress || "",
              gstNumber: adminRes.data.user?.gstNumber || adminRes.data.gstNumber || "",
              phone: adminRes.data.user?.phone || adminRes.data.phone || "",
              email: adminRes.data.user?.email || adminRes.data.email || "",
              razorpayKeyId: adminRes.data.user?.razorpayKeyId || "",
              razorpayKeySecret: adminRes.data.user?.razorpayKeySecret || "",
              whatsappAccessToken: adminRes.data.user?.whatsappAccessToken || "",
              whatsappPhoneNumberId: adminRes.data.user?.whatsappPhoneNumberId || "",
              smtpHost: adminRes.data.user?.smtpHost || "",
              smtpPort: adminRes.data.user?.smtpPort || "",
              smtpUser: adminRes.data.user?.smtpUser || "",
              smtpPass: adminRes.data.user?.smtpPass || ""
            }));
          }
        } catch (err) {
          console.log("Failed to fetch admin details");
        }

        // Fetch app settings
        const res = await axiosInstance.get(
          `adminSettings/app-settings/admin/${user.id}`
        );

        if (res.data?.data) {
          const s = res.data.data;
          setSettingsId(s.id);
          setFormData(prev => ({
            ...prev,
            companyDescription: s.description || "",
            companyWebsite: s.url || "",
            companyLogo: null,
          }));
          setPreviewImages(prev => ({ ...prev, companyLogo: s.logo || "" }));
        }
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files?.[0]) {
      setFormData({ ...formData, [name]: files[0] });
      const reader = new FileReader();
      reader.onload = () =>
        setPreviewImages((p) => ({ ...p, [name]: reader.result }));
      reader.readAsDataURL(files[0]);
    } else {
      let finalValue = value;
      if (name === "companyWebsite") {
        // Convert to lowercase and remove spaces/special characters
        finalValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      }
      setFormData({ ...formData, [name]: finalValue });
    }
  };

  const saveCompanyData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Update admin profile with gym name
      if (adminId) {
        try {
          await axiosInstance.put(`auth/user/${adminId}`, {
            gymName: formData.gymName,
            gymAddress: formData.gymAddress,
            gstNumber: formData.gstNumber,
            phone: formData.phone,
            email: formData.email
          });
        } catch (err) {
          console.log("Failed to update admin details");
        }
      }

      // Update app settings
      const data = new FormData();
      data.append("description", formData.companyDescription);
      data.append("url", formData.companyWebsite);
      data.append("adminId", adminId);

      if (formData.companyLogo) {
        data.append("logo", formData.companyLogo);
      }

      let updatedLogoUrl = null;
      if (settingsId) {
        const updateRes = await axiosInstance.put(
          `adminSettings/app-settings/${settingsId}`,
          data
        );
        updatedLogoUrl = updateRes.data?.data?.logo;
        setSuccess("Settings updated successfully!");
      } else {
        const res = await axiosInstance.post(
          "adminSettings/app-settings",
          data
        );
        updatedLogoUrl = res.data?.data?.logo;
        setSettingsId(res.data?.data?.id);
        setSuccess("Settings created successfully!");
      }

      // Notify Navbar & app components about logo update immediately
      window.dispatchEvent(new CustomEvent("appSettingsUpdated", { detail: { logo: updatedLogoUrl } }));
      window.dispatchEvent(new CustomEvent("logoUpdated", { detail: { logo: updatedLogoUrl } }));

      // Refresh admin details
      if (adminId) {
        const adminRes = await axiosInstance.get(`auth/user/${adminId}`);
        if (adminRes.data) {
          setAdminDetails(adminRes.data);
        }
      }
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Copy URL
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // 🔹 Download QR
  const downloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `gym-qr-${adminId || "admin"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatedUrl =
    formData.companyWebsite && adminId
      ? `https://gymsoftware.space/${formData.companyWebsite}/${adminId}`
      : "";

  return (
    <div>
      <Container fluid className="p-4">
        <h3 className="fw-bold">{t('settings.title')}</h3>
        <p className="text-muted">{t('settings.subtitle')}</p>

        {/* Global Language Selector Section */}
        <LanguageSelector />

        {success && (
          <Alert variant="success">
            <FaCheck className="me-2" />
            {success}
          </Alert>
        )}

        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          {/* Scrollable pill tabs for mobile */}
          <div className="bg-white p-1 rounded-4 shadow-sm mb-4 d-flex overflow-auto" style={{ gap: '4px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'company' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('company')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'company' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'company' ? '#ffffff' : '#64748b' }}
            >
              <FaBuilding className="me-2" />{t('settings.websiteSettings', 'Website Settings')}
            </button>
            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'currency' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('currency')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'currency' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'currency' ? '#ffffff' : '#64748b' }}
            >
              <FaCoins className="me-2" />{t('settings.currencySettings', 'Currency Settings')}
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'plans' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('plans')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'plans' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'plans' ? '#ffffff' : '#64748b' }}
            >
              <FaFileInvoice className="me-2" />{t('settings.plans', 'Plans')}
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'gateways' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('gateways')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'gateways' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'gateways' ? '#ffffff' : '#64748b' }}
            >
              <FaCreditCard className="me-2" />{t('settings.paymentGateways', 'Payment Gateways')}
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'payment' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('payment')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'payment' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'payment' ? '#ffffff' : '#64748b' }}
            >
              <FaGlobe className="me-2" />{t('settings.apiIntegrations', 'API & Integrations')}
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'security' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('security')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'security' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'security' ? '#ffffff' : '#64748b' }}
            >
              <FaLock className="me-2" />{t('settings.security', 'Security')}
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'backup' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('backup')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'backup' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'backup' ? '#ffffff' : '#64748b' }}
            >
              <FaDatabase className="me-2" />{t('settings.backupRestore', 'Backup & Restore')}
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'whatsapp' ? 'text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('whatsapp')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s', background: activeTab === 'whatsapp' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'transparent', color: activeTab === 'whatsapp' ? '#ffffff' : '#64748b' }}
            >
              <FaWhatsapp className="me-2 text-success" />{t('settings.whatsappIntegration', 'WhatsApp Integration')}
            </button>
          </div>

          <Tab.Content>
            {/* ================= COMPANY TAB ================= */}
            <Tab.Pane eventKey="company">
              <div className="border p-4 rounded shadow-sm bg-white">
                {fetching ? (
                  <div className="text-center py-5">
                    <Spinner />
                  </div>
                ) : (
                  <Form onSubmit={saveCompanyData}>
                    <div className="mb-4">
                      <h5 className="fw-bold mb-1">{t('settings.businessDetails', 'Business Details')}</h5>
                      <p className="text-muted small">{t('settings.businessDetailsHelp', 'These details will be printed on the invoices you generate for your members.')}</p>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">{t('settings.businessName', 'Business Name (Gym Name)')} *</Form.Label>
                          <Form.Control
                            type="text"
                            name="gymName"
                            value={formData.gymName}
                            onChange={handleChange}
                            placeholder={t('settings.enterBusinessName', 'Enter business name')}
                            required
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">{t('settings.gstNumber', 'GST Number')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleChange}
                            placeholder="e.g. 29ABCDE1234F1Z5"
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">{t('settings.businessPhone', 'Business Phone')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder={t('settings.enterPhoneNumber', 'Enter phone number')}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">{t('settings.businessEmail', 'Business Email')}</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('settings.enterEmailAddress', 'Enter email address')}
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">{t('settings.businessAddress', 'Business Address')}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="gymAddress"
                        value={formData.gymAddress}
                        onChange={handleChange}
                        placeholder={t('settings.enterBusinessAddress', 'Enter full business address')}
                      />
                    </Form.Group>
                    
                    {/* LOGO */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">{t('settings.logo', 'Company Logo')}</Form.Label>
                      <div className="d-flex align-items-center gap-3">
                        <Button as="label">
                          {t('common.upload', 'Upload')}
                          <Form.Control
                            type="file"
                            hidden
                            name="companyLogo"
                            onChange={handleChange}
                          />
                        </Button>
                        {previewImages.companyLogo && (
                          <Image
                            src={previewImages.companyLogo}
                            style={{ width: 80 }}
                          />
                        )}
                      </div>
                    </Form.Group>

                    {/* DESCRIPTION */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">{t('common.description', 'Description')}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="companyDescription"
                        value={formData.companyDescription}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    {/* SAVE */}
                    <div className="text-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
                      </Button>
                    </div>
                  </Form>
                )}
              </div>
            </Tab.Pane>

            {/* ================= CURRENCY TAB ================= */}
            <Tab.Pane eventKey="currency">
              <CurrencySettings />
            </Tab.Pane>

            {/* ================= PLANS TAB ================= */}
            <Tab.Pane eventKey="plans">
              <CreatePlan />
            </Tab.Pane>

            {/* ================= PAYMENT TAB ================= */}
            <Tab.Pane eventKey="payment">
              <IntegrationsSettings />
            </Tab.Pane>

            {/* ================= SECURITY (CHANGE PASSWORD) TAB ================= */}
            <Tab.Pane eventKey="security">
              <div className="border p-4 rounded shadow-sm bg-white">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">{t('settings.changePassword', 'Change Password')}</h5>
                  <p className="text-muted small">{t('settings.securityHelp', 'Update your account login password below.')}</p>
                </div>

                {securityError && (
                  <Alert variant="danger">
                    <FaExclamationTriangle className="me-2" />
                    {securityError}
                  </Alert>
                )}

                {securitySuccess && (
                  <Alert variant="success">
                    <FaCheck className="me-2" />
                    {securitySuccess}
                  </Alert>
                )}

                <Form onSubmit={handleChangePassword}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">{t('settings.oldPassword', 'Current Password')} *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder={t('settings.enterOldPassword', 'Enter current password')}
                      value={securityFormData.oldPassword}
                      onChange={(e) => setSecurityFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">{t('settings.newPassword', 'New Password')} *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder={t('settings.enterNewPassword', 'Enter new password (min 6 characters)')}
                      value={securityFormData.newPassword}
                      onChange={(e) => setSecurityFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{t('settings.confirmPassword', 'Confirm New Password')} *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder={t('settings.confirmNewPassword', 'Confirm new password')}
                      value={securityFormData.confirmPassword}
                      onChange={(e) => setSecurityFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </Form.Group>

                  <div className="text-end">
                    <Button type="submit" disabled={securityLoading}>
                      {securityLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          {t('common.saving', 'Saving...')}
                        </>
                      ) : (
                        t('settings.updatePassword', 'Update Password')
                      )}
                    </Button>
                  </div>
                </Form>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="border border-danger border-opacity-50 p-4 rounded shadow-sm bg-white mt-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <h5 className="fw-bold text-danger mb-1 d-flex align-items-center gap-2">
                      <FaTrashAlt />
                      {t('settings.dangerZone', 'Danger Zone — Delete Account')}
                    </h5>
                    <p className="text-muted small mb-0">
                      Permanently delete your admin account, gym profile, staff records, and personal data.
                    </p>
                  </div>
                  <Button 
                    variant="outline-danger" 
                    className="fw-bold"
                    onClick={() => {
                      setDeleteError("");
                      setDeletePassword("");
                      setShowDeleteModal(true);
                    }}
                  >
                    {t('settings.deleteAccountBtn', 'Delete Account')}
                  </Button>
                </div>
              </div>

              {/* Delete Admin Account Confirmation Modal */}
              <Modal 
                show={showDeleteModal} 
                onHide={() => !deletingAccount && setShowDeleteModal(false)}
                centered
              >
                <Modal.Header closeButton={!deletingAccount} className="border-bottom-0 pb-0">
                  <Modal.Title className="fw-bold text-danger d-flex align-items-center gap-2">
                    <FaExclamationTriangle />
                    Confirm Account Deletion
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <p className="fw-semibold text-danger">
                    Warning: This action is permanent and cannot be undone. All gym operational records, member assignments, staff associations, and settings will be permanently erased.
                  </p>

                  {/* Google Play Active Subscription Policy Warning */}
                  <div className="alert alert-warning py-2 px-3 small mb-3 border-0 rounded-3">
                    <div className="d-flex align-items-start gap-2">
                      <FaExclamationTriangle className="text-warning mt-1 flex-shrink-0" />
                      <div>
                        <strong>Important:</strong> Deleting your account will not automatically cancel your active Google Play subscription. Please manage or cancel recurring subscriptions in your{" "}
                        <a 
                          href="https://play.google.com/store/account/subscriptions" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="fw-bold text-decoration-underline text-dark"
                        >
                          Google Play Subscriptions settings
                        </a>.
                      </div>
                    </div>
                  </div>

                  <p className="small text-muted mb-3">
                    To confirm this permanent action, please enter your current account password below:
                  </p>

                  {deleteError && (
                    <Alert variant="danger" className="py-2 small mb-3">
                      <FaExclamationTriangle className="me-2" />
                      {deleteError}
                    </Alert>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Current Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your current password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={deletingAccount}
                    />
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deletingAccount}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="danger" 
                    className="fw-bold"
                    onClick={handleDeleteAdminAccount}
                    disabled={deletingAccount || !deletePassword}
                  >
                    {deletingAccount ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Deleting Account...
                      </>
                    ) : (
                      "Permanently Delete Account"
                    )}
                  </Button>
                </Modal.Footer>
              </Modal>
            </Tab.Pane>

            {/* ================= PAYMENT GATEWAYS TAB ================= */}
            <Tab.Pane eventKey="gateways">
              <div className="border p-4 rounded shadow-sm bg-white">
                <PaymentGatewaysSettings />
              </div>
            </Tab.Pane>

            {/* ================= BACKUP & RESTORE TAB ================= */}
            <Tab.Pane eventKey="backup">
              <BackupRestoreSettings />
            </Tab.Pane>

            {/* ================= WHATSAPP INTEGRATION TAB ================= */}
            <Tab.Pane eventKey="whatsapp">
              <WhatsAppIntegrationPage />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
};

export default AdminSetting;