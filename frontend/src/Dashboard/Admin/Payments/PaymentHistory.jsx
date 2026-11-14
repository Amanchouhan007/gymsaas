import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Spinner, Modal, Pagination, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaUndo, FaFileInvoice, FaCoins, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../Api/axiosInstance';
import { formatAppCurrency, formatAppDate } from '../../../utils/formatters';

const PaymentHistory = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, statusFilter, providerFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/payments/transactions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
          status: statusFilter,
          provider: providerFilter
        }
      });

      if (res.data?.success) {
        setTransactions(res.data.data || []);
        if (res.data.pagination) {
          setPagination(prev => ({ ...prev, ...res.data.pagination }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch transactions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleExecuteRefund = async () => {
    if (!selectedTxn) return;
    setRefundLoading(true);
    try {
      const res = await axiosInstance.post('/payments/refund', {
        transactionId: selectedTxn.transactionId,
        amount: selectedTxn.amount,
        reason: refundReason
      });

      if (res.data?.success) {
        setAlertMsg({ type: 'success', text: `Refund of ${formatAppCurrency(selectedTxn.amount)} completed successfully!` });
        setShowRefundModal(false);
        fetchTransactions();
      } else {
        throw new Error(res.data?.message || 'Refund failed');
      }
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Refund failed' });
    } finally {
      setRefundLoading(false);
      setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'successful':
        return <Badge bg="success">Successful</Badge>;
      case 'pending':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      case 'refunded':
        return <Badge bg="secondary">Refunded</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  // Metrics summary
  const totalRev = transactions.reduce((acc, t) => t.status === 'Successful' ? acc + Number(t.amount) : acc, 0);
  const successCount = transactions.filter(t => t.status === 'Successful').length;
  const pendingCount = transactions.filter(t => t.status === 'Pending').length;
  const failedCount = transactions.filter(t => t.status === 'Failed').length;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Payment Transactions & History</h3>
          <p className="text-muted small">View all system transactions, providers, status, and manage refunds</p>
        </div>
      </div>

      {alertMsg.text && <Alert variant={alertMsg.type} dismissible onClose={() => setAlertMsg({ type: '', text: '' })}>{alertMsg.text}</Alert>}

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <Card className="border-0 shadow-sm p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <FaCoins className="fs-4" />
              </div>
              <div>
                <small className="text-muted d-block">Revenue</small>
                <h4 className="fw-bold mb-0">{formatAppCurrency(totalRev)}</h4>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-6 col-md-3">
          <Card className="border-0 shadow-sm p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                <FaCheckCircle className="fs-4" />
              </div>
              <div>
                <small className="text-muted d-block">Successful</small>
                <h4 className="fw-bold mb-0">{successCount}</h4>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-6 col-md-3">
          <Card className="border-0 shadow-sm p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3">
                <FaClock className="fs-4" />
              </div>
              <div>
                <small className="text-muted d-block">Pending</small>
                <h4 className="fw-bold mb-0">{pendingCount}</h4>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-6 col-md-3">
          <Card className="border-0 shadow-sm p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
                <FaTimesCircle className="fs-4" />
              </div>
              <div>
                <small className="text-muted d-block">Failed</small>
                <h4 className="fw-bold mb-0">{failedCount}</h4>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Form onSubmit={handleSearchSubmit} className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <Form.Control
                  placeholder="Search Txn ID / Order ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border-start-0"
                />
              </div>
            </div>

            <div className="col-md-3">
              <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Successful">Successful</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </Form.Select>
            </div>

            <div className="col-md-3">
              <Form.Select value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
                <option value="">All Providers</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="STRIPE">Stripe</option>
                <option value="PAYPAL">PayPal</option>
                <option value="PAYU">PayU</option>
              </Form.Select>
            </div>

            <div className="col-md-2">
              <Button type="submit" variant="primary" className="w-100 fw-bold">
                Filter
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-5 text-muted">No transactions found</div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Provider</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td>{formatAppDate(txn.createdAt)}</td>
                    <td className="fw-semibold">{txn.transactionId}</td>
                    <td>
                      <Badge bg="dark">{txn.provider}</Badge>
                    </td>
                    <td><small>{txn.paymentMethod || 'CREDIT_CARD'}</small></td>
                    <td className="fw-bold">{formatAppCurrency(txn.amount)}</td>
                    <td>{getStatusBadge(txn.status)}</td>
                    <td>
                      {txn.status === 'Successful' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => { setSelectedTxn(txn); setShowRefundModal(true); }}
                        >
                          <FaUndo className="me-1" /> Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Process Refund</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to refund transaction <strong>{selectedTxn?.transactionId}</strong> for <strong>{formatAppCurrency(selectedTxn?.amount)}</strong>?</p>
          <Form.Group className="mb-3">
            <Form.Label>Refund Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleExecuteRefund} disabled={refundLoading}>
            {refundLoading ? <Spinner animation="border" size="sm" /> : 'Confirm Refund'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaymentHistory;
