import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { format } from "date-fns";
import { Card, Button, Alert, Badge } from "react-bootstrap";
import { FaQrcode, FaDownload, FaPrint, FaSync } from "react-icons/fa";
import axiosInstance from '../../Api/axiosInstance';
import { useTranslation } from 'react-i18next';

/**
 * AdminGlobalQRCode - Admin creates and manages the global gym QR code
 * This QR code is displayed at the gym entrance for members to scan
 */
const AdminGlobalQRCode = () => {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get user data
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const branchId = userData.branchId || userData.id || 1;
  const branchName = userData.branchName || userData.fullName || 'Gym Branch';
  const adminId = userData.id; // Admin's own ID
  
  // Generate global QR code value as a public web link
  const qrValue = useMemo(() => {
    // Use active site domain so QR opens current website with dark theme
    const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : "https://gym-newss.kiaantechnology.com";
    return `${baseUrl}/public-attendance?adminId=${adminId}&branchId=${branchId}`;
  }, [adminId, branchId]);

  // Generate new QR code function (no longer needs to generate nonce, just placeholder)
  const generateNewQRCode = () => {
    setSuccess('QR code is now static and does not need to be regenerated!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Optional function if save was used elsewhere, left empty to avoid errors
  const saveQRCode = async () => {
    setSuccess('QR code is now static!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Download QR code as image
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `gym-qr-code-${branchId}-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  // Print QR code
  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Gym QR Code - ${branchName}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: Arial, sans-serif;
            }
            h1 { margin-bottom: 20px; }
            .qr-code { margin: 20px 0; }
            .info { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${branchName} - Check-in QR Code</h1>
          <div class="qr-code">
            <img src="${document.getElementById('qr-code-canvas')?.toDataURL('image/png')}" alt="QR Code" style="width: 400px; height: 400px;" />
          </div>
          <div class="info">
            <p><strong>Status:</strong> Static QR Code</p>
            <p>Members can scan this QR code to check in</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container-fluid p-3 p-md-4">
      <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
        <Card.Header className="border-0 px-4 py-3.5 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ background: 'linear-gradient(135deg, #1e1b18 0%, #120e0c 100%)', borderBottom: '3px solid #ea580c' }}>
          <div>
            <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#ffffff', fontSize: '1.25rem' }}>
              <FaQrcode className="me-2" style={{ color: '#ea580c' }} />
              <span style={{ color: '#ffffff', fontWeight: '800' }}>{t("qr.title", "Global Gym Check-in QR Code")}</span>
            </h5>
            <small style={{ color: '#fed7aa', opacity: 0.9 }}>{t("qr.subtitle", "Display this QR code at the gym entrance")}</small>
          </div>
          <div 
            className="px-3 py-1.5 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center justify-content-center"
            style={{ 
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', 
              color: '#ffffff', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.3px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)'
            }}
          >
            {t("qr.staticLink", "Static Link")}
          </div>
        </Card.Header>
        <Card.Body className="p-4 bg-white">
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="rounded-3 shadow-sm border-0">
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="rounded-3 shadow-sm border-0">
              {error}
            </Alert>
          )}

          <div className="row g-4 align-items-start">
            {/* QR Code Display */}
            <div className="col-12 col-md-6 text-center mb-4">
              <div className="bg-white p-3 p-md-4 rounded-4 border shadow-sm d-inline-block mw-100" style={{ borderColor: 'rgba(234, 88, 12, 0.3)', maxWidth: '100%' }}>
                {qrValue ? (
                  <QRCodeCanvas 
                    id="qr-code-canvas"
                    value={qrValue} 
                    size={typeof window !== 'undefined' && window.innerWidth < 450 ? Math.min(220, window.innerWidth - 60) : 260} 
                    level="M"
                    includeMargin={true}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <div style={{ width: '100%', maxWidth: '260px', height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">{t("common.loading", "Loading...")}</span>
                    </div>
                    <p className="text-muted">{t("qr.generating", "Generating QR Code...")}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <h5 className="fw-bold text-dark mb-1">{branchName}</h5>
                <p className="text-muted mb-3">
                  <span className="badge bg-light text-dark border px-3 py-1 fw-semibold">{t("qr.staticEntrance", "Static Entrance QR")}</span>
                </p>
                
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button 
                    className="text-white fw-bold shadow-sm px-3.5 py-2.5 d-inline-flex align-items-center justify-content-center"
                    style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '10px' }} 
                    onClick={generateNewQRCode}
                    disabled={loading}
                  >
                    <FaSync className="me-2" />
                    {t("qr.generateNew", "Generate New Code")}
                  </Button>
                  <Button 
                    variant="outline-success" 
                    className="fw-bold px-3.5 py-2.5 rounded-3 d-inline-flex align-items-center justify-content-center"
                    onClick={downloadQRCode}
                  >
                    <FaDownload className="me-2" />
                    {t("common.download", "Download")}
                  </Button>
                  <Button 
                    className="fw-bold px-3.5 py-2.5 rounded-3 d-inline-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'transparent', color: '#ea580c', borderColor: '#ea580c' }}
                    onClick={printQRCode}
                  >
                    <FaPrint className="me-2" />
                    {t("common.print", "Print")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="col-12 col-md-6">
              <h5 className="fw-bold text-dark mb-3">{t("qr.instructions", "Instructions")}</h5>
              <div className="list-group shadow-sm rounded-3 overflow-hidden border-0">
                <div className="list-group-item p-3 border-bottom">
                  <h6 className="mb-1 fw-bold text-dark">{t("qr.step1Title", "1. Display QR Code")}</h6>
                  <p className="mb-0 text-muted small">
                    {t("qr.step1Desc", "Print or display this QR code at the gym entrance/reception area.")}
                  </p>
                </div>
                <div className="list-group-item p-3 border-bottom">
                  <h6 className="mb-1 fw-bold text-dark">{t("qr.step2Title", "2. Scanning & Attendance")}</h6>
                  <p className="mb-0 text-muted small">
                    {t("qr.step2Desc", "Members or Staff can scan this QR code using their default phone camera. It will open a secure web link where they can enter their registered Phone Number and mark their check-in/out.")}
                  </p>
                </div>
                <div className="list-group-item p-3 border-bottom">
                  <h6 className="mb-1 fw-bold text-dark">{t("qr.step3Title", "3. Static Link")}</h6>
                  <p className="mb-0 text-muted small">
                    {t("qr.step3Desc", "This QR code is static. You can print it once and paste it anywhere in the gym.")}
                  </p>
                </div>
                <div className="list-group-item p-3">
                  <h6 className="mb-1 fw-bold text-dark">{t("qr.step4Title", "4. Secure Connectivity")}</h6>
                  <p className="mb-0 text-muted small">
                    {t("qr.step4Desc", "All check-ins performed via this QR code are securely recorded and will instantly reflect in your Attendance Reports.")}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3.5 bg-light rounded-4 border">
                <h6 className="fw-bold text-dark mb-2">{t("qr.detailsTitle", "QR Code Details")}</h6>
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-secondary fw-semibold">{t("qr.branchId", "Branch ID:")}</td>
                      <td className="fw-bold text-dark">{branchId}</td>
                    </tr>
                    <tr>
                      <td className="text-secondary fw-semibold">{t("qr.branchName", "Branch Name:")}</td>
                      <td className="fw-bold text-dark">{branchName}</td>
                    </tr>
                    <tr>
                      <td className="text-secondary fw-semibold">{t("qr.status", "Status:")}</td>
                      <td>
                        <Badge bg="success" className="px-2.5 py-1">{t("qr.activeStatic", "Active (Static)")}</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminGlobalQRCode;