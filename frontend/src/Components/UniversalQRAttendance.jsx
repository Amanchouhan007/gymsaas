import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaQrcode, FaCheckCircle, FaDumbbell, FaCalendarCheck } from 'react-icons/fa';
import { format } from 'date-fns';
import axiosInstance from '../Api/axiosInstance';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

/**
 * Universal QR Attendance Component
 * Upgraded to match Dark Luxury Website Theme
 */
const UniversalQRAttendance = () => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkinSuccess, setCheckinSuccess] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const html5QrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const lastScannedQRRef = useRef(null);
  const isProcessingQRRef = useRef(false);

  // Generate or get a unique device ID for this browser
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('gymDeviceId');
    if (!deviceId) {
      deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('gymDeviceId', deviceId);
    }
    return deviceId;
  };

  // Get GPS location from browser
  const getGPSLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData.id;
  const branchId = userData.branchId || 1;
  const userRole = localStorage.getItem('userRole')?.toUpperCase() || 'MEMBER';
  const userName = userData.fullName || userData.name || userData.email || 'User';
  
  // State for member's adminId
  const [memberAdminId, setMemberAdminId] = useState(userData.adminId || (userRole === 'ADMIN' || userRole === 'SUPERADMIN' ? userId : null));

  // Fetch member details to get adminId if user is a member
  useEffect(() => {
    const fetchMemberAdminId = async () => {
      if (userId && (userRole === 'MEMBER' || !userRole)) {
        try {
          const actualMemberId = userData.memberId || userId;
          const response = await axiosInstance.get(`members/detail/${actualMemberId}`);
          if (response.data?.success && response.data?.member?.adminId) {
            setMemberAdminId(response.data.member.adminId);
          }
        } catch (err) {
          console.log('Could not fetch member adminId:', err);
        }
      } else if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
        setMemberAdminId(userId);
      }
    };
    
    fetchMemberAdminId();
  }, [userId, userRole]);

  const adminId = memberAdminId || (userRole === 'ADMIN' || userRole === 'SUPERADMIN' ? userId : null);

  // Fetch check-in history on mount
  useEffect(() => {
    if (userId) {
      fetchCheckinHistory();
    }
  }, [userId, branchId]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const fetchCheckinHistory = async () => {
    try {
      setHistoryLoading(true);
      const actualMemberId = userData.memberId || userId;
      const response = await axiosInstance.get(`memberattendence/${actualMemberId}`);
      const data = response.data;

      if (data.success && data.attendance) {
        const allHistory = data.attendance;
        const transformedHistory = allHistory.map(entry => ({
          id: entry.id,
          checkIn: new Date(entry.checkIn),
          checkOut: entry.checkOut ? new Date(entry.checkOut) : null,
          mode: entry.mode,
          status: entry.status,
          notes: entry.notes,
          computedStatus: entry.computedStatus,
          memberId: entry.memberId,
          branchId: entry.branchId
        }));

        setHistory(transformedHistory);
      } else {
        setHistory([]);
      }
    } catch (err) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheckIn = async (mode = 'Manual', notes = 'Manual Check-in', qrAdminId = null) => {
    try {
      setLoading(true);
      setError(null);
      setCheckinSuccess(null);
      
      const { latitude, longitude } = await getGPSLocation();
      const deviceId = getDeviceId();
      
      const response = await axiosInstance.post('memberattendence/checkin', {
        memberId: userData.memberId || userId,
        branchId: branchId,
        mode: mode,
        notes: notes,
        userRole: userRole,
        qrAdminId: qrAdminId || adminId,
        latitude: latitude,
        longitude: longitude,
        deviceId: deviceId
      });
      
      const data = response.data;
      
      if (data.success) {
        setCheckinSuccess('✅ Attendance successful!');
        await fetchCheckinHistory();
        if (isScanning) {
          stopScanner();
        }
      } else {
        setError(data.message || 'Check-in failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error during check-in';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setCheckinSuccess(null), 5000);
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      setLoading(true);
      setError(null);
      setCheckinSuccess(null);
      
      let response;
      try {
        response = await axiosInstance.put(`memberattendence/checkout/${attendanceId}`, {
          memberId: userData.memberId || userId,
          branchId: branchId
        });
      } catch (putErr) {
        response = await axiosInstance.post(`memberattendence/checkout/${attendanceId}`, {
          memberId: userData.memberId || userId,
          branchId: branchId
        });
      }
      
      const data = response.data;
      
      if (data.success) {
        setCheckinSuccess('✅ Check-out successful!');
        await fetchCheckinHistory();
      } else {
        setError(data.message || 'Check-out failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error during check-out';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setCheckinSuccess(null), 5000);
    }
  };

  const processScannedQR = async (decodedText) => {
    if (isProcessingQRRef.current) return;

    const now = Date.now();
    if (lastScannedQRRef.current && 
        lastScannedQRRef.current.text === decodedText && 
        (now - lastScannedQRRef.current.timestamp) < 3000) {
      return;
    }

    isProcessingQRRef.current = true;
    lastScannedQRRef.current = { text: decodedText, timestamp: now };

    try {
      let qrData = null;
      try {
        qrData = JSON.parse(decodedText);
      } catch (e) {
        // If decodedText is a public URL string e.g. https://.../public-attendance?adminId=90&branchId=1
        if (decodedText.includes('adminId=')) {
          const urlObj = new URL(decodedText);
          const parsedAdminId = urlObj.searchParams.get('adminId');
          const parsedBranchId = urlObj.searchParams.get('branchId');
          if (parsedAdminId) {
            qrData = { purpose: 'gym_checkin_global', adminId: parsedAdminId, branchId: parsedBranchId };
          }
        }
      }

      if (!qrData) {
        setScannerError('Invalid QR code format. Please try again.');
        isProcessingQRRef.current = false;
        return;
      }
      
      if (qrData.purpose === 'gym_checkin_global' || qrData.adminId) {
        if (!qrData.adminId) {
          setScannerError('Invalid QR code. Admin ID not found in QR code.');
          isProcessingQRRef.current = false;
          return;
        }
        
        const qrAdminIdInt = parseInt(qrData.adminId);
        const userAdminIdInt = parseInt(adminId);
        
        if (userAdminIdInt && qrAdminIdInt !== userAdminIdInt) {
          setScannerError("This QR code belongs to a different admin. You can only scan your admin's QR code.");
          isProcessingQRRef.current = false;
          return;
        }

        if (qrData.expires_at) {
          const expiresAt = new Date(qrData.expires_at);
          if (new Date() > expiresAt) {
            setScannerError('QR code has expired. Please ask staff for a new QR code.');
            isProcessingQRRef.current = false;
            return;
          }
        }

        setScannerError(null);
        const activeRecord = history.find(entry => !entry.checkOut && entry.computedStatus === 'Active');
        if (activeRecord) {
          await handleCheckOut(activeRecord.id);
        } else {
          await handleCheckIn('QR Code', `Scanned Global QR Code - Admin: ${qrData.adminName || qrData.adminId || 'N/A'}`, qrData.adminId);
        }
        return;
      }

      if (qrData.purpose === 'member_checkin_personal' && qrData.member_id) {
        if (qrData.member_id !== userId) {
          setScannerError('This QR code belongs to a different member.');
          isProcessingQRRef.current = false;
          return;
        }
        setScannerError(null);
        const activeRecord = history.find(entry => !entry.checkOut && entry.computedStatus === 'Active');
        if (activeRecord) {
          await handleCheckOut(activeRecord.id);
        } else {
          await handleCheckIn('QR Code', `Scanned Member Personal QR Code`, qrData.adminId || qrData.admin_id);
        }
        return;
      }

      setScannerError('Invalid QR code. Please scan a valid check-in QR code.');
      isProcessingQRRef.current = false;
      
    } catch (err) {
      setScannerError('Invalid QR code format. Please try again.');
      isProcessingQRRef.current = false;
    }
  };

  const isHttps = window.location.protocol === 'https:';
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const canAccessCamera = isHttps || isDevelopment;

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      return false;
    }
  };

  const waitForElement = (elementId, maxAttempts = 20) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkElement = () => {
        const element = document.getElementById(elementId);
        if (element) {
          resolve(element);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkElement, 100);
        } else {
          reject(new Error(`Element ${elementId} not found`));
        }
      };
      checkElement();
    });
  };

  const startScanner = async () => {
    if (!canAccessCamera && !isDevelopment) {
      setScannerError('⚠️ Camera access requires HTTPS. Please use a secure connection (https://)');
      return;
    }

    try {
      setScannerError(null);
      setIsScanning(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await waitForElement("qr-reader-universal");
      
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          await html5QrCodeRef.current.clear();
        } catch (e) {}
      }

      await requestCameraPermission();

      const html5QrCode = new Html5Qrcode("qr-reader-universal");
      html5QrCodeRef.current = html5QrCode;

      let devices = [];
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (e) {}

      let startSuccess = false;

      if (devices && devices.length > 0) {
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1];

        const camerasToTry = backCamera ? [backCamera, ...devices.filter(d => d.id !== backCamera.id)] : devices;
        
        for (let i = 0; i < camerasToTry.length; i++) {
          try {
            const device = camerasToTry[i];
            await html5QrCode.start(
              device.id,
              { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: false },
              (decodedText) => processScannedQR(decodedText),
              () => {}
            );
            startSuccess = true;
            break;
          } catch (deviceErr) {
            continue;
          }
        }
      }

      if (!startSuccess) {
        try {
          await html5QrCode.start(
            { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: false },
            (decodedText) => processScannedQR(decodedText),
            () => {}
          );
          startSuccess = true;
        } catch (envErr) {}
      }

      if (!startSuccess) {
        try {
          await html5QrCode.start(
            { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: false },
            (decodedText) => processScannedQR(decodedText),
            () => {}
          );
          startSuccess = true;
        } catch (userErr) {}
      }

      if (!startSuccess) {
        throw new Error("Could not access camera");
      }
    } catch (err) {
      let errorMsg = 'Failed to start camera. Please check permissions.';
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        errorMsg = '📱 Camera permission denied. Please allow camera access in browser settings.';
      }
      setScannerError(errorMsg);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setScannerError(null);
    } catch (err) {}
  };

  return (
    <div className="container-fluid p-2 p-md-4" style={{ background: 'radial-gradient(circle at 50% 20%, #1c1917 0%, #0c0a09 100%)', minHeight: '85vh', borderRadius: '16px' }}>
      <Card className="border-0 shadow-lg" style={{ background: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(234, 88, 12, 0.3)', borderRadius: '16px', overflow: 'hidden' }}>
        <Card.Header className="py-3 px-4" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', color: '#ffffff' }}>
          <div className="d-flex align-items-center gap-3">
            <FaDumbbell size={28} />
            <div>
              <h5 className="mb-0 fw-bold" style={{ fontSize: '1.25rem', letterSpacing: '0.5px' }}>{t('qrAttendance.gymCheckin', 'Gym Check-in')}</h5>
              <small className="text-white-50">{t('qrAttendance.scanSubtitle', 'Scan the QR code displayed at the gym entrance')}</small>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-3 p-md-4">
          {!isHttps && !isDevelopment && (
            <Alert variant="danger" className="mb-4 border-0" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '10px' }}>
              <h6 className="fw-bold mb-1">🔒 {t('qrAttendance.secureConnectionRequired', 'Secure Connection Required')}</h6>
              <p className="mb-0 small">{t('qrAttendance.cameraHttpsHelp', 'Camera access requires HTTPS. Please use https:// to enable camera access.')}</p>
            </Alert>
          )}

          {/* Instructions Card */}
          <div className="p-3.5 mb-4 rounded-3" style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#1e293b' }}>
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: '#c2410c', fontSize: '1rem' }}>
              <FaCheckCircle style={{ color: '#ea580c' }} />
              {t('qrAttendance.howToCheckin', 'How to Check In')}
            </h6>
            <ol className="mb-0 ps-3 small fw-medium" style={{ color: '#334155', lineHeight: '1.6' }}>
              <li className="mb-1">{t('qrAttendance.step1', 'Look for the QR code displayed at the gym entrance/reception')}</li>
              <li className="mb-1">{t('qrAttendance.step2', 'Click "Scan Gym QR Code" button below')}</li>
              <li className="mb-1">{t('qrAttendance.step3', "Point your camera at the gym's QR code")}</li>
              <li>{t('qrAttendance.step4', 'You will be automatically checked in once the QR code is scanned')}</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="text-center mb-4">
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
              <Button 
                size="lg"
                onClick={isScanning ? stopScanner : startScanner}
                disabled={loading}
                className="px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{
                  background: isScanning ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  color: '#fff'
                }}
              >
                {isScanning ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    {t('qrAttendance.stopScanner', 'Stop Scanner')}
                  </>
                ) : (
                  <>
                    <FaQrcode />
                    {t('qrAttendance.scanGymQr', 'Scan Gym QR Code')}
                  </>
                )}
              </Button>

              {(() => {
                const activeRecord = history.find(entry => !entry.checkOut && entry.computedStatus === 'Active');
                return (
                  <Button 
                    size="lg"
                    onClick={() => activeRecord ? handleCheckOut(activeRecord.id) : handleCheckIn()}
                    disabled={loading || isScanning}
                    className="px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: activeRecord ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '10px',
                      boxShadow: activeRecord ? '0 4px 14px rgba(2, 132, 199, 0.35)' : '0 4px 14px rgba(194, 65, 12, 0.35)'
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        {t('common.processing', 'Processing...')}
                      </>
                    ) : activeRecord ? (
                      t('qrAttendance.manualCheckout', 'Manual Check-out')
                    ) : (
                      t('qrAttendance.manualCheckin', 'Manual Check-in')
                    )}
                  </Button>
                );
              })()}
            </div>
          </div>

          {/* QR Scanner Box */}
          {isScanning && (
            <div className="mb-4">
              <div className="p-3 rounded-3" style={{ background: '#18181b', border: '1px solid #ea580c' }}>
                <h6 className="mb-3 text-warning fw-bold text-center">
                  <FaQrcode className="me-2" />
                  {t('qrAttendance.scannerActive', 'Scanner Active - Point camera at gym QR code')}
                </h6>
                <div 
                  id="qr-reader-universal" 
                  ref={scannerContainerRef} 
                  style={{ 
                    width: '100%', 
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#09090b',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}
                ></div>
                {scannerError && (
                  <Alert variant="warning" className="mt-3 mb-0 border-0 text-center" dismissible onClose={() => setScannerError(null)} style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                    {scannerError.split('\n').map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {checkinSuccess && (
            <Alert className="mb-3 text-center border-0 fw-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #22c55e', borderRadius: '10px' }}>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <FaCheckCircle size={20} />
                {checkinSuccess}
              </div>
            </Alert>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert className="mb-3 border-0 fw-semibold" dismissible onClose={() => setError(null)} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          {/* Attendance History Table */}
          <div className="mt-4">
            <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>{t('qrAttendance.todayHistory', "Today's Check-in History")}</h6>
            {historyLoading ? (
              <div className="text-center py-3 text-muted">
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">{t('common.loading', 'Loading history...')}</span>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover size="sm" className="align-middle text-white mb-0" style={{ borderColor: '#27272a' }}>
                  <thead style={{ background: '#18181b', color: '#ea580c' }}>
                    <tr>
                      <th className="py-2.5">{t('common.id', 'ID')}</th>
                      <th className="py-2.5">{t('attendance.checkIn', 'Check In')}</th>
                      <th className="py-2.5">{t('attendance.checkOut', 'Check Out')}</th>
                      <th className="py-2.5">{t('common.mode', 'Mode')}</th>
                      <th className="py-2.5">{t('common.status', 'Status')}</th>
                      <th className="py-2.5 text-center">{t('common.actions', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-3">{t('qrAttendance.noHistoryToday', 'No check-in history for today')}</td>
                      </tr>
                    ) : (
                      history.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ color: '#111827', fontWeight: '600' }}>{entry.id}</td>
                          <td style={{ color: '#374151', fontWeight: '500' }}>{format(entry.checkIn, 'MMM dd, yyyy HH:mm:ss')}</td>
                          <td style={{ color: '#374151', fontWeight: '500' }}>
                            {entry.checkOut 
                              ? format(entry.checkOut, 'MMM dd, yyyy HH:mm:ss') 
                              : <span className="text-muted">{t('qrAttendance.stillInGym', 'Still in gym')}</span>}
                          </td>
                          <td>
                            <Badge bg="warning" text="dark" style={{ background: '#f59e0b' }}>{entry.mode}</Badge>
                          </td>
                          <td>
                            {entry.computedStatus === 'Active' ? (
                              <Badge bg="info" style={{ background: '#0284c7' }}>{t('common.active', 'Active')}</Badge>
                            ) : (
                              <Badge bg="success" style={{ background: '#16a34a' }}>{t('common.completed', 'Completed')}</Badge>
                            )}
                          </td>
                          <td className="text-center">
                            {!entry.checkOut && entry.computedStatus === 'Active' ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleCheckOut(entry.id)}
                                disabled={loading}
                                style={{ borderRadius: '6px', fontSize: '0.78rem' }}
                              >
                                {t('attendance.checkOut', 'Check Out')}
                              </Button>
                            ) : (
                              <Badge bg="success" style={{ background: '#16a34a' }}>{t('common.completed', 'Completed')}</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UniversalQRAttendance;