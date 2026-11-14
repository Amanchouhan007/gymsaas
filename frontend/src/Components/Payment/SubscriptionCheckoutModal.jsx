import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaCreditCard, FaPaypal, FaGoogle, FaApple, FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../Api/axiosInstance';
import { formatAppCurrency } from '../../utils/formatters';
import { isAndroidNativeApp, initiateGooglePlaySubscription, resolvePlayBillingSku } from '../../services/playBillingService';

const SubscriptionCheckoutModal = ({ show, onHide, plan, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Available Gateways & Methods from Backend
  const [availableProviders, setAvailableProviders] = useState(['RAZORPAY', 'STRIPE', 'PAYPAL', 'PAYU']);
  const [availableMethods, setAvailableMethods] = useState(['CREDIT_CARD', 'DEBIT_CARD']);
  
  // Selected state
  const [selectedProvider, setSelectedProvider] = useState('RAZORPAY');
  const [selectedMethod, setSelectedMethod] = useState('CREDIT_CARD');

  // Device Feature Detection
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [isGooglePaySupported, setIsGooglePaySupported] = useState(false);

  useEffect(() => {
    if (show) {
      fetchAvailableMethods();
      checkDeviceCapabilities();
    }
  }, [show]);

  const checkDeviceCapabilities = () => {
    // Check Apple Pay
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
      setIsApplePaySupported(true);
    } else {
      setIsApplePaySupported(false);
    }

    // Check Google Pay / Payment Request API
    if (window.PaymentRequest || window.google?.payments?.api) {
      setIsGooglePaySupported(true);
    } else {
      setIsGooglePaySupported(true); // Default enabled if supported by provider
    }
  };

  const fetchAvailableMethods = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/payments/methods/available');
      if (res.data?.success && res.data?.data) {
        let { providers, methods } = res.data.data;
        if (isAndroidNativeApp()) {
          // Strictly force GOOGLE_PLAY only on Android Native (Google Play Policy compliance)
          providers = ['GOOGLE_PLAY'];
          setSelectedProvider('GOOGLE_PLAY');
          setAvailableProviders(['GOOGLE_PLAY']);
          setAvailableMethods(['GOOGLE_PLAY_BILLING']);
          setSelectedMethod('GOOGLE_PLAY_BILLING');
        } else {
          if (providers && providers.length > 0) {
            setSelectedProvider(providers[0]);
          }
          setAvailableProviders(providers || []);

          if (methods && methods.length > 0) {
            setAvailableMethods(methods);
            setSelectedMethod(methods[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch gateway capabilities, using defaults:", err.message);
      if (isAndroidNativeApp()) {
        // Fallback strictly exposes only GOOGLE_PLAY on Android Native
        setAvailableProviders(['GOOGLE_PLAY']);
        setSelectedProvider('GOOGLE_PLAY');
        setAvailableMethods(['GOOGLE_PLAY_BILLING']);
        setSelectedMethod('GOOGLE_PLAY_BILLING');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    setProcessing(true);
    setError('');
    setStatusMessage('Creating Payment Order...');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const amount = plan?.price || 999;
      const currency = plan?.currency || 'INR';

      // Strictly force Google Play Billing on Android Native or when GOOGLE_PLAY is selected
      if (isAndroidNativeApp() || selectedProvider === 'GOOGLE_PLAY') {
        setStatusMessage('Opening Google Play Billing...');
        const { productId, basePlanId } = resolvePlayBillingSku(plan?.name, plan?.duration);

        const playRes = await initiateGooglePlaySubscription({
          productId,
          basePlanId,
          planName: plan?.name || 'Pro Plan',
          billingDuration: plan?.duration || 'Monthly',
          email: user?.email,
          companyName: user?.fullName || 'Gym Owner',
          adminName: user?.fullName || 'Gym Owner',
          phone: user?.phone
        });

        if (playRes.status === 'PENDING') {
          setStatusMessage('Payment is pending with Google Play.');
          setError(playRes.message || 'Payment is pending with Google Play.');
          setProcessing(false);
        } else {
          setSuccess(true);
          setStatusMessage('Google Play Subscription Activated! ✓');
          setTimeout(() => {
            if (onSuccess) onSuccess(playRes);
            onHide();
          }, 1800);
        }
        return;
      }

      // 1. Create Backend Order
      const res = await axiosInstance.post('/payments/create-order', {
        provider: selectedProvider,
        paymentMethod: selectedMethod,
        planId: plan?.id || 1,
        amount,
        currency,
        planDetails: { name: plan?.name || 'Pro Plan', id: plan?.id || 1 },
        userDetails: { name: user.fullName || 'Admin', email: user.email || 'admin@gym.com', id: user.id }
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      const orderData = res.data.data;

      // 2. Dispatch Provider SDK / Flow
      if (selectedProvider === 'RAZORPAY') {
        openRazorpayCheckout(orderData);
      } else if (selectedProvider === 'STRIPE') {
        processStripeCheckout(orderData);
      } else if (selectedProvider === 'PAYPAL') {
        processPayPalCheckout(orderData);
      } else if (selectedProvider === 'PAYU') {
        processPayUCheckout(orderData);
      } else {
        throw new Error('Selected payment provider is not configured properly');
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.response?.data?.message || err.message || 'Payment processing failed');
      setProcessing(false);
    }
  };

  // 🔹 Razorpay Checkout Modal
  const openRazorpayCheckout = (orderData) => {
    setStatusMessage('Opening Secure Razorpay Checkout...');

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Gym SaaS Subscription",
      description: plan?.name || "Monthly Subscription",
      order_id: orderData.providerOrderId,
      handler: async (response) => {
        setStatusMessage('Verifying Payment with Server...');
        await verifyServerPayment('RAZORPAY', {
          transactionId: orderData.transactionId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          setStatusMessage('');
        }
      },
      prefill: {
        name: JSON.parse(localStorage.getItem('user') || '{}').fullName || '',
        email: JSON.parse(localStorage.getItem('user') || '{}').email || ''
      },
      theme: { color: "#ea580c" }
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Dynamically load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        setError('Failed to load Razorpay SDK. Please check your network.');
        setProcessing(false);
      };
      document.body.appendChild(script);
    }
  };

  // 🔹 Stripe Direct Verification Check
  const processStripeCheckout = async (orderData) => {
    setStatusMessage('Processing Stripe Payment...');
    setTimeout(async () => {
      setStatusMessage('Verifying Stripe Payment with Server...');
      await verifyServerPayment('STRIPE', {
        transactionId: orderData.transactionId,
        paymentIntentId: orderData.providerOrderId
      });
    }, 1500);
  };

  // 🔹 PayPal Order Flow
  const processPayPalCheckout = async (orderData) => {
    if (orderData.approvalUrl) {
      window.location.href = orderData.approvalUrl;
      return;
    }

    setStatusMessage('Capturing PayPal Payment...');
    setTimeout(async () => {
      await verifyServerPayment('PAYPAL', {
        transactionId: orderData.transactionId,
        paypalOrderId: orderData.providerOrderId
      });
    }, 1500);
  };

  // 🔹 PayU Form Redirection
  const processPayUCheckout = (orderData) => {
    setStatusMessage('Redirecting to PayU Secure Payment Gateway...');
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = orderData.actionUrl;

    const fields = {
      key: orderData.merchantKey,
      txnid: orderData.txnid,
      amount: orderData.amount,
      productinfo: orderData.productinfo,
      firstname: orderData.firstname,
      email: orderData.email,
      udf1: orderData.udf1,
      hash: orderData.hash,
      surl: orderData.surl,
      furl: orderData.furl
    };

    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v || '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  // 🔹 Server-Side Signature Verification
  const verifyServerPayment = async (provider, payload) => {
    try {
      const res = await axiosInstance.post('/payments/verify', {
        provider,
        payload
      });

      if (res.data?.success) {
        setSuccess(true);
        setStatusMessage('Payment Verified & Subscription Activated! ✓');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.data);
          onHide();
        }, 1800);
      } else {
        throw new Error(res.data?.message || 'Server-side payment verification failed');
      }
    } catch (err) {
      console.error("Server verification error:", err);
      setError(err.response?.data?.message || err.message || 'Payment verification failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal show={show} onHide={processing ? null : onHide} centered size="lg">
      <Modal.Header closeButton={!processing} className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <FaShieldAlt className="text-primary" />
          <span>Checkout & Upgrade Subscription</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Checking available payment gateways...</p>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <FaCheckCircle className="text-success display-3 mb-3" />
            <h4 className="fw-bold text-success">Payment Successful!</h4>
            <p className="text-muted">{statusMessage}</p>
          </div>
        ) : (
          <div>
            {/* Selected Plan Summary */}
            <div className="card bg-light border-0 p-3 mb-4 rounded-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg="primary" className="mb-1">Selected Plan</Badge>
                  <h5 className="fw-bold mb-0">{plan?.name || 'Pro Plan'}</h5>
                  <small className="text-muted">Full access to all Gym SaaS features for {plan?.duration === 'Yearly' ? '365 days' : plan?.duration === 'Quarterly' ? '90 days' : '30 days'}</small>
                </div>
                <div className="text-end">
                  <h3 className="fw-bold text-primary mb-0">{formatAppCurrency(plan?.price || 999)}</h3>
                  <small className="text-muted">{plan?.duration || 'Monthly'} billing</small>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                  <FaExclamationTriangle />
                  <span>{error}</span>
                </div>
                <Button variant="outline-danger" size="sm" onClick={handleInitiatePayment} disabled={processing}>
                  Try Again
                </Button>
              </Alert>
            )}

            {/* Platform Adaptive Payment Presentation */}
            {isAndroidNativeApp() ? (
              <div className="card border-0 bg-primary bg-opacity-10 p-3 mb-4 rounded-3 text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <FaGoogle className="fs-4 text-primary" />
                  <span className="fw-bold fs-6">Google Play In-App Billing</span>
                </div>
                <small className="text-muted d-block">
                  Secure recurring subscription managed directly through your Google Play Store account.
                </small>
              </div>
            ) : (
              <>
                {/* Payment Method Selector (Web Only) */}
                <h6 className="fw-bold mb-3">Choose Payment Method</h6>
                
                <div className="row g-3 mb-4">
                  {/* Credit / Debit Card */}
                  {availableMethods.includes('CREDIT_CARD') && (
                    <div className="col-6 col-md-3">
                      <div
                        className={`card p-3 text-center cursor-pointer h-100 ${selectedMethod === 'CREDIT_CARD' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light'}`}
                        onClick={() => setSelectedMethod('CREDIT_CARD')}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <FaCreditCard className="fs-3 text-primary mx-auto mb-2" />
                        <span className="fw-semibold small">Credit Card</span>
                      </div>
                    </div>
                  )}

                  {/* Debit Card */}
                  {availableMethods.includes('DEBIT_CARD') && (
                    <div className="col-6 col-md-3">
                      <div
                        className={`card p-3 text-center cursor-pointer h-100 ${selectedMethod === 'DEBIT_CARD' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light'}`}
                        onClick={() => setSelectedMethod('DEBIT_CARD')}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <FaCreditCard className="fs-3 text-success mx-auto mb-2" />
                        <span className="fw-semibold small">Debit Card</span>
                      </div>
                    </div>
                  )}

                  {/* Google Pay */}
                  <div className="col-6 col-md-3">
                    <div
                      className={`card p-3 text-center h-100 ${selectedMethod === 'GOOGLE_PAY' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light'} ${!isGooglePaySupported ? 'opacity-50' : ''}`}
                      onClick={() => isGooglePaySupported && setSelectedMethod('GOOGLE_PAY')}
                      style={{ cursor: isGooglePaySupported ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                    >
                      <FaGoogle className="fs-3 text-danger mx-auto mb-2" />
                      <span className="fw-semibold small">Google Pay</span>
                      {!isGooglePaySupported && <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>Unsupported</small>}
                    </div>
                  </div>

                  {/* Apple Pay */}
                  <div className="col-6 col-md-3">
                    <div
                      className={`card p-3 text-center h-100 ${selectedMethod === 'APPLE_PAY' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light'} ${!isApplePaySupported ? 'opacity-50' : ''}`}
                      onClick={() => isApplePaySupported && setSelectedMethod('APPLE_PAY')}
                      style={{ cursor: isApplePaySupported ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                    >
                      <FaApple className="fs-3 text-dark mx-auto mb-2" />
                      <span className="fw-semibold small">Apple Pay</span>
                      {!isApplePaySupported && <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>Safari / iOS Only</small>}
                    </div>
                  </div>
                </div>

                {/* Payment Provider Selector (Web Only) */}
                <h6 className="fw-bold mb-3">Payment Provider / Gateway</h6>
                <div className="row g-2 mb-4">
                  {availableProviders.map((provider) => (
                    <div key={provider} className="col-6 col-md-3">
                      <div
                        className={`card p-2 text-center ${selectedProvider === provider ? 'border-primary bg-primary text-white fw-bold shadow-sm' : 'border-secondary bg-light'}`}
                        onClick={() => setSelectedProvider(provider)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                      >
                        {provider}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {processing && (
              <div className="alert alert-info d-flex align-items-center gap-3 mb-0">
                <Spinner animation="border" size="sm" />
                <span className="fw-semibold">{statusMessage}</span>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      {!success && !loading && (
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={onHide} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="px-4 py-2 fw-bold"
            onClick={handleInitiatePayment}
            disabled={processing}
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: 'none' }}
          >
            {processing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              isAndroidNativeApp() ? 'Subscribe with Google Play' : `Pay ${formatAppCurrency(plan?.price || 999)} & Activate`
            )}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default SubscriptionCheckoutModal;
