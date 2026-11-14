import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, Badge, Card, Container, Row, Col } from "react-bootstrap";
import { FaCheck, FaExclamationTriangle, FaWhatsapp, FaQrcode, FaSync, FaTrashAlt, FaMobileAlt, FaBell, FaShieldAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../Api/axiosInstance";

const WhatsAppIntegrationPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "danger", text: "" }
  const [waNumber, setWaNumber] = useState("");
  const [statusData, setStatusData] = useState({
    status: "DISCONNECTED",
    number: "",
    qr: null,
    connectedAt: null,
    enabled: false,
    lastError: null
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-polling when QR is generated
  useEffect(() => {
    let interval = null;
    if (statusData.status === "QR_READY" || statusData.status === "CONNECTING") {
      interval = setInterval(async () => {
        try {
          const res = await axiosInstance.get("integrations/whatsapp");
          if (res.data?.success && res.data.data) {
            setStatusData(res.data.data);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusData.status]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("integrations/whatsapp");
      if (res.data?.success) {
        setStatusData(res.data.data);
        if (res.data.data.number) {
          setWaNumber(res.data.data.number);
        }
      }
    } catch (err) {
      console.error("Failed to load WhatsApp status", err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const handleConnect = async () => {
    try {
      setUpdating(true);
      const res = await axiosInstance.post("integrations/whatsapp/connect", { number: waNumber });
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchStatus();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmScan = async () => {
    try {
      setUpdating(true);
      const res = await axiosInstance.post("integrations/whatsapp/confirm-scan");
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchStatus();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp?")) return;
    try {
      setUpdating(true);
      const res = await axiosInstance.post("integrations/whatsapp/disconnect");
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchStatus();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-2 text-muted">Loading WhatsApp Integration Status...</p>
      </Container>
    );
  }

  return (
    <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "85vh" }}>
      <Container fluid className="max-w-1200">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-success text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                <FaWhatsapp className="fs-3" />
              </div>
              <div>
                <h3 className="fw-bold mb-0 text-dark">WhatsApp Integration</h3>
                <p className="text-muted small mb-0">Connect your WhatsApp account for instant automated member & admin notifications.</p>
              </div>
            </div>
          </div>

          <Badge
            bg={
              statusData.status === "CONNECTED"
                ? "success"
                : statusData.status === "QR_READY" || statusData.status === "CONNECTING"
                ? "warning"
                : "secondary"
            }
            className="px-3 py-2 rounded-pill fw-bold text-uppercase"
            style={{ fontSize: "13px" }}
          >
            {statusData.status === "CONNECTED"
              ? "🟢 CONNECTED"
              : statusData.status === "QR_READY"
              ? "🟡 SCAN QR CODE"
              : statusData.status === "CONNECTING"
              ? "⏳ CONNECTING..."
              : "🔴 DISCONNECTED"}
          </Badge>
        </div>

        {message && (
          <Alert variant={message.type} className="rounded-3 shadow-sm mb-4">
            {message.type === "success" ? <FaCheck className="me-2" /> : <FaExclamationTriangle className="me-2" />}
            {message.text}
          </Alert>
        )}

        <Row className="g-4">
          {/* MAIN CONNECTION CARD */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm rounded-4 bg-white h-100">
              <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold text-dark mb-1">WhatsApp Web Connection</h5>
                <p className="text-muted small mb-0">Pair your WhatsApp mobile app via QR Code</p>
              </Card.Header>
              <Card.Body className="p-4">
                {statusData.status === "CONNECTED" ? (
                  <div className="text-center py-4">
                    <div className="mb-3">
                      <div className="bg-success-subtle text-success p-3 rounded-circle d-inline-block shadow-sm">
                        <FaCheck className="fs-1" />
                      </div>
                    </div>
                    <h4 className="fw-bold text-success mb-2">WhatsApp Session Connected & Active</h4>
                    <p className="text-muted mb-4">
                      Your business notifications are configured to send directly from this account.
                    </p>

                    <div className="p-3 bg-light rounded-3 d-inline-block text-start mb-4 shadow-sm" style={{ minWidth: "280px" }}>
                      <p className="mb-1 text-secondary small">
                        <strong>Sender Number:</strong> {statusData.number || waNumber || "N/A"}
                      </p>
                      {statusData.connectedAt && (
                        <p className="mb-0 text-secondary small">
                          <strong>Connected At:</strong> {new Date(statusData.connectedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="d-flex justify-content-center gap-3">
                      <Button
                        variant="outline-primary"
                        onClick={handleConnect}
                        disabled={updating}
                        className="fw-bold px-4 rounded-3 d-flex align-items-center gap-2"
                      >
                        <FaSync /> Reconnect
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={handleDisconnect}
                        disabled={updating}
                        className="fw-bold px-4 rounded-3 d-flex align-items-center gap-2"
                      >
                        <FaTrashAlt /> Disconnect WhatsApp
                      </Button>
                    </div>
                  </div>
                ) : statusData.status === "QR_READY" && statusData.qr ? (
                  <div className="text-center py-3">
                    <h5 className="fw-bold mb-2 text-dark">Scan QR Code to Connect</h5>
                    <p className="text-muted small mb-4">
                      Open <strong>WhatsApp Mobile</strong> &rarr; <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong> &rarr; Scan this QR Code:
                    </p>

                    <div className="p-3 bg-white d-inline-block rounded-4 shadow border mb-4">
                      <img src={statusData.qr} alt="WhatsApp Pairing QR Code" style={{ width: "240px", height: "240px", objectFit: "contain" }} />
                    </div>

                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      <Button
                        variant="success"
                        size="lg"
                        className="fw-bold px-4 rounded-3"
                        onClick={handleConfirmScan}
                        disabled={updating}
                      >
                        {updating ? "AUTHENTICATING..." : "I HAVE SCANNED THE QR CODE"}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="lg"
                        className="px-4 rounded-3"
                        onClick={handleConnect}
                        disabled={updating}
                      >
                        Regenerate QR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold text-dark">WhatsApp Mobile Number (with Country Code)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="+919876543210"
                        value={waNumber}
                        onChange={(e) => setWaNumber(e.target.value)}
                        className="form-control-lg bg-light"
                      />
                      <Form.Text className="text-muted">
                        Enter your registered WhatsApp phone number including country code (e.g., +919876543210).
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button
                        variant="success"
                        size="lg"
                        className="fw-bold px-5 rounded-3"
                        onClick={handleConnect}
                        disabled={updating || !waNumber}
                      >
                        {updating ? "GENERATING QR..." : "CONNECT WHATSAPP"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* INFORMATION & NOTIFICATION TYPES CARD */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm rounded-4 bg-white h-100">
              <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold text-dark mb-1">Role-Based Notifications</h5>
                <p className="text-muted small mb-0">Automated WhatsApp message triggers</p>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex gap-3 mb-4">
                  <div className="bg-success-subtle text-success p-3 rounded-3 h-auto d-flex align-items-center">
                    <FaBell className="fs-4" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Member Attendance Alert</h6>
                    <p className="text-muted small mb-0">Sent immediately to member when their attendance is marked present.</p>
                  </div>
                </div>

                <div className="d-flex gap-3 mb-4">
                  <div className="bg-primary-subtle text-primary p-3 rounded-3 h-auto d-flex align-items-center">
                    <FaMobileAlt className="fs-4" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Diet & Workout Plan Updates</h6>
                    <p className="text-muted small mb-0">Alerts member when a new diet plan or workout routine is assigned.</p>
                  </div>
                </div>

                <div className="d-flex gap-3 mb-4">
                  <div className="bg-warning-subtle text-warning p-3 rounded-3 h-auto d-flex align-items-center">
                    <FaShieldAlt className="fs-4" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Membership & Renewal Reminders</h6>
                    <p className="text-muted small mb-0">Notifies members about expiring memberships and renewal invoices.</p>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold mb-1 text-secondary" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>SECURITY & TENANT ISOLATION</h6>
                  <p className="text-muted small mb-0">
                    Your WhatsApp session credentials are stored securely on the backend. Messages are sent exclusively to registered members of your gym.
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default WhatsAppIntegrationPage;
