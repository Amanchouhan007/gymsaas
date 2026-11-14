import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Modal, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaShieldAlt, FaKey, FaCreditCard, FaGlobe, FaMobileAlt, FaWallet } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../Api/axiosInstance';

const PaymentGatewaysSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [gateways, setGateways] = useState({
    RAZORPAY: { isEnabled: false, isTestMode: true, keyId: '', webhookSecret: '', configured: false },
    CASHFREE: { isEnabled: false, isTestMode: true, keyId: '', webhookSecret: '', configured: false },
    PAYU: { isEnabled: false, isTestMode: true, keyId: '', merchantSalt: '', configured: false },
    PHONEPE: { isEnabled: false, isTestMode: true, keyId: '', webhookSecret: '', configured: false },
    STRIPE: { isEnabled: false, isTestMode: true, keyId: '', webhookSecret: '', configured: false },
    PAYPAL: { isEnabled: false, isTestMode: true, keyId: '', webhookSecret: '', configured: false }
  });

  // Modal State
  const [activeProvider, setActiveProvider] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formData, setFormData] = useState({
    isEnabled: false,
    isTestMode: true,
    keyId: '',
    secretKey: '',
    webhookSecret: '',
    merchantSalt: ''
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/payments/admin/gateways');
      if (res.data?.success && res.data?.data) {
        setGateways(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch gateway configs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfigure = (providerKey) => {
    const gw = gateways[providerKey] || { isEnabled: false, isTestMode: true, keyId: '' };
    setActiveProvider(providerKey);
    setFormData({
      isEnabled: gw.isEnabled,
      isTestMode: gw.isTestMode,
      keyId: gw.keyId || '',
      secretKey: '',
      webhookSecret: '',
      merchantSalt: ''
    });
    setShowConfigModal(true);
  };

  const handleToggleEnable = async (providerKey, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const gw = gateways[providerKey] || {};
      await axiosInstance.put('/payments/admin/gateways', {
        provider: providerKey,
        isEnabled: newStatus,
        isTestMode: gw.isTestMode,
        keyId: gw.keyId
      });

      setGateways(prev => ({
        ...prev,
        [providerKey]: { ...prev[providerKey], isEnabled: newStatus }
      }));
      setSuccess(`${providerKey} gateway status updated`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update gateway status');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axiosInstance.put('/payments/admin/gateways', {
        provider: activeProvider,
        ...formData
      });

      setSuccess(`${activeProvider} configuration saved successfully!`);
      setShowConfigModal(false);
      fetchGateways();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const gatewayList = [
    {
      key: 'RAZORPAY',
      name: 'Razorpay',
      color: '#02042b',
      icon: <FaShieldAlt className="text-primary fs-4" />,
      description: 'Cards, UPI, NetBanking, and Google Pay supported.'
    },
    {
      key: 'CASHFREE',
      name: 'Cashfree',
      color: '#0052cc',
      icon: <FaCreditCard className="text-info fs-4" />,
      description: 'Cards, UPI, NetBanking, PayLater, and Auto Collect supported.'
    },
    {
      key: 'PAYU',
      name: 'PayU',
      color: '#4fa83f',
      icon: <FaWallet className="text-success fs-4" />,
      description: 'Cards, UPI, NetBanking, and EMI options supported.'
    },
    {
      key: 'PHONEPE',
      name: 'PhonePe',
      color: '#5f259f',
      icon: <FaMobileAlt className="text-purple fs-4" style={{ color: '#5f259f' }} />,
      description: 'PhonePe UPI, Cards, NetBanking, and QR payments supported.'
    },
    {
      key: 'STRIPE',
      name: 'Stripe',
      color: '#635bfc',
      icon: <FaGlobe className="text-primary fs-4" />,
      description: 'Global Credit Cards, Apple Pay, Google Pay, and SEPA supported.'
    },
    {
      key: 'PAYPAL',
      name: 'PayPal',
      color: '#003087',
      icon: <FaShieldAlt className="text-warning fs-4" />,
      description: 'International Credit/Debit Cards & PayPal Wallet supported.'
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading Payment Gateways...</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FaShieldAlt className="text-primary" />
            <span>{t('settings.gatewaysTitle', 'Payment Gateways & Methods')}</span>
          </h4>
          <p className="text-muted small mb-0">
            {t('settings.gatewaysHelp', 'Configure secure payment providers for SaaS subscription collection')}
          </p>
        </div>
      </div>

      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <div className="row g-4">
        {gatewayList.map(gw => {
          const config = gateways[gw.key] || { isEnabled: false, isTestMode: true, configured: false };
          return (
            <div className="col-md-6 col-lg-4" key={gw.key}>
              <Card className="h-100 shadow-sm border-0 rounded-4">
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        {gw.icon}
                        <h5 className="fw-bold mb-0">{gw.name}</h5>
                      </div>
                      <Form.Check
                        type="switch"
                        id={`${gw.key}-switch`}
                        checked={config.isEnabled}
                        onChange={() => handleToggleEnable(gw.key, config.isEnabled)}
                      />
                    </div>
                    <div className="mb-3">
                      <Badge bg={config.configured ? "success" : "secondary"} className="me-2">
                        {config.configured ? t('settings.connected', 'Connected') : t('settings.notConnected', 'Not Connected')}
                      </Badge>
                      <Badge bg={config.isTestMode ? "warning" : "info"}>
                        {config.isTestMode 
                          ? (gw.key === 'PAYPAL' || gw.key === 'CASHFREE' ? t('settings.sandboxMode', 'SANDBOX MODE') : t('settings.testMode', 'TEST MODE')) 
                          : t('settings.liveMode', 'LIVE MODE')}
                      </Badge>
                    </div>
                    <small className="text-muted d-block mb-3">
                      {gw.description}
                    </small>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100 fw-bold rounded-pill mt-2"
                    onClick={() => handleOpenConfigure(gw.key)}
                  >
                    <FaKey className="me-1" /> {t('settings.configure', 'Configure')}
                  </Button>
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} centered>
        <Form onSubmit={handleSaveConfig}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">
              {t('settings.configureProvider', 'Configure {{provider}}', { provider: activeProvider })}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                label={t('settings.enableProvider', 'Enable {{provider}}', { provider: activeProvider })}
                checked={formData.isEnabled}
                onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                label={
                  activeProvider === 'PAYPAL' || activeProvider === 'CASHFREE' 
                    ? t('settings.useSandboxMode', 'Use Sandbox Mode') 
                    : activeProvider === 'PHONEPE'
                    ? t('settings.useUatMode', 'Use UAT Test Mode')
                    : t('settings.useTestMode', 'Use Test Mode')
                }
                checked={formData.isTestMode}
                onChange={e => setFormData({ ...formData, isTestMode: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                {activeProvider === 'STRIPE' 
                  ? t('settings.publishableKey', 'Publishable Key') 
                  : activeProvider === 'PAYPAL' 
                  ? t('settings.clientId', 'Client ID') 
                  : activeProvider === 'PAYU' 
                  ? t('settings.merchantKey', 'Merchant Key') 
                  : activeProvider === 'PHONEPE'
                  ? t('settings.merchantId', 'Merchant ID')
                  : activeProvider === 'CASHFREE'
                  ? t('settings.appId', 'App ID / Client ID')
                  : t('settings.keyId', 'Key ID')}
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.keyId}
                onChange={e => setFormData({ ...formData, keyId: e.target.value })}
                placeholder={
                  activeProvider === 'STRIPE'
                    ? 'pk_live_...'
                    : activeProvider === 'PHONEPE'
                    ? 'PGTESTPAYUAT...'
                    : activeProvider === 'CASHFREE'
                    ? 'CF...'
                    : t('settings.enterKeyId', 'Enter Key ID / Client ID')
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                {activeProvider === 'STRIPE' 
                  ? t('settings.secretKey', 'Secret Key') 
                  : activeProvider === 'PAYPAL' 
                  ? t('settings.clientSecret', 'Client Secret') 
                  : activeProvider === 'PHONEPE'
                  ? t('settings.saltKey', 'Salt Key')
                  : t('settings.secretKey', 'Secret Key')}
              </Form.Label>
              <Form.Control
                type="password"
                value={formData.secretKey}
                onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                placeholder={t('settings.enterSecretKey', 'Enter Secret Key (leave blank to keep unchanged)')}
              />
            </Form.Group>

            {activeProvider === 'PAYU' ? (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">{t('settings.merchantSalt', 'Merchant Salt')}</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.merchantSalt}
                  onChange={e => setFormData({ ...formData, merchantSalt: e.target.value })}
                  placeholder={t('settings.enterMerchantSalt', 'Enter Merchant Salt')}
                />
              </Form.Group>
            ) : activeProvider === 'PHONEPE' ? (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">{t('settings.saltIndex', 'Salt Index')}</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.webhookSecret}
                  onChange={e => setFormData({ ...formData, webhookSecret: e.target.value })}
                  placeholder="1"
                />
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">{t('settings.webhookSecret', 'Webhook Secret')}</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.webhookSecret}
                  onChange={e => setFormData({ ...formData, webhookSecret: e.target.value })}
                  placeholder={t('settings.enterWebhookSecret', 'Enter Webhook Secret')}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : t('settings.saveConfig', 'Save Configuration')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentGatewaysSettings;
