import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, Badge, Card, InputGroup, Modal } from "react-bootstrap";
import { FaCheck, FaExclamationTriangle, FaPaperPlane, FaTrashAlt, FaEnvelope, FaQuestionCircle, FaWhatsapp, FaQrcode, FaMobileAlt, FaSync, FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../Api/axiosInstance";

const IntegrationsSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "danger", text: "" }
  const [waNumber, setWaNumber] = useState("");
  const [smtpProvider, setSmtpProvider] = useState("gmail"); // "gmail" | "brevo" | "resend"
  const [showPassword, setShowPassword] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [integrations, setIntegrations] = useState({
    paymentGatewayEnabled: false,
    emailEnabled: false,
    smtpEnabled: false,
    whatsappEnabled: false,
    whatsappNumber: "",
    whatsappStatus: "DISCONNECTED",
    whatsappQr: null,
    whatsappConnectedAt: null,
    razorpayKeyId: "",
    razorpaySecret: "",
    brevoApiKey: "",
    brevoSenderEmail: "",
    brevoSenderName: "",
    smtpProvider: "gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpEncryption: "STARTTLS",
    isVerified: false,
    lastVerifiedAt: null,
    lastTestStatus: "",
    lastTestMessage: ""
  });
  const [upiQrFile, setUpiQrFile] = useState(null);
  const [upiQrPreview, setUpiQrPreview] = useState(null);
  const [deleteQrCode, setDeleteQrCode] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    let interval = null;
    if (integrations.whatsappStatus === "QR_READY" || integrations.whatsappStatus === "CONNECTING") {
      interval = setInterval(async () => {
        try {
          const res = await axiosInstance.get("integrations/whatsapp");
          if (res.data?.success && res.data.data) {
            setIntegrations(prev => ({
              ...prev,
              whatsappStatus: res.data.data.status,
              whatsappQr: res.data.data.qr || prev.whatsappQr,
              whatsappNumber: res.data.data.number || prev.whatsappNumber,
              whatsappConnectedAt: res.data.data.connectedAt
            }));
          }
        } catch (e) {}
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [integrations.whatsappStatus]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("integrations");
      if (res.data?.success) {
        setIntegrations(res.data.data);
        if (res.data.data.whatsappNumber) {
          setWaNumber(res.data.data.whatsappNumber);
        }
        const host = (res.data.data.smtpHost || "").toLowerCase();
        const provider = res.data.data.smtpProvider || (
          host.includes("resend") ? "resend" :
          host.includes("brevo") || host.includes("sendinblue") ? "brevo" : "gmail"
        );
        setSmtpProvider(provider);
      }
    } catch (err) {
      console.error("Failed to load integrations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    try {
      setUpdating(true);
      const res = await axiosInstance.post("integrations/whatsapp/connect", { number: waNumber });
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmWAScan = async () => {
    try {
      setUpdating(true);
      const res = await axiosInstance.post("integrations/whatsapp/confirm-scan");
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp?")) return;
    try {
      setUpdating(true);
      const res = await axiosInstance.post("integrations/whatsapp/disconnect");
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "upiQrCodeFile" && files && files[0]) {
      setUpiQrFile(files[0]);
      setUpiQrPreview(URL.createObjectURL(files[0]));
      setDeleteQrCode(false);
      return;
    }
    setIntegrations(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdate = async (endpoint, payload) => {
    try {
      setUpdating(true);
      const res = await axiosInstance.put(`integrations/${endpoint}`, payload);
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations(); // re-fetch to get masked fields back
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setTesting(true);
      const res = await axiosInstance.post("integrations/smtp/test", {
        smtpHost: integrations.smtpHost || (smtpProvider === "resend" ? "smtp.resend.com" : smtpProvider === "brevo" ? "smtp-relay.brevo.com" : "smtp.gmail.com"),
        smtpPort: integrations.smtpPort || 587,
        smtpUsername: smtpProvider === "resend" ? "resend" : integrations.smtpUsername,
        smtpPassword: integrations.smtpPassword,
        senderEmail: integrations.brevoSenderEmail,
        senderName: integrations.brevoSenderName
      });
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
      fetchIntegrations();
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  const isGmailActive = Boolean(integrations.smtpEnabled) && (integrations.smtpProvider === "gmail" || (!integrations.smtpProvider && (integrations.smtpHost || "").includes("gmail")));
  const isBrevoActive = Boolean(integrations.smtpEnabled) && integrations.smtpProvider === "brevo";
  const isResendActive = Boolean(integrations.smtpEnabled) && integrations.smtpProvider === "resend";

  return (
    <div className="border p-4 rounded shadow-sm bg-white">
      {message && (
        <Alert variant={message.type}>
          {message.type === "success" ? <FaCheck className="me-2" /> : <FaExclamationTriangle className="me-2" />}
          {message.text}
        </Alert>
      )}

      {/* MANUAL UPI / CASH PAYMENT SETTINGS */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5 className="fw-bold mb-0">{t('settings.manualPaymentTitle', 'Manual Payment Verification (UPI / Cash)')}</h5>
        </div>
        <p className="text-muted small">{t('settings.manualPaymentHelp', 'Configure your UPI details. Members will pay manually and submit the UTR for your verification.')}</p>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">{t('settings.upiQrCodeLabel', 'UPI QR Code (Image)')}</Form.Label>
            <Form.Control
              type="file"
              name="upiQrCodeFile"
              accept="image/*"
              onChange={handleChange}
            />
            {(upiQrPreview || integrations.upiQrCode) && !deleteQrCode && (
              <div className="mt-2 position-relative d-inline-block">
                <img 
                  src={upiQrPreview || integrations.upiQrCode} 
                  alt="QR Preview" 
                  style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #ddd' }} 
                />
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm position-absolute top-0 start-100 translate-middle rounded-circle shadow"
                  onClick={() => {
                    setUpiQrFile(null);
                    setUpiQrPreview(null);
                    setDeleteQrCode(true);
                  }}
                  style={{ width: '24px', height: '24px', padding: 0, lineHeight: 1, zIndex: 10 }}
                >
                  &times;
                </button>
              </div>
            )}
            <Form.Text className="text-muted">{t('settings.uploadQrHelp', 'Upload an image of your QR code.')}</Form.Text>
          </Form.Group>
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-end mb-4">
        <Button onClick={() => {
          const formData = new FormData();
          if (upiQrFile) {
            formData.append("upiQrCodeFile", upiQrFile);
          }
          if (deleteQrCode) {
            formData.append("deleteQrCode", "true");
          }
          handleUpdate("upi", formData);
        }} disabled={updating}>
          {updating ? t('common.saving', 'Saving...') : t('settings.savePaymentSettings', 'Save Payment Settings')}
        </Button>
      </div>

      <hr className="my-4" />

      {/* BREVO */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5 className="fw-bold mb-0">{t('settings.brevoTitle', 'Brevo API Email Settings')}</h5>
          <Form.Check 
            type="switch"
            id="emailEnabled"
            name="emailEnabled"
            label={integrations.emailEnabled ? t('common.active', 'Enabled') : t('common.inactive', 'Disabled')}
            checked={integrations.emailEnabled}
            onChange={handleChange}
          />
        </div>
        <p className="text-muted small">{t('settings.brevoHelp', 'Configure Brevo REST API to send automated emails.')}</p>
      </div>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">{t('settings.brevoApiKey', 'Brevo REST API Key')}</Form.Label>
        <Form.Control
          type="password"
          name="brevoApiKey"
          value={integrations.brevoApiKey || ""}
          onChange={handleChange}
          placeholder="xkeysib-..."
        />
      </Form.Group>

      <div className="row">
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">{t('settings.senderEmail', 'Sender Email')}</Form.Label>
            <Form.Control
              type="email"
              name="brevoSenderEmail"
              value={integrations.brevoSenderEmail || ""}
              onChange={handleChange}
              placeholder="admin@yourgym.com"
            />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">{t('settings.senderName', 'Sender Name')}</Form.Label>
            <Form.Control
              type="text"
              name="brevoSenderName"
              value={integrations.brevoSenderName || ""}
              onChange={handleChange}
              placeholder="Gym Name"
            />
          </Form.Group>
        </div>
      </div>
      <div className="d-flex gap-2 justify-content-end mb-4">
        <Button onClick={() => handleUpdate("brevo", {
          brevoApiKey: integrations.brevoApiKey,
          brevoSenderEmail: integrations.brevoSenderEmail,
          brevoSenderName: integrations.brevoSenderName,
          emailEnabled: integrations.emailEnabled
        })} disabled={updating || testing}>
          {updating ? t('common.saving', 'Saving...') : t('settings.saveBrevo', 'Save Brevo API')}
        </Button>
      </div>

      <hr className="my-4" />

      {/* SMTP SETTINGS CARD */}
      <Card className="border shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
          {/* Header & Test Connection Button */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
                style={{ width: "48px", height: "48px" }}
              >
                <FaEnvelope className="fs-4" />
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">Email SMTP Settings</h5>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  CONNECT YOUR OFFICIAL GYM EMAIL ACCOUNT
                </span>
              </div>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              className="fw-bold rounded-pill px-3 py-2 text-uppercase d-flex align-items-center gap-2"
              onClick={handleTestSmtp}
              disabled={testing || !integrations.smtpEnabled}
              style={{ fontSize: "12px", letterSpacing: "0.5px" }}
            >
              {testing ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
              {testing ? "Sending Test Email..." : "TEST CONNECTION"}
            </Button>
          </div>

          {/* SELECT EMAIL SERVICE PROVIDER PILLS WITH ACTIVE BADGES */}
          <div className="mb-4">
            <Form.Label className="fw-bold text-muted text-uppercase d-block mb-2" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
              EMAIL PROVIDER TABS
            </Form.Label>
            <div className="bg-light p-1.5 rounded-3 d-flex flex-wrap gap-2 border">
              {/* GMAIL / GOOGLE WORKSPACE TAB */}
              <button
                type="button"
                className={`btn flex-fill py-2.5 px-3 rounded-3 fw-bold text-uppercase d-flex align-items-center justify-content-between border-0 ${
                  smtpProvider === "gmail" ? "bg-white text-dark shadow-sm" : "text-muted bg-transparent"
                }`}
                style={{ fontSize: "12px", transition: "all 0.2s" }}
                onClick={() => {
                  setSmtpProvider("gmail");
                  setIntegrations(prev => ({
                    ...prev,
                    smtpHost: prev.smtpHost === "smtp.resend.com" || prev.smtpHost === "smtp-relay.brevo.com" ? "smtp.gmail.com" : prev.smtpHost || "smtp.gmail.com",
                    smtpPort: prev.smtpPort || 587,
                    smtpUsername: prev.smtpUsername === "resend" ? "" : prev.smtpUsername
                  }));
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="rounded-circle" style={{ width: "10px", height: "10px", backgroundColor: "#dc3545" }}></span>
                  <span>Gmail / Google Workspace</span>
                </div>
                <Badge bg={isGmailActive ? "success" : "secondary"} className="ms-2 rounded-pill px-2 py-1" style={{ fontSize: "9px" }}>
                  {isGmailActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </button>

              {/* BREVO TAB */}
              <button
                type="button"
                className={`btn flex-fill py-2.5 px-3 rounded-3 fw-bold text-uppercase d-flex align-items-center justify-content-between border-0 ${
                  smtpProvider === "brevo" ? "bg-white text-dark shadow-sm" : "text-muted bg-transparent"
                }`}
                style={{ fontSize: "12px", transition: "all 0.2s" }}
                onClick={() => {
                  setSmtpProvider("brevo");
                  setIntegrations(prev => ({
                    ...prev,
                    smtpHost: "smtp-relay.brevo.com",
                    smtpPort: 587,
                    smtpUsername: prev.smtpUsername === "resend" ? "" : prev.smtpUsername
                  }));
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="rounded-circle" style={{ width: "10px", height: "10px", backgroundColor: "#0d6efd" }}></span>
                  <span>Brevo</span>
                </div>
                <Badge bg={isBrevoActive ? "success" : "secondary"} className="ms-2 rounded-pill px-2 py-1" style={{ fontSize: "9px" }}>
                  {isBrevoActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </button>

              {/* RESEND TAB */}
              <button
                type="button"
                className={`btn flex-fill py-2.5 px-3 rounded-3 fw-bold text-uppercase d-flex align-items-center justify-content-between border-0 ${
                  smtpProvider === "resend" ? "bg-white text-dark shadow-sm" : "text-muted bg-transparent"
                }`}
                style={{ fontSize: "12px", transition: "all 0.2s" }}
                onClick={() => {
                  setSmtpProvider("resend");
                  setIntegrations(prev => ({
                    ...prev,
                    smtpHost: "smtp.resend.com",
                    smtpPort: 587,
                    smtpUsername: "resend"
                  }));
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="rounded-circle" style={{ width: "10px", height: "10px", backgroundColor: "#6f42c1" }}></span>
                  <span>Resend</span>
                </div>
                <Badge bg={isResendActive ? "success" : "secondary"} className="ms-2 rounded-pill px-2 py-1" style={{ fontSize: "9px" }}>
                  {isResendActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </button>
            </div>
          </div>

          {/* DYNAMIC PROVIDER NOTICE BANNER */}
          {smtpProvider === "gmail" && (
            <div className="p-3 rounded-3 mb-4 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 d-flex align-items-center gap-2" style={{ fontSize: "12px" }}>
              <span className="rounded-circle bg-danger" style={{ width: "8px", height: "8px", flexShrink: 0 }}></span>
              <div>
                <strong>Gmail / Workspace SMTP Setup:</strong> Host: <code className="text-dark bg-white px-1.5 py-0.5 rounded">smtp.gmail.com</code>, Port: <code className="text-dark bg-white px-1.5 py-0.5 rounded">587</code>. Enter your full Gmail address as Username and a 16-character <strong>Google App Password</strong> as the Password.
              </div>
            </div>
          )}

          {smtpProvider === "brevo" && (
            <div className="p-3 rounded-3 mb-4 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 d-flex align-items-center gap-2" style={{ fontSize: "12px" }}>
              <span className="rounded-circle bg-primary" style={{ width: "8px", height: "8px", flexShrink: 0 }}></span>
              <div>
                <strong>Brevo SMTP Setup:</strong> Host: <code className="text-dark bg-white px-1.5 py-0.5 rounded">smtp-relay.brevo.com</code>, Port: <code className="text-dark bg-white px-1.5 py-0.5 rounded">587</code>. Enter your Brevo login email as Username and your SMTP Key (<code className="text-dark bg-white px-1.5 py-0.5 rounded">xsmtpsib-...</code>) as Password.
              </div>
            </div>
          )}

          {smtpProvider === "resend" && (
            <div className="p-3 rounded-3 mb-4 bg-purple bg-opacity-10 border border-purple border-opacity-20 d-flex align-items-center gap-2" style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", borderColor: "#e9d5ff", fontSize: "12px" }}>
              <span className="rounded-circle" style={{ width: "8px", height: "8px", backgroundColor: "#6b21a8", flexShrink: 0 }}></span>
              <div>
                <strong>Resend SMTP Setup:</strong> Host: <code className="text-dark bg-white px-1.5 py-0.5 rounded">smtp.resend.com</code>, Port: <code className="text-dark bg-white px-1.5 py-0.5 rounded">587</code>, Username: <code className="text-dark bg-white px-1.5 py-0.5 rounded">resend</code>. Enter your Resend API Key (<code className="text-dark bg-white px-1.5 py-0.5 rounded">re_...</code>) as Password and set your verified domain email as Sender Email.
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="row g-3">
            {/* SMTP HOST */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  SMTP HOST
                </Form.Label>
                <Form.Control
                  type="text"
                  name="smtpHost"
                  value={integrations.smtpHost || (smtpProvider === "resend" ? "smtp.resend.com" : smtpProvider === "brevo" ? "smtp-relay.brevo.com" : "smtp.gmail.com")}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="bg-light border-0 py-2 rounded-3"
                />
              </Form.Group>
            </div>

            {/* SMTP PORT */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  SMTP PORT
                </Form.Label>
                <Form.Control
                  type="number"
                  name="smtpPort"
                  value={integrations.smtpPort || 587}
                  onChange={handleChange}
                  placeholder="587"
                  className="bg-light border-0 py-2 rounded-3"
                />
              </Form.Group>
            </div>

            {/* SMTP USERNAME */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  {smtpProvider === "resend" ? "RESEND USERNAME (DEFAULT: RESEND)" : "SMTP USERNAME"}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="smtpUsername"
                  value={smtpProvider === "resend" ? "resend" : integrations.smtpUsername || ""}
                  onChange={handleChange}
                  readOnly={smtpProvider === "resend"}
                  placeholder={smtpProvider === "resend" ? "resend" : "gym@example.com"}
                  className="bg-light border-0 py-2 rounded-3"
                />
              </Form.Group>
            </div>

            {/* SMTP PASSWORD / MASTER KEY */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  {smtpProvider === "resend" ? "RESEND API KEY" : smtpProvider === "brevo" ? "BREVO SMTP KEY" : "SMTP PASSWORD / APP PASSWORD"}
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="smtpPassword"
                    value={integrations.smtpPassword || ""}
                    onChange={handleChange}
                    placeholder={smtpProvider === "resend" ? "re_..." : smtpProvider === "brevo" ? "xsmtpsib-..." : "••••••••••••"}
                    className="bg-light border-0 py-2 rounded-start-3"
                  />
                  <Button 
                    variant="light" 
                    className="border-0 bg-light rounded-end-3 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputGroup>
              </Form.Group>
            </div>

            {/* SENDER EMAIL */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  SENDER EMAIL
                </Form.Label>
                <Form.Control
                  type="email"
                  name="brevoSenderEmail"
                  value={integrations.brevoSenderEmail || ""}
                  onChange={handleChange}
                  placeholder="gym@example.com"
                  className="bg-light border-0 py-2 rounded-3"
                />
              </Form.Group>
            </div>

            {/* SENDER NAME */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold text-muted text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                  SENDER NAME
                </Form.Label>
                <Form.Control
                  type="text"
                  name="brevoSenderName"
                  value={integrations.brevoSenderName || ""}
                  onChange={handleChange}
                  placeholder="ABC Fitness Club"
                  className="bg-light border-0 py-2 rounded-3"
                />
              </Form.Group>
            </div>
          </div>

          {/* Action Bar / Status Footer */}
          <div className="mt-4 pt-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <Form.Check 
                type="switch"
                id="smtpEnabled"
                name="smtpEnabled"
                checked={Boolean(integrations.smtpEnabled)}
                onChange={handleChange}
                className="fs-5 m-0"
              />
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark" style={{ fontSize: "13px" }}>SMTP Delivery Status:</span>
                  <Badge 
                    bg={integrations.smtpEnabled ? "success" : "secondary"} 
                    className="rounded-pill px-2 py-1"
                    style={{ fontSize: "10px" }}
                  >
                    • {integrations.smtpEnabled ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <span className="text-muted d-block" style={{ fontSize: "11px" }}>
                  {integrations.smtpEnabled 
                    ? "Your company SMTP is currently ACTIVE and delivering official emails." 
                    : "SMTP delivery is INACTIVE. Turning off SMTP stops delivery without deleting saved credentials."}
                </span>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline-danger"
                size="sm"
                className="fw-bold px-3 py-2 rounded-3 text-uppercase d-flex align-items-center gap-2"
                onClick={() => setShowRemoveModal(true)}
                disabled={updating}
                style={{ fontSize: "12px" }}
              >
                <FaTrashAlt /> REMOVE SMTP
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="fw-bold px-4 py-2 rounded-3 text-uppercase"
                onClick={() => handleUpdate("smtp", {
                  smtpHost: integrations.smtpHost || (smtpProvider === "resend" ? "smtp.resend.com" : smtpProvider === "brevo" ? "smtp-relay.brevo.com" : "smtp.gmail.com"),
                  smtpPort: integrations.smtpPort || 587,
                  smtpUsername: smtpProvider === "resend" ? "resend" : integrations.smtpUsername,
                  smtpPassword: integrations.smtpPassword,
                  smtpEncryption: integrations.smtpEncryption || "STARTTLS",
                  smtpEnabled: integrations.smtpEnabled,
                  smtpProvider: smtpProvider,
                  senderEmail: integrations.brevoSenderEmail,
                  senderName: integrations.brevoSenderName
                })}
                disabled={updating}
                style={{ fontSize: "12px" }}
              >
                {updating ? "SAVING..." : "SAVE SETTINGS"}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* CONFIRMATION DIALOG MODAL FOR REMOVE SMTP */}
      <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger d-flex align-items-center gap-2" style={{ fontSize: "18px" }}>
            <FaTrashAlt /> Remove SMTP Configuration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <p className="text-secondary mb-0">
            Are you sure you want to remove your SMTP configuration? This will clear your saved credentials and deactivate custom SMTP email delivery for your gym.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowRemoveModal(false)} className="fw-semibold">
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="fw-bold px-3"
            onClick={() => {
              setShowRemoveModal(false);
              handleUpdate("smtp", { action: "remove" });
            }}
          >
            Remove SMTP
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DYNAMIC SETUP GUIDE BOX */}
      <Card className="border-0 bg-light rounded-4">
        <Card.Body className="p-4">
          <div className="d-flex gap-3">
            <div className="text-primary mt-1">
              <FaQuestionCircle className="fs-4" />
            </div>
            <div className="w-100">
              <h6 className="fw-bold mb-1 text-dark">
                Setup Guide: {smtpProvider === "gmail" ? "Gmail / Google Workspace" : smtpProvider === "brevo" ? "Brevo (Sendinblue)" : "Resend (API & SMTP)"}
              </h6>
              <p className="text-muted small mb-3">
                Follow these step-by-step instructions to connect your gym's official email provider for automated notifications.
              </p>
              
              {/* GMAIL GUIDE */}
              {smtpProvider === "gmail" && (
                <ol className="ps-3 mb-0 small text-secondary">
                  <li className="mb-1.5">Open <strong>Google Account / Google Workspace</strong>.</li>
                  <li className="mb-1.5">Enable <strong>2-Step Verification</strong> in Security settings.</li>
                  <li className="mb-1.5">Open <strong>App Passwords</strong> page in your Google Security settings.</li>
                  <li className="mb-1.5">Generate an App Password (select App: <strong>Mail</strong>, Device: <strong>Other / Gym Management</strong>).</li>
                  <li className="mb-1.5">Use the generated 16-character App Password as the <strong>SMTP Password</strong> (do not use your regular Google account password).</li>
                  <li className="mb-1.5">Enter your full Gmail or Google Workspace email address as <strong>SMTP Username</strong> and <strong>Sender Email</strong>.</li>
                  <li className="mb-1.5">Click <strong>Save Settings</strong> to store your credentials securely.</li>
                  <li className="mb-1.5">Click <strong>Test Connection</strong> to verify delivery and send a real test email.</li>
                </ol>
              )}

              {/* BREVO GUIDE */}
              {smtpProvider === "brevo" && (
                <ol className="ps-3 mb-0 small text-secondary">
                  <li className="mb-1.5">Open <strong>Brevo</strong> (formerly Sendinblue) and sign in.</li>
                  <li className="mb-1.5">Open <strong>SMTP & API</strong> settings from your account menu.</li>
                  <li className="mb-1.5">Create or use the required <strong>SMTP credential</strong>.</li>
                  <li className="mb-1.5">Copy the SMTP server (<code className="bg-white px-1.5 py-0.5 rounded">smtp-relay.brevo.com</code>) and Port (<code className="bg-white px-1.5 py-0.5 rounded">587</code>).</li>
                  <li className="mb-1.5">Enter your Brevo login email as <strong>SMTP Username</strong> and your generated SMTP Key (<code className="bg-white px-1.5 py-0.5 rounded">xsmtpsib-...</code>) as <strong>SMTP Key / Password</strong>.</li>
                  <li className="mb-1.5">Configure your verified sender email in <strong>Sender Email</strong>.</li>
                  <li className="mb-1.5">Click <strong>Save Settings</strong> to save your configuration.</li>
                  <li className="mb-1.5">Click <strong>Test Connection</strong> to verify delivery and send a real test email.</li>
                </ol>
              )}

              {/* RESEND GUIDE */}
              {smtpProvider === "resend" && (
                <ol className="ps-3 mb-0 small text-secondary">
                  <li className="mb-1.5">Open <strong>Resend</strong> dashboard.</li>
                  <li className="mb-1.5">Verify your sending domain under <strong>Domains</strong> if required.</li>
                  <li className="mb-1.5">Create an <strong>API Key</strong> under API Keys section.</li>
                  <li className="mb-1.5">Ensure SMTP Host is set to <code className="bg-white px-1.5 py-0.5 rounded">smtp.resend.com</code> and Port is <code className="bg-white px-1.5 py-0.5 rounded">587</code>.</li>
                  <li className="mb-1.5">Keep SMTP Username as <code className="bg-white px-1.5 py-0.5 rounded">resend</code> and paste your API Key (<code className="bg-white px-1.5 py-0.5 rounded">re_...</code>) into the <strong>API Key / Password</strong> field.</li>
                  <li className="mb-1.5">Configure your verified domain email address as <strong>Sender Email</strong>.</li>
                  <li className="mb-1.5">Click <strong>Save Settings</strong> to save your configuration.</li>
                  <li className="mb-1.5">Click <strong>Test Connection</strong> to verify delivery and send a real test email.</li>
                </ol>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default IntegrationsSettings;

