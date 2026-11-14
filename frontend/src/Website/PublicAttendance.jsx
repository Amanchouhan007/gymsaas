import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarCheck, FaDumbbell, FaUserCheck, FaUserTie, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import axiosInstance from '../Api/axiosInstance';

const PublicAttendance = () => {
  const [searchParams] = useSearchParams();
  const adminId = searchParams.get('adminId');
  const branchId = searchParams.get('branchId');

  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAttendance = async (actionType) => {
    if (!identifier || identifier.length < 5) {
      setMessage({ type: 'danger', text: 'Please enter a valid phone number or email.' });
      return;
    }
    
    if (!adminId) {
      setMessage({ type: 'danger', text: 'Invalid QR Code. Admin ID missing.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Endpoint depends on role and action
      const endpoint = `attendance/public/${role.toLowerCase()}/${actionType}`;
      
      const response = await axiosInstance.post(endpoint, {
        identifier,
        adminId,
        branchId
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully ${actionType === 'checkin' ? 'Checked In' : 'Checked Out'}!` 
        });
        setIdentifier(''); // Reset identifier
      } else {
        setMessage({ type: 'danger', text: response.data.message || 'Action failed.' });
      }
    } catch (error) {
      console.error("Attendance Error:", error);
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, #1c1917 0%, #0c0a09 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Container className="d-flex flex-column align-items-center justify-content-center" style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
        
        {/* BRAND LOGO HEADER */}
        <div className="text-center mb-4 d-flex align-items-center justify-content-center gap-2">
          <FaDumbbell style={{ color: '#ea580c', fontSize: '2rem' }} />
          <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>
            GYM <span style={{ color: '#ea580c' }}>MANAGEMENT</span>
          </span>
        </div>

        {/* MAIN ATTENDANCE CARD */}
        <Card className="border-0 shadow-lg" style={{
          width: '100%',
          background: 'rgba(24, 24, 27, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(234, 88, 12, 0.15)',
          overflow: 'hidden'
        }}>
          {/* CARD HEADER */}
          <div className="text-center py-4 px-3" style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff'
          }}>
            <FaCalendarCheck size={36} className="mb-2" />
            <h4 className="fw-bold mb-1" style={{ fontSize: '1.4rem', letterSpacing: '0.5px' }}>Gym Check-in</h4>
            <p className="mb-0 small text-white-50">Mark your attendance instantly</p>
          </div>
          
          <Card.Body className="p-4">
            {message.text && (
              <Alert 
                variant={message.type} 
                className="text-center py-2 border-0 fw-semibold"
                style={{
                  borderRadius: '10px',
                  backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`
                }}
              >
                {message.text}
              </Alert>
            )}

            <Form onSubmit={(e) => e.preventDefault()}>
              {/* ROLE SELECTION TABS */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-uppercase mb-2" style={{ fontSize: '0.78rem', color: '#a1a1aa', letterSpacing: '0.05em' }}>
                  I am a
                </Form.Label>
                
                <div className="d-flex p-1 rounded-3" style={{ background: '#18181b', border: '1px solid #3f3f46' }}>
                  <button
                    type="button"
                    className="btn w-50 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: role === 'Member' ? '#ea580c' : 'transparent',
                      color: role === 'Member' ? '#ffffff' : '#a1a1aa',
                      border: 'none',
                      boxShadow: role === 'Member' ? '0 4px 12px rgba(234, 88, 12, 0.35)' : 'none'
                    }}
                    onClick={() => setRole('Member')}
                  >
                    <FaUserCheck size={14} /> Member
                  </button>
                  <button
                    type="button"
                    className="btn w-50 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      backgroundColor: role === 'Staff' ? '#ea580c' : 'transparent',
                      color: role === 'Staff' ? '#ffffff' : '#a1a1aa',
                      border: 'none',
                      boxShadow: role === 'Staff' ? '0 4px 12px rgba(234, 88, 12, 0.35)' : 'none'
                    }}
                    onClick={() => setRole('Staff')}
                  >
                    <FaUserTie size={14} /> Staff
                  </button>
                </div>
              </Form.Group>

              {/* PHONE / EMAIL INPUT */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-uppercase mb-2" style={{ fontSize: '0.78rem', color: '#a1a1aa', letterSpacing: '0.05em' }}>
                  Phone Number or Email
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter registered phone or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="py-2.5 px-3"
                  style={{
                    fontSize: '1rem',
                    backgroundColor: '#18181b',
                    color: '#ffffff',
                    border: '1px solid #3f3f46',
                    borderRadius: '10px',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ea580c')}
                  onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
                />
              </Form.Group>

              {/* CHECK IN & CHECK OUT BUTTONS */}
              <div className="d-flex gap-3 pt-2">
                <Button 
                  className="w-50 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleAttendance('checkin')}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : <><FaSignInAlt /> Check In</>}
                </Button>

                <Button 
                  className="w-50 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: 'rgba(234, 88, 12, 0.08)',
                    border: '1.5px solid #ea580c',
                    borderRadius: '10px',
                    color: '#f97316',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleAttendance('checkout')}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : <><FaSignOutAlt /> Check Out</>}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* FOOTER NOTE */}
        <div className="text-center mt-4">
          <small style={{ color: '#71717a', fontSize: '0.78rem' }}>
            Powered by <strong style={{ color: '#ea580c' }}>Gym SaaS Management System</strong>
          </small>
        </div>
      </Container>
    </div>
  );
};

export default PublicAttendance;
