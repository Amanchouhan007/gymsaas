import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../Api/axiosInstance';
import { FaDownload, FaCalendarAlt, FaClock, FaUser, FaPhone } from 'react-icons/fa';
import { useSocket } from '../../../Context/SocketContext';
import { exportToPDF } from '../../../utils/exportUtils';
import { useTranslation } from 'react-i18next';

const BookingDetailsList = ({ type }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(type || 'classes');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async (type) => {
    try {
      setLoading(true);
      setError(null);
      
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error("User not found");
      
      const role = user.roleName || user.role || '';
      const isAdminOrSuper = role === 'Admin' || role === 'Superadmin' || role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'SUPERADMIN';
      
      const adminId = isAdminOrSuper ? user.id : user.adminId;
      const isTrainer = !isAdminOrSuper;
      
      let endpoint = `booking/admin-details/${adminId}`;
      if (isTrainer) {
        endpoint += `/${user.id}`;
      }
      
      const response = await axiosInstance.get(`${endpoint}?type=${type}`);
      console.log("FETCH BOOKINGS RESPONSE:", response.data);
      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error("FETCH BOOKINGS ERROR:", err);
      setError(t('booking.errorLoading', 'Error loading booking details.'));
    } finally {
      setLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;
    
    const handleRefresh = () => {
      console.log("Socket event received in BookingDetailsList, refreshing bookings...");
      fetchBookings(activeTab);
    };

    socket.on("bookingCreated", handleRefresh);
    socket.on("bookingUpdated", handleRefresh);
    socket.on("bookingCancelled", handleRefresh);

    return () => {
      socket.off("bookingCreated", handleRefresh);
      socket.off("bookingUpdated", handleRefresh);
      socket.off("bookingCancelled", handleRefresh);
    };
  }, [socket, activeTab]);

  const exportToCSV = () => {
    if (bookings.length === 0) return;
    
    const headers = ['Name', 'Phone', 'Email', activeTab === 'classes' ? 'Class Name' : 'Session Name', 'Date', 'Start Time', 'End Time', 'Status', 'Booking Date'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of bookings) {
      const values = [
        `"${row.memberName || ''}"`,
        `"${row.memberPhone || ''}"`,
        `"${row.memberEmail || ''}"`,
        `"${activeTab === 'classes' ? row.class_name || '' : row.sessionName || ''}"`,
        `"${new Date(row.date).toLocaleDateString()}"`,
        `"${row.startTime || ''}"`,
        `"${row.endTime || ''}"`,
        `"${row.bookingStatus || ''}"`,
        `"${new Date(row.createdAt).toLocaleDateString()}"`
      ];
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${activeTab}_bookings_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPDFFn = () => {
    if (bookings.length === 0) return;
    
    const header = ['Name', 'Phone', 'Email', activeTab === 'classes' ? 'Class Name' : 'Session Name', 'Date', 'Start Time', 'End Time', 'Status', 'Booking Date'];
    const rows = bookings.map(row => [
      row.memberName || '',
      row.memberPhone || '',
      row.memberEmail || '',
      activeTab === 'classes' ? row.class_name || '' : row.sessionName || '',
      new Date(row.date).toLocaleDateString(),
      row.startTime || '',
      row.endTime || '',
      row.bookingStatus || '',
      new Date(row.createdAt).toLocaleDateString()
    ]);
    exportToPDF(
      rows,
      header,
      `${activeTab === 'classes' ? 'Class' : 'Session'} Bookings Report`,
      `${activeTab}_bookings_${new Date().toLocaleDateString()}`
    );
  };

  return (
    <div className="mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#ea580c' }}>{t('booking.bookingDetails', 'Booking Details')}</h4>
          <p className="text-muted mb-0">{t('booking.manageSubtitle', 'Manage and view all members joined for classes and sessions')}</p>
        </div>
        <div className="dropdown">
          <button
            className="btn text-white dropdown-toggle d-flex align-items-center gap-2 fw-semibold"
            type="button"
            id="exportBookingDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            disabled={bookings.length === 0}
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none', borderRadius: '8px', height: '40px' }}
          >
            <FaDownload /> {t('common.export', 'Export')}
          </button>
          <ul className="dropdown-menu shadow-sm border-0" aria-labelledby="exportBookingDropdown">
            <li>
              <button className="dropdown-item text-success fw-medium" onClick={exportToCSV}>
                <strong>CSV</strong> {t('common.exportCsv', 'Export to CSV')}
              </button>
            </li>
            <li>
              <button className="dropdown-item text-danger fw-medium" onClick={exportToPDFFn}>
                <strong>PDF</strong> {t('common.exportPdf', 'Export to PDF')}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {!type && (
        <div className="d-flex gap-3 mb-4">
          <button 
            className="btn px-4 py-2 fw-medium"
            onClick={() => setActiveTab('classes')}
            style={
              activeTab === 'classes' 
                ? { backgroundColor: '#2f6a87', color: 'white', borderRadius: '8px', border: 'none' } 
                : { backgroundColor: 'white', color: '#2f6a87', borderRadius: '8px', border: '1px solid #dee2e6' }
            }
          >
            {t('booking.classBookings', 'Class Bookings')}
          </button>
          <button 
            className="btn px-4 py-2 fw-medium"
            onClick={() => setActiveTab('sessions')}
            style={
              activeTab === 'sessions' 
                ? { backgroundColor: '#2f6a87', color: 'white', borderRadius: '8px', border: 'none' } 
                : { backgroundColor: 'white', color: '#2f6a87', borderRadius: '8px', border: '1px solid #dee2e6' }
            }
          >
            {t('booking.sessionBookings', 'Session Bookings')}
          </button>
        </div>
      )}

      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              {t('booking.noBookingsFound', 'No bookings found for {{type}}', { type: activeTab === 'classes' ? t('booking.classes', 'classes') : t('booking.sessions', 'sessions') })}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">{t('booking.memberInfo', 'MEMBER INFO')}</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">{activeTab === 'classes' ? t('booking.class', 'CLASS') : t('booking.session', 'SESSION')}</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">{t('booking.schedule', 'SCHEDULE')}</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">{t('booking.status', 'STATUS')}</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">{t('booking.bookedOn', 'BOOKED ON')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-3 text-primary d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                            <FaUser />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{booking.memberName}</h6>
                            <small className="text-muted d-flex align-items-center gap-1">
                              <FaPhone size={10} /> {booking.memberPhone}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="fw-medium text-dark">
                          {activeTab === 'classes' ? booking.class_name : booking.sessionName}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span className="d-flex align-items-center gap-1 text-dark" style={{ fontSize: '0.9rem' }}>
                            <FaCalendarAlt size={12} className="text-muted" /> {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.85rem' }}>
                            <FaClock size={12} /> {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${booking.bookingStatus === 'Booked' ? 'bg-success' : booking.bookingStatus === 'Cancelled' ? 'bg-danger' : 'bg-primary'}`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 text-muted" style={{ fontSize: '0.9rem' }}>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsList;
