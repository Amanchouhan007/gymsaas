import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from "react-router-dom";
import {
  FaDumbbell, FaUsers, FaChartLine, FaCalendarAlt, FaCreditCard, FaMobileAlt,
  FaStar, FaQuoteLeft, FaQuoteRight, FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin, FaGlobe, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope,
  FaArrowRight, FaPlay, FaMedal, FaTrophy, FaFire, FaHeartbeat, FaRunning, FaCrown, FaCheck, FaWhatsapp,
  FaCheckCircle, FaQrcode, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiCheck as FiCheckIcon, FiArrowRight as FiArrowRightIcon, FiX } from 'react-icons/fi';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import './LendingPage.css';
import BaseUrl from '../Api/BaseUrl';
import Logo from "../assets/Logo/logo.png";
import HeaderLogo from "../assets/Logo/logo2.png";
import KTLogo from "../assets/Logo/kt_logo.png";
import Snowfall from "react-snowfall";
import testimonialRahul from "../assets/testimonials/rahul.png";
import testimonialPriya from "../assets/testimonials/priya.png";
import testimonialVikram from "../assets/testimonials/vikram.png";
import heroGymImg from "../assets/hero_gym.png";
import AppDownloadButtons, { ReinstallLink } from '../Components/PWA/AppDownloadButtons';
import { isAndroidNativeApp, initiateGooglePlaySubscription, resolvePlayBillingSku } from '../utils/googlePlayBilling';

// Feature Cards Images
import featMemberMgmt from "../assets/features/member_management.jpg";
import featClassSched from "../assets/features/class_scheduling.jpg";
import featPaymentProc from "../assets/features/payment_processing.jpg";
import featProgressTrack from "../assets/features/progress_tracking.jpg";
import featMobileApp from "../assets/features/mobile_app.jpg";
import featEquipment from "../assets/features/equipment_inventory.jpg";
import featDietWorkout from "../assets/features/diet_workout.jpg";
import featWhatsappAlerts from "../assets/features/whatsapp_alerts.jpg";
import featStaffTrainer from "../assets/features/staff_trainer.jpg";
import featQrAttendance from "../assets/features/qr_attendance.jpg";
import featExpiryAlerts from "../assets/features/expiry_alerts.jpg";
import featMultiBranch from "../assets/features/multi_branch.jpg";

const LendingPage = () => {
  useEffect(() => {
    document.title = "YOUR GYM";
  }, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('members');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Professional');
  const [lastPurchase, setLastPurchase] = useState(null);
  const heroRef = useRef(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [showComparisonTable, setShowComparisonTable] = useState(false);

  const toggleExpandCard = (planId) => {
    setExpandedCards(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };
  const [plans, setPlans] = useState([
    { id: 1, name: 'Starter', price: 999, duration: 'Monthly', description: 'Essential features for single branch gyms' },
    { id: 2, name: 'Professional', price: 2499, duration: 'Monthly', isPopular: true, description: 'Complete gym management with analytics & WhatsApp' },
    { id: 3, name: 'Enterprise', price: 4999, duration: 'Yearly', description: 'Multi-branch operations with dedicated support' }
  ]);
  const [automationSettings, setAutomationSettings] = useState({
    trialDurationDays: 7,
    gracePeriodDays: 3,
    quarterlyDiscount: 5,
    yearlyDiscount: 15
  });

  // SaaS Demo Lead capture modal state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoLeadSource, setDemoLeadSource] = useState('Schedule Demo');
  const [demoLeadPlan, setDemoLeadPlan] = useState('');
  const [demoForm, setDemoForm] = useState({ fullName: '', phone: '', email: '', gymName: '', city: '' });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  useEffect(() => {
    // Fetch plans from API 
    const fetchPlans = async () => {
      try {
        if (!BaseUrl) return;
        const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
        const response = await fetch(`${cleanUrl}/plans`);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.plans) && data.plans.length > 0) {
            setPlans(data.plans);
          }
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };

    const fetchAutomationSettings = async () => {
      try {
        if (!BaseUrl) return;
        const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
        const response = await fetch(`${cleanUrl}/v1/automation/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.success && data.settings) {
            setAutomationSettings(data.settings);
          }
        }
      } catch (error) {
        console.error("Error fetching automation settings:", error);
      }
    };

    fetchPlans();
    fetchAutomationSettings();

    // Load Razorpay Script safely without duplication on hard refresh
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);
  const navigate = useNavigate();

  // Purchase modal form state
  const [purchaseFormData, setPurchaseFormData] = useState({
    selectedPlan: '7-Day Free Trial',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    billingDuration: 'Yearly',
    startDate: new Date().toISOString().split('T')[0],
    gstNumber: '',
    city: ''
  });

  const [showPurchasePassword, setShowPurchasePassword] = useState(false);
  const [showPurchaseConfirmPassword, setShowPurchaseConfirmPassword] = useState(false);

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  // Payment simulator states
  const [purchaseStep, setPurchaseStep] = useState('register'); // 'register' | 'payment' | 'processing' | 'success'
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('upi'); // 'upi' | 'card'
  const [purchaseUpiId, setPurchaseUpiId] = useState('');
  const [purchaseCardNumber, setPurchaseCardNumber] = useState('');
  const [purchaseCardExpiry, setPurchaseCardExpiry] = useState('');
  const [purchaseCardCvv, setPurchaseCardCvv] = useState('');
  const [purchaseTxnId, setPurchaseTxnId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let animationFrameId = null;
    const handleMouseMove = (e) => {
      if (animationFrameId) return;
      animationFrameId = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        animationFrameId = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handlePurchaseClick = (planName) => {
    setSelectedPlan(planName);
    setPurchaseFormData({
      ...purchaseFormData,
      selectedPlan: planName,
      startDate: new Date().toISOString().split('T')[0]
    });
    setShowPurchaseModal(true);
  };

  // Open demo lead / customization modal
  const handleScheduleDemoClick = (planName = '') => {
    setDemoLeadSource('Schedule Demo');
    setDemoLeadPlan(planName || 'Custom Plan');
    setDemoForm({ fullName: '', phone: '', email: '', gymName: '', city: '' });
    setDemoSuccess(false);
    setShowDemoModal(true);
  };

  // Submit demo lead to backend
  const handleDemoLeadSubmit = async (e) => {
    e.preventDefault();
    if (demoSubmitting) return; // Prevent duplicate submission
    if (!demoForm.fullName.trim() || !demoForm.phone.trim()) {
      alert('Name and Phone are required.');
      return;
    }
    setDemoSubmitting(true);
    try {
      const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
      const response = await fetch(`${cleanUrl}/leads/public/saas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...demoForm, source: demoLeadSource, interestedPlan: demoLeadPlan || undefined })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit enquiry');
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.message || 'Failed to submit enquiry');
      }

      // Safe Google Ads conversion event trigger - only on confirmed backend success
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag('event', 'conversion', {
            'send_to': 'AW-16626477455/BeVuCO2Qm7gdEI_Tj_g9'
          });
        } catch (gtagErr) {
          console.warn('Google Ads tracking error:', gtagErr);
        }
      }

      setDemoSuccess(true);
      // Also open WhatsApp
      window.open(`https://wa.me/919752100980?text=Hi%2C%20I%20want%20to%20schedule%20a%20demo.%20My%20name%20is%20${encodeURIComponent(demoForm.fullName)}.`, '_blank');
      setTimeout(() => { setShowDemoModal(false); setDemoSuccess(false); }, 2500);
    } catch (err) {
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handlePurchaseFormChange = (e) => {
    const { name, value } = e.target;
    setPurchaseFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlanSelectChange = (e) => {
    const selectedName = e.target.value;

    // Find plan details to retrieve duration
    const allPlans = plans.length > 0 ? plans : [
      { id: 'gold', name: 'Gold', duration: 'Yearly', price: 4998 },
      { id: 'basic', name: 'Basic', duration: 'Monthly', price: 8999 },
      { id: 'pro', name: 'Pro', duration: 'Yearly', price: 11999 }
    ];

    const selectedPlanObj = allPlans.find(p => p.name === selectedName);

    setPurchaseFormData(prev => ({
      ...prev,
      selectedPlan: selectedName
    }));
  };

  const getSelectedPlanPrice = () => {
    const planNameLower = (purchaseFormData.selectedPlan || '').toLowerCase();
    if (planNameLower.includes('trial') || planNameLower.includes('free')) {
      return 0;
    }

    // Direct price mapping for default tier names
    if (planNameLower.includes('starter')) return 700;
    if (planNameLower.includes('standard') || planNameLower.includes('growth')) return 900;
    if (planNameLower.includes('pro')) return 1200;

    const allPlans = plans.length > 0 ? plans : [
      { id: 'starter_700', name: 'Starter Plan', price: 700 },
      { id: 'standard_900', name: 'Standard Plan', price: 900 },
      { id: 'pro_1200', name: 'Pro Plan', price: 1200 }
    ];

    const matched = allPlans.find(p => 
      p.name.toLowerCase() === planNameLower ||
      p.name.toLowerCase().includes(planNameLower) ||
      planNameLower.includes(p.name.toLowerCase())
    );

    if (!matched) return 700; // Default fallback to paid price, not 0

    // Apply native discountPercent if present
    const planDiscount = matched.discountPercent || 0;
    if (planDiscount > 0) {
      return Math.round(matched.price - (matched.price * planDiscount / 100));
    }

    return Math.round(matched.price);
  };

  // Simplified purchase handler with simulated payment gateway support
  const handlePurchaseSubmit = async (demoPaid = false, method = null, details = null) => {
    // Clean validation: Only Email & matching Passwords required (No strict password complexity)
    const cleanEmail = (purchaseFormData.email || '').trim();
    const cleanPassword = purchaseFormData.password || '';
    const cleanConfirm = purchaseFormData.confirmPassword || '';

    if (!cleanEmail) {
      alert("Please enter your email address.");
      return;
    }
    if (!cleanPassword) {
      alert("Please enter a password.");
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      alert("Passwords do not match. Please re-enter your confirm password.");
      return;
    }

    // Auto-derive sensible defaults for backend and database NOT NULL compatibility
    const emailPrefix = cleanEmail.split('@')[0] || 'Member';
    const derivedGymName = purchaseFormData.companyName?.trim() || 
      (emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + "'s Gym");
    const derivedPhone = purchaseFormData.phone?.trim() || "9999999999";
    const derivedCity = purchaseFormData.city?.trim() || "New Delhi";
    const derivedStartDate = purchaseFormData.startDate || new Date().toISOString().split('T')[0];
    const derivedPlan = purchaseFormData.selectedPlan || '7-Day Free Trial';
    const derivedBilling = (derivedPlan.toLowerCase().includes('trial') || derivedPlan.toLowerCase().includes('free')) ? '7 Days' : 'Monthly';

    // Set processing step if it is a paid demo payment
    if (demoPaid) {
      setPurchaseStep('processing');
    }

    try {
      // Create FormData to support profile image upload
      const formData = new FormData();
      formData.append("selectedPlan", derivedPlan);
      formData.append("companyName", derivedGymName);
      formData.append("email", cleanEmail);
      formData.append("phone", derivedPhone);
      formData.append("password", cleanPassword);
      formData.append("startDate", derivedStartDate);
      formData.append("billingDuration", derivedBilling);
      formData.append("gstNumber", "");
      formData.append("city", derivedCity);
      formData.append("amount", getSelectedPlanPrice());

      if (demoPaid) {
        formData.append("isDemoPaid", "true");
        formData.append("paymentMethod", method || "UPI");
        formData.append("paymentDetails", details || "");
      }

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      if (!demoPaid) {
        // Platform Adaptive Payment Flow (Google Play Billing on Android, Razorpay on Web)
        if (isAndroidNativeApp()) {
          const { productId, basePlanId } = resolvePlayBillingSku(derivedPlan, derivedBilling);
          
          const playRes = await initiateGooglePlaySubscription({
            productId,
            basePlanId,
            planName: derivedPlan,
            billingDuration: derivedBilling,
            email: cleanEmail,
            companyName: derivedGymName,
            adminName: derivedGymName,
            phone: derivedPhone
          });

          if (playRes.status === 'PENDING') {
            alert(playRes.message || 'Payment is pending with Google Play.');
            setShowPurchaseModal(false);
            setPurchaseStep('register');
            return;
          }

          const finalTxnId = playRes.orderId || `SUB-${Date.now()}`;
          setPurchaseTxnId(finalTxnId);
          setPurchaseStep('success');

          setTimeout(() => {
            setShowPurchaseModal(false);
            setPurchaseStep('register');
            setPurchaseTxnId('');
            navigate('/login');
          }, 2000);
          return;
        }

        // Web Razorpay Flow
        const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;

        // 1. Create Razorpay Order
        const orderRes = await fetch(`${cleanUrl}/purchases/create-razorpay-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: getSelectedPlanPrice() })
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json();
          throw new Error(errData.message || 'Failed to initialize payment');
        }

        const { order, key, isMock } = await orderRes.json();

        if (isMock || !key || key === "undefined" || !order || !order.id) {
          // If fallback to mock or keys missing, call verify directly with mock payload
          const mockPayload = {
            selectedPlan: derivedPlan,
            companyName: derivedGymName,
            email: cleanEmail,
            phone: derivedPhone,
            password: cleanPassword,
            startDate: derivedStartDate,
            billingDuration: derivedBilling,
            gstNumber: "",
            city: derivedCity,
            amount: getSelectedPlanPrice(),
            razorpay_order_id: order?.id || ('order_mock_' + Date.now()),
            razorpay_payment_id: 'pay_mock_' + Date.now(),
            razorpay_signature: 'mock_signature',
            isMock: true
          };

          const verifyRes = await fetch(`${cleanUrl}/purchases/verify-razorpay-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockPayload)
          });

          if (!verifyRes.ok) {
            const vErr = await verifyRes.json();
            throw new Error(vErr.message || 'Verification failed');
          }

          const resData = await verifyRes.json();

          // Capture generated transaction ID
          const finalTxnId = resData.data?.transactionId || resData.data?.purchase?.transactionId || `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(resData.data?.id || 0).padStart(4, '0')}`;
          setPurchaseTxnId(finalTxnId);
          setPurchaseStep('success');

          setTimeout(() => {
            setShowPurchaseModal(false);
            setPurchaseStep('register');
            setPurchaseTxnId('');
            navigate('/login');
          }, 2000);
          return;
        }

        // 2. Open Real Razorpay Checkout
        return new Promise((resolve, reject) => {
          const options = {
            key: key,
            amount: order.amount,
            currency: order.currency || "INR",
            name: "Gym SaaS Software",
            description: `Purchase ${purchaseFormData.selectedPlan}`,
            order_id: order.id,
            handler: async function (response) {
              try {
                const verifyPayload = {
                  selectedPlan: derivedPlan,
                  companyName: derivedGymName,
                  email: cleanEmail,
                  phone: derivedPhone,
                  password: cleanPassword,
                  startDate: derivedStartDate,
                  billingDuration: derivedBilling,
                  gstNumber: "",
                  city: derivedCity,
                  amount: getSelectedPlanPrice(),
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                };

                const verifyRes = await fetch(`${cleanUrl}/purchases/verify-razorpay-payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(verifyPayload)
                });

                const resData = await verifyRes.json();

                if (!verifyRes.ok || !resData.success) {
                  throw new Error(resData.message || 'Payment verification failed');
                }

                // Success logic
                const finalTxnId = resData.data?.transactionId || resData.data?.purchase?.transactionId || `PAY-${Date.now()}`;
                setPurchaseTxnId(finalTxnId);
                setPurchaseStep('success');

                setTimeout(() => {
                  setShowPurchaseModal(false);
                  setPurchaseStep('register');
                  setPurchaseTxnId('');
                  navigate('/login');
                }, 2000);
                resolve();
              } catch (vErr) {
                console.error("Verification error:", vErr);
                alert(vErr.message || "Error verifying payment.");
                reject(vErr);
              }
            },
            modal: {
              ondismiss: function () {
                setPurchaseStep('register');
                reject(new Error("Payment cancelled"));
              }
            },
            theme: { color: "#6EB2CC" }
          };
          const rzp1 = new window.Razorpay(options);
          rzp1.open();
        });
      }

      // If demoPaid is true, process mock payment validation directly (Admin demo tests)
      const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
      const response = await fetch(`${cleanUrl}/purchases`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process purchase');
      }

      const resData = await response.json();

      // Submit lead details to SaaS Leads database as well
      try {
        await fetch(`${cleanUrl}/leads/public/saas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: derivedGymName + ' Owner',
            phone: derivedPhone,
            email: cleanEmail,
            gymName: derivedGymName,
            city: derivedCity,
            source: demoPaid ? 'Complete Purchase' : 'Start Free Trial',
            interestedPlan: derivedPlan,
            notes: `Auto Signup via Plan Modal`
          })
        });
      } catch (leadError) {
        console.error('Failed to log lead:', leadError);
      }

      // Capture generated transaction ID
      const finalTxnId = resData.data?.transactionId || `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(resData.data?.id || 0).padStart(4, '0')}`;
      setPurchaseTxnId(finalTxnId);

      // Transition to success screen
      setPurchaseStep('success');

      // Setup auto-close timer and navigate to login
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseStep('register');
        setPurchaseTxnId('');
        setPurchaseUpiId('');
        setPurchaseCardNumber('');
        setPurchaseCardExpiry('');
        setPurchaseCardCvv('');
        navigate('/login');
      }, 1800);

      // 保存最后一次提交的数据，防止重置后模态框显示为空
      setLastPurchase({ ...purchaseFormData });

      // 重置表单数据
      setPurchaseFormData({
        selectedPlan: '7-Day Free Trial',
        companyName: '',
        email: '',
        phone: '',
        password: '',
        billingDuration: 'Yearly',
        startDate: new Date().toISOString().split('T')[0],
        gstNumber: '',
        city: ''
      });
      setProfileImageFile(null);
      setProfilePreview(null);

      // 可选：记录成功响应
      console.log('Purchase successful:', resData);

    } catch (error) {
      console.error('Purchase error:', error);
      alert(`Error: ${error.message}`);
      setPurchaseStep('register');
    }
  };

  const features = [
    {
      image: featMemberMgmt,
      icon: <FaUsers className="feature-icon" />,
      title: "Member Management",
      description: "Effortlessly manage member profiles, attendance, and membership plans.",
      color: "#FF6B6B",
      bg: "rgba(255, 107, 107, 0.15)"
    },
    {
      image: featClassSched,
      icon: <FaCalendarAlt className="feature-icon" />,
      title: "Class Scheduling",
      description: "Create and manage class schedules with easy booking and reminders.",
      color: "#4ECDC4",
      bg: "rgba(78, 205, 196, 0.15)"
    },
    {
      image: featPaymentProc,
      icon: <FaCreditCard className="feature-icon" />,
      title: "Payment Processing",
      description: "Secure payment processing with automated billing and invoicing.",
      color: "#FFD166",
      bg: "rgba(255, 209, 102, 0.15)"
    },
    {
      image: featProgressTrack,
      icon: <FaChartLine className="feature-icon" />,
      title: "Progress Tracking",
      description: "Track member progress with detailed analytics and reports.",
      color: "#A78BFA",
      bg: "rgba(167, 139, 250, 0.15)"
    },
    {
      image: featMobileApp,
      icon: <FaMobileAlt className="feature-icon" />,
      title: "Mobile App",
      description: "Full-featured mobile app for members and trainers on the go.",
      color: "#38BDF8",
      bg: "rgba(56, 189, 248, 0.15)"
    },
    {
      image: featEquipment,
      icon: <FaDumbbell className="feature-icon" />,
      title: "Equipment & Inventory",
      description: "Monitor gym equipment maintenance, asset tracking, and stock availability.",
      color: "#FB923C",
      bg: "rgba(251, 146, 60, 0.15)"
    },
    {
      image: featDietWorkout,
      icon: <FaHeartbeat className="feature-icon" />,
      title: "Diet & Workout Plans",
      description: "Customized workout routines and personalized nutrition diet plans for members.",
      color: "#34D399",
      bg: "rgba(52, 211, 153, 0.15)"
    },
    {
      image: featWhatsappAlerts,
      icon: <FaFire className="feature-icon" />,
      title: "WhatsApp & SMS Alerts",
      description: "Automated WhatsApp notifications for fee reminders, attendance, and special offers.",
      color: "#22C55E",
      bg: "rgba(34, 197, 94, 0.15)"
    },
    {
      image: featStaffTrainer,
      icon: <FaCrown className="feature-icon" />,
      title: "Staff & Trainer Management",
      description: "Manage trainer assignments, shift schedules, commissions, and payroll easily.",
      color: "#C084FC",
      bg: "rgba(192, 132, 252, 0.15)"
    },
    {
      image: featQrAttendance,
      icon: <FaRunning className="feature-icon" />,
      title: "Biometric & QR Attendance",
      description: "Touchless QR code scanning & biometric hardware integration.",
      color: "#60A5FA",
      bg: "rgba(96, 165, 250, 0.15)"
    },
    {
      image: featExpiryAlerts,
      icon: <FaTrophy className="feature-icon" />,
      title: "Automated Expiry Alerts",
      description: "Instant expiry reminders and automated digital invoicing.",
      color: "#F472B6",
      bg: "rgba(244, 114, 182, 0.15)"
    },
    {
      image: featMultiBranch,
      icon: <FaGlobe className="feature-icon" />,
      title: "Multi-Branch Control",
      description: "Centralized management for multi-location gyms & franchises.",
      color: "#2DD4BF",
      bg: "rgba(45, 212, 191, 0.15)"
    }
  ];

  const testimonials = [
    {
      name: "hillfamilybiz",
      role: "🇺🇸 United States • 3 weeks duration",
      content: "Did a wonderful job! It's a long term project. They understand concept and vision. Will continue to work with them to complete full scope",
      rating: 5,
      time: "4 months ago",
      avatar: "https://ui-avatars.com/api/?name=hillfamilybiz&background=ea580c&color=fff&bold=true"
    },
    {
      name: "truman42lewis",
      role: "🇺🇸 United States • 5 days duration",
      content: "Kiaan and his team showed up and handled business. Excellent work, professional, and on point. I highly recommend them.",
      rating: 5,
      time: "5 months ago",
      avatar: "https://ui-avatars.com/api/?name=truman42lewis&background=2563eb&color=fff&bold=true"
    },
    {
      name: "truman42lewis",
      role: "🇺🇸 United States • 1 day duration",
      content: "Kiaan And His Team are truly professional and I'm honored to work with them. As they have delivered our agency a state of the art software! Thank you 🙏",
      rating: 5,
      time: "4 months ago",
      avatar: "https://ui-avatars.com/api/?name=truman42lewis&background=8b5cf6&color=fff&bold=true"
    },
    {
      name: "fahimhyder310",
      role: "🇮🇳 India • 12 days duration",
      content: "They demonstrated strong command over both frontend and backend development, ensuring performance, security, and smooth functionality throughout the build. What stood out most was their deep understanding of the product vision. Their professionalism was consistent throughout the project. Milestones were delivered on time, communication was clear and structured, and they handled feedback with maturity and precision.",
      rating: 5,
      time: "5 months ago",
      avatar: "https://ui-avatars.com/api/?name=fahimhyder310&background=dc2626&color=fff&bold=true"
    },
    {
      name: "hansdjabs",
      role: "🇷🇼 Rwanda • 12 days duration",
      content: "my experience working with this company is very great , i highly recommend everyone to work with this amazing team. because everything is smooth by working with them .. and they have expert in software development i can tell you .. whatever you have in mind they can build it with professionalism.",
      rating: 5,
      time: "7 months ago",
      avatar: "https://ui-avatars.com/api/?name=hansdjabs&background=16a34a&color=fff&bold=true"
    }
  ];

  const benefits = [
    "Increase member retention by up to 40%",
    "Save 15+ hours per week on administrative tasks",
    "Improve staff efficiency and communication",
    "Boost revenue with automated billing and upselling",
    "Enhance member experience with self-service options",
    "Make data-driven decisions with detailed analytics"
  ];

  const stats = [
    { value: "500+", label: "Happy Gyms", icon: <FaCrown /> },
    { value: "50K+", label: "Active Members", icon: <FaUsers /> },
    { value: "99.9%", label: "Uptime", icon: <FaChartLine /> },
    { value: "24/7", label: "Support", icon: <FaHeartbeat /> }
  ];

  // Convert plan duration to readable period
  const getPeriodText = (duration) => {
    if (!duration) return "per plan";

    // Handle specific strings
    if (typeof duration === 'string') {
      const lower = duration.toLowerCase();
      if (lower.includes('month')) return "per month";
      if (lower.includes('year')) return "per year";
      if (lower.includes('week') || lower === '7 days') return "per week";

      // If it contains a number (like "6 Months")
      return `per ${duration}`;
    }

    const days = parseInt(duration);
    if (isNaN(days)) return `per ${duration}`;
    if (days === 365) return "per year";
    if (days === 30) return "per month";
    if (days === 7) return "per week";
    return `per ${days} days`;
  };

  // Render pricing cards
  const renderPricingCards = () => {
    const defaultPlans = [
      {
        id: 'free_trial',
        name: '7-Day Free Trial',
        subtitle: 'Explore the software for 7 days.',
        price: '₹0',
        period: 'for 7 days',
        titleColor: '#ffffff',
        features: [
          { text: 'Up to 5 Members', available: true },
          { text: '2 Staff Users', available: true },
          { text: '1 Gym Branch', available: true },
          { text: '1 Admin User', available: true },
          { text: 'Member Management', available: true },
          { text: 'Membership Plans', available: true },
          { text: 'Manual Attendance', available: true },
          { text: 'Payment & Invoicing', available: true },
          { text: 'QR Attendance', available: false },
          { text: 'Biometric Attendance', available: false },
          { text: 'Expense Management', available: false },
          { text: 'Trainer Management', available: false },
          { text: 'Advanced Reports', available: false },
          { text: 'WhatsApp Integration', available: false },
          { text: 'Multi-Branch Dashboard', available: false },
          { text: 'Custom Branding', available: false }
        ],
        btnText: 'Get Started',
        btnVariant: 'btn-white',
        planKey: '7-Day Free Trial'
      },
      {
        id: 'starter_700',
        name: 'Starter',
        subtitle: 'Perfect for small gyms.',
        price: '₹700',
        period: 'per month',
        titleColor: '#f97316',
        features: [
          { text: 'Up to 20 Members', available: true },
          { text: '3 Staff Users', available: true },
          { text: '1 Gym Branch', available: true },
          { text: '1 Admin User', available: true },
          { text: 'Member Management', available: true },
          { text: 'Membership Plans', available: true },
          { text: 'Manual Attendance', available: true },
          { text: 'Payment & Invoicing', available: true },
          { text: 'Expense Management', available: true },
          { text: 'Trainer Management', available: true },
          { text: 'QR Attendance', available: false },
          { text: 'Biometric Attendance', available: false },
          { text: 'Advanced Reports', available: false },
          { text: 'WhatsApp Integration', available: false },
          { text: 'Multi-Branch Dashboard', available: false },
          { text: 'Custom Branding', available: false }
        ],
        btnText: 'Get Started',
        btnVariant: 'btn-white',
        planKey: 'Starter'
      },
      {
        id: 'growth_900',
        name: 'Growth',
        subtitle: 'Ideal for growing gyms.',
        isPopular: true,
        badge: 'Most Popular',
        badgeType: 'popular',
        price: '₹900',
        period: 'per month',
        titleColor: '#f97316',
        features: [
          { text: 'Up to 50 Members', available: true },
          { text: '5 Staff Users', available: true },
          { text: '1 Gym Branch', available: true },
          { text: '2 Admin Users', available: true },
          { text: 'Member Management', available: true },
          { text: 'Membership Plans', available: true },
          { text: 'Manual Attendance', available: true },
          { text: 'QR Attendance', available: true },
          { text: 'Payment & Invoicing', available: true },
          { text: 'Expense Management', available: true },
          { text: 'Trainer Management', available: true },
          { text: 'Advanced Reports', available: true },
          { text: 'Biometric Attendance', available: false },
          { text: 'WhatsApp Integration', available: false },
          { text: 'Multi-Branch Dashboard', available: false },
          { text: 'Custom Branding', available: false }
        ],
        btnText: 'Get Started',
        btnVariant: 'btn-orange',
        planKey: 'Standard'
      },
      {
        id: 'pro_1200',
        name: 'Pro',
        subtitle: 'Best for professional gyms & multi-branches.',
        price: '₹1,200',
        period: 'per month',
        titleColor: '#f97316',
        features: [
          { text: 'Up to 150 Members', available: true },
          { text: '10 Staff Users', available: true },
          { text: '3 Gym Branches', available: true },
          { text: '3 Admin Users', available: true },
          { text: 'Member Management', available: true },
          { text: 'Membership Plans', available: true },
          { text: 'Manual Attendance', available: true },
          { text: 'QR Attendance', available: true },
          { text: 'Biometric Attendance', available: true },
          { text: 'Payment & Invoicing', available: true },
          { text: 'Expense Management', available: true },
          { text: 'Trainer Management', available: true },
          { text: 'Advanced Reports', available: true },
          { text: 'WhatsApp Integration', available: true },
          { text: 'Multi-Branch Dashboard', available: true },
          { text: 'Custom Branding', available: false }
        ],
        btnText: 'Get Started',
        btnVariant: 'btn-white',
        planKey: 'Pro'
      },
      {
        id: 'custom_plan',
        name: 'Custom Plan',
        subtitle: 'For large gym chains and franchises.',
        price: 'Custom',
        period: 'Tailored to your gym',
        titleColor: '#f97316',
        features: [
          { text: 'Custom Members', available: true },
          { text: 'Custom Staff Users', available: true },
          { text: 'Custom Gym Branches', available: true },
          { text: 'Custom Admin Users', available: true },
          { text: 'Member Management', available: true },
          { text: 'Membership Plans', available: true },
          { text: 'Manual Attendance', available: true },
          { text: 'QR Attendance', available: true },
          { text: 'Biometric Attendance', available: true },
          { text: 'Payment & Invoicing', available: true },
          { text: 'Expense Management', available: true },
          { text: 'Trainer Management', available: true },
          { text: 'Advanced Reports', available: true },
          { text: 'WhatsApp Integration', available: true },
          { text: 'Multi-Branch Dashboard', available: true },
          { text: 'Custom Branding', available: true }
        ],
        btnText: 'Get Started',
        btnVariant: 'btn-white',
        planKey: 'Custom Plan'
      }
    ];

    return defaultPlans.map((plan, index) => {
      const isPopular = plan.isPopular;
      const isExpanded = !!expandedCards[plan.id];
      const displayedFeatures = isExpanded ? plan.features : plan.features.slice(0, 10);

      return (
        <motion.div
          className={`pricing-card-modern ${isPopular ? 'popular-modern' : ''}`}
          key={plan.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -8 }}
          style={{
            background: 'linear-gradient(180deg, #1b0e07 0%, #120804 100%)',
            border: isPopular ? '2px solid #ea580c' : '1px solid #331a0e',
            boxShadow: isPopular ? '0 0 25px rgba(234, 88, 12, 0.4)' : '0 8px 20px rgba(0, 0, 0, 0.4)',
            borderRadius: '16px',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            color: '#ffffff',
            transition: 'all 0.3s ease'
          }}
        >
          {plan.badge && (
            <div
              style={{
                position: 'absolute',
                top: '-13px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '3px 14px',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                zIndex: 2,
                background: '#ea580c',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.5)'
              }}
            >
              {plan.badge}
            </div>
          )}

          <div>
            <div className="pricing-header mb-3 text-center" style={{ paddingTop: plan.badge ? '8px' : '0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: plan.titleColor || '#ffffff', marginBottom: '6px' }}>
                {plan.name}
              </h3>
              <div className="pricing-price d-flex align-items-baseline justify-content-center gap-1" style={{ borderBottom: '1px solid #2d180d', paddingBottom: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: plan.price === 'Custom' ? '1.75rem' : '2.1rem', fontWeight: '800', color: '#ea580c' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: '500' }}>
                  {plan.period}
                </span>
              </div>
              {plan.subtitle && (
                <div style={{
                  fontSize: '0.74rem',
                  color: '#fdba74',
                  lineHeight: '1.3',
                  marginBottom: '10px',
                  minHeight: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '500'
                }}>
                  {plan.subtitle}
                </div>
              )}
            </div>

            <div className="pricing-features mb-4">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayedFeatures.map((feat, fIdx) => (
                  <li key={fIdx} className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.78rem', color: feat.available ? '#e2e8f0' : '#64748b' }}>
                    <span
                      style={{
                        color: feat.available ? '#eab308' : '#ef4444',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        width: '14px',
                        flexShrink: 0
                      }}
                    >
                      {feat.available ? '✓' : '×'}
                    </span>
                    <span style={{ textDecoration: feat.available ? 'none' : 'line-through' }}>{feat.text}</span>
                  </li>
                ))}
              </ul>
              {plan.features.length > 10 && (
                <div className="text-center mt-3">
                  <span
                    onClick={() => toggleExpandCard(plan.id)}
                    style={{ fontSize: '0.75rem', color: '#ea580c', cursor: 'pointer', fontWeight: '600', userSelect: 'none' }}
                  >
                    {isExpanded ? '− Show Less ∧' : `+ Show All Features (${plan.features.length - 10} more) ∨`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="w-100 py-2 px-3 rounded-2 fw-bold border-0 cursor-pointer d-flex align-items-center justify-content-center gap-2 transition-all"
            onClick={() => {
              if (plan.id === 'custom_plan') {
                handleScheduleDemoClick('Custom Plan');
              } else {
                handlePurchaseClick(plan.planKey || plan.name);
              }
            }}
            style={{
              fontSize: '0.85rem',
              letterSpacing: '0.3px',
              background: plan.btnVariant === 'btn-orange'
                ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                : '#ffffff',
              color: plan.btnVariant === 'btn-orange' ? '#ffffff' : '#000000',
              boxShadow: plan.btnVariant === 'btn-orange'
                ? '0 4px 14px rgba(234, 88, 12, 0.4)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            {plan.btnText}
          </button>
        </motion.div>
      );
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 }
    }
  };

  const heroItemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const dashboardData = {
    members: {
      title: "Member Overview",
      stats: [
        { label: "Total Members", value: "245", change: "+12%" },
        { label: "Active Today", value: "68", change: "+5%" },
        { label: "New This Month", value: "24", change: "+8%" }
      ],
      chart: [65, 59, 80, 81, 56, 55, 70]
    },
    revenue: {
      title: "Revenue Analytics",
      stats: [
        { label: "Monthly Revenue", value: "₹2.4L", change: "+18%" },
        { label: "Avg. Revenue/Member", value: "₹980", change: "+3%" },
        { label: "Pending Payments", value: "₹24K", change: "-5%" }
      ],
      chart: [28, 48, 40, 59, 66, 77, 80]
    },
    classes: {
      title: "Class Performance",
      stats: [
        { label: "Classes Today", value: "18", change: "+2" },
        { label: "Avg. Attendance", value: "85%", change: "+4%" },
        { label: "Popular Class", value: "HIIT", change: "N/A" }
      ],
      chart: [45, 52, 38, 65, 59, 70, 75]
    }
  };

  return (
    <div className="landing-page">

      {/* Optimized Ambient Background Glows */}
      <div className="bg-elements">
        <div className="bg-element bg-orb-1" />
        <div className="bg-element bg-orb-2" />
      </div>

      {/* Navigation */}
      <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">

          {/* LEFT — BRAND */}
          <div className="nav-left">
            <motion.a
              className="navbar-brand d-flex align-items-center text-decoration-none"
              href="#"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src={KTLogo} 
                alt="KT Logo" 
                className="brand-logo-img"
                style={{ 
                  height: '38px', 
                  width: 'auto', 
                  marginRight: '8px', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.35))' 
                }} 
              />
              <span className="brand-title-text" style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                YOUR <span style={{ color: '#f97316' }}>GYM</span>
              </span>
            </motion.a>
          </div>

          {/* MOBILE TOGGLER */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
          >
            <span className={`navbar-toggler-icon ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          {/* CENTER — MENU */}
          {/* CENTER — MENU */}
          <div className={`collapse navbar-collapse ${mobileMenuOpen ? "show" : ""} nav-center`}>
            <ul className="navbar-nav mx-auto">
              {['Home', 'Features', 'Benefits', 'Testimonials', 'Pricing', 'Contact'].map((item) => (
                <motion.li
                  className="nav-item"
                  key={item}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <a className="nav-link" href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}>
                    {item}
                    <motion.div className="nav-underline" layoutId="navUnderline" />
                  </a>
                </motion.li>
              ))}

              {/* 🔥 MOBILE LOGIN BUTTON HERE */}
              <li className="nav-item d-lg-none mt-3">
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Login
                  <FiArrowRightIcon className="btn-icon" />
                </Button>
              </li>
            </ul>
          </div>


          {/* RIGHT — LOGIN BUTTON */}
          <div className="d-none d-lg-flex align-items-center gap-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                variant="primary"
                className=" demo-btn"
                onClick={() => navigate("/login")}
              >
                Login
                <FiArrowRightIcon className="btn-icon" />
              </Button>
            </motion.div>
          </div>

        </div>
      </nav>



      {/* Hero Section */}
      <section id="home" className="hero-section" ref={heroRef}>
        <Container className="">
          <Row className="align-items-stretch g-4">
            <Col lg={6} className="mb-4 mb-lg-0 d-flex flex-column justify-content-center">
              <div className="align-item-center px-2 px-md-4">
                <div className="hero-badge ">
                  <FaFire className="badge-icon me-2 " /> #1 YOUR GYM Management Software
                </div>
                <h1 className="hero-title px-2 px-md-4">
                  Transform Your <span className="highlight">Gym  Business</span>
                </h1>
                <p className="hero-subtitle px-2 px-md-3">
                  The all-in-one solution for modern gyms and fitness centers. Streamline operations,
                  boost member engagement, and grow your business with our powerful management system.
                </p>

                {/* Primary Hero CTA: 7-Day Free Trial */}
                <div className="d-flex flex-wrap align-items-center gap-3 px-2 px-md-3 mt-3 mb-2">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 10px 28px rgba(234, 88, 12, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePurchaseClick('7-Day Free Trial')}
                    className="btn px-4 py-3 fw-bold text-white d-inline-flex align-items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.05rem',
                      letterSpacing: '0.3px',
                      boxShadow: '0 6px 20px rgba(234, 88, 12, 0.35)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>⚡ Start 7-Day Free Trial</span>
                    <FiArrowRightIcon size={18} />
                  </motion.button>
                </div>

                <AppDownloadButtons variant="hero" />
                <div className="row row-cols-4 g-2 align-items-start mt-2">
                  {stats.map((stat, index) => (
                    <Col key={index} className="d-flex flex-column align-items-center">
                      <div className="hero-stat text-center w-100">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    </Col>
                  ))}
                </div>
              </div>
            </Col>
            <Col lg={6} className="d-flex align-items-center justify-content-center position-relative">
              <div className="hero-visual-wrapper position-relative w-100">
                {/* Ambient Warm Orange Glow */}
                <div className="hero-ambient-glow" />

                {/* Hero Main Attractive Gym Visual Card */}
                <div className="hero-image-card position-relative overflow-hidden">
                  <img
                    src={heroGymImg}
                    alt="YOUR GYM Luxury Modern Fitness"
                    className="hero-main-img img-fluid w-100"
                    loading="eager"
                  />
                  <div className="hero-image-overlay-gradient position-absolute top-0 start-0 w-100 h-100"></div>
                </div>

                {/* Floating Badge 1 (Top Right) */}
                <motion.div
                  className="floating-mockup-badge badge-top-right"
                  animate={{ y: [0, -9, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="floating-badge-icon icon-success">
                    <FaCheckCircle size={15} />
                  </div>
                  <div className="floating-badge-content">
                    <div className="floating-badge-title">₹2,499 Fee Paid</div>
                    <div className="floating-badge-subtitle">Auto WhatsApp Receipt 🚀</div>
                  </div>
                </motion.div>

                {/* Floating Badge 2 (Bottom Left) */}
                <motion.div
                  className="floating-mockup-badge badge-bottom-left"
                  animate={{ y: [0, 9, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                >
                  <div className="floating-badge-icon icon-orange">
                    <FaQrcode size={15} />
                  </div>
                  <div className="floating-badge-content">
                    <div className="floating-badge-title">Touchless QR Check-in</div>
                    <div className="floating-badge-subtitle">0.3s Instant Entry ⚡</div>
                  </div>
                </motion.div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section mt-0">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-badge">
              <FaMedal className="badge-icon" /> Powerful Features
            </div>
            <h2>Everything You Need to <span className="highlight">Manage Your Gym</span></h2>
            <p>Comprehensive tools designed specifically for fitness centers and gyms</p>
          </motion.div>
          <motion.div
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                className="feature-card"
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card className="h-100">
                  {/* Top Visual Image Banner with Dark Overlay */}
                  <div className="feature-card-banner position-relative overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="feature-card-img"
                      loading="lazy"
                    />
                    <div className="feature-card-gradient-overlay" />
                  </div>

                  <Card.Body className="d-flex flex-column align-items-center text-center">
                    <Card.Title className="feature-card-title">{feature.title}</Card.Title>
                    <Card.Text className="feature-card-desc mt-1">{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="section-badge">
                  <FaTrophy className="badge-icon" /> Why Choose Us
                </div>
                <h2>Why <span className="highlight">YOUR GYM  </span> Stands Out</h2>
                <p>Our gym management system is designed to help you save time, increase revenue, and provide an exceptional experience for your members.</p>
                <div className="benefits-list">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      className="benefit-item"
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ x: 10 }}
                    >
                      <FiCheckIcon className="check-icon" />
                      <span>{benefit}</span>
                    </motion.div>
                  ))}
                </div>
                <Button className="mt-4 demo-btn" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  See All Benefits
                  <FiArrowRightIcon className="btn-icon" />
                </Button>
              </motion.div>
            </Col>
            <Col lg={6}>
              <motion.div
                className="benefits-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="stats-container">
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="stat-icon">
                      <FaTrophy />
                    </div>
                    <div className="stat-number">40%</div>
                    <div className="stat-label">Member Retention Increase</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="stat-icon">
                      <FaFire />
                    </div>
                    <div className="stat-number">15+</div>
                    <div className="stat-label">Hours Saved Weekly</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="stat-icon">
                      <FaChartLine />
                    </div>
                    <div className="stat-number">99.9%</div>
                    <div className="stat-label">System Uptime</div>
                  </motion.div>
                </div>
                <motion.div
                  className="testimonial-preview"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="quote-icon">
                    <FaQuoteLeft />
                  </div>
                  <p>"This system has transformed how we run our gym. Member retention has increased by 40% since implementation."</p>
                  <div className="author">
                    <img src={testimonialRahul} alt="Author" className="author-avatar" />
                    <div className="author-info">
                      <div className="author-name">Rahul Sharma</div>
                      <div className="author-role">Gym Owner</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-badge">
              <FaStar className="badge-icon" /> Client Testimonials
            </div>
            <h2>What Our <span className="highlight">Clients Say</span></h2>
            <p>Join thousands of satisfied gym owners and managers</p>
          </motion.div>
          <div className="testimonials-marquee-wrapper">
            <div className="testimonials-track">
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  className="testimonial-card"
                  key={index}
                >
                  <div className="testimonial-header">
                    <img src={testimonial.avatar} alt={testimonial.name} className="testimonial-avatar" />
                    <div className="testimonial-info">
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="rating-row d-flex align-items-center flex-nowrap gap-2 mb-2 text-nowrap">
                    <div className="rating d-inline-flex align-items-center flex-nowrap me-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < testimonial.rating ? "star filled" : "star"}
                        />
                      ))}
                    </div>
                    <span className="text-warning fw-bold small text-nowrap">5.0</span>
                    <span className="text-secondary small text-nowrap">• {testimonial.time}</span>
                  </div>

                  <p className="testimonial-content mb-0">{testimonial.content}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <Container style={{ maxWidth: '1440px' }}>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-badge" style={{ border: '1px solid rgba(234, 88, 12, 0.4)', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
              <FaCreditCard className="badge-icon" /> Flexible Pricing
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginTop: '12px', marginBottom: '8px' }}>
              Choose Your Perfect Plan
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#f59e0b', maxWidth: '680px', margin: '0 auto 24px auto', opacity: 0.9 }}>
              All plans include our core Gym Management features. Choose a plan based on your business size.
            </p>
          </motion.div>
          <div className="pricing-container">
            {renderPricingCards()}
          </div>

          {/* Collapsible Full Feature Comparison Matrix */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowComparisonTable(prev => !prev)}
              style={{
                background: 'rgba(234, 88, 12, 0.12)',
                border: '1px solid rgba(234, 88, 12, 0.45)',
                color: '#fdba74',
                padding: '10px 24px',
                borderRadius: '30px',
                fontSize: '0.88rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(234, 88, 12, 0.25)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(234, 88, 12, 0.12)';
                e.currentTarget.style.color = '#fdba74';
              }}
            >
              <span>{showComparisonTable ? 'Hide Detailed Plan Comparison ∧' : 'Compare All Plans & Detailed Features ∨'}</span>
            </button>
          </div>

          {showComparisonTable && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-4 table-responsive"
              style={{
                background: 'linear-gradient(180deg, #1b0e07 0%, #120804 100%)',
                border: '1px solid #331a0e',
                borderRadius: '16px',
                padding: '24px 20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              <h4 style={{ color: '#fed7aa', fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                Complete Plan & Feature Comparison Matrix
              </h4>
              <table className="table table-dark table-hover mb-0" style={{ backgroundColor: 'transparent', color: '#e2e8f0', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ea580c' }}>
                    <th style={{ backgroundColor: 'transparent', color: '#ea580c', fontWeight: '700', padding: '12px 16px' }}>Features</th>
                    <th style={{ backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', textAlign: 'center', padding: '12px 16px' }}>Free Trial</th>
                    <th style={{ backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', textAlign: 'center', padding: '12px 16px' }}>Starter</th>
                    <th style={{ backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', fontWeight: '800', textAlign: 'center', padding: '12px 16px' }}>Growth (Most Popular)</th>
                    <th style={{ backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', textAlign: 'center', padding: '12px 16px' }}>Pro</th>
                    <th style={{ backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', textAlign: 'center', padding: '12px 16px' }}>Custom</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Monthly Price', trial: '₹0', starter: '₹700', growth: '₹900', pro: '₹1,200', custom: 'Custom' },
                    { feature: 'Members', trial: '5', starter: '20', growth: '50', pro: '150', custom: 'Custom' },
                    { feature: 'Staff Users', trial: '2', starter: '3', growth: '5', pro: '10', custom: 'Custom' },
                    { feature: 'Branches', trial: '1', starter: '1', growth: '1', pro: '3', custom: 'Custom' },
                    { feature: 'Admin Users', trial: '1', starter: '1', growth: '2', pro: '3', custom: 'Custom' },
                    { feature: 'Member Management', trial: '✓', starter: '✓', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'Membership Plans', trial: '✓', starter: '✓', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'Manual Attendance', trial: '✓', starter: '✓', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'QR Attendance', trial: '—', starter: '—', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'Biometric Attendance', trial: '—', starter: '—', growth: '—', pro: '✓', custom: '✓' },
                    { feature: 'Payment & Invoicing', trial: '✓', starter: '✓', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'Expense Management', trial: '—', starter: '✓', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'Trainer Management', trial: '—', starter: '✓', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'Advanced Reports', trial: '—', starter: '—', growth: '✓', pro: '✓', custom: '✓' },
                    { feature: 'WhatsApp Integration', trial: '—', starter: '—', growth: '—', pro: '✓', custom: '✓' },
                    { feature: 'Multi-Branch Dashboard', trial: '—', starter: '—', growth: '—', pro: '✓', custom: '✓' },
                    { feature: 'Custom Branding', trial: '—', starter: '—', growth: '—', pro: '—', custom: '✓' }
                  ].map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #2d180d' }}>
                      <td style={{ backgroundColor: 'transparent', fontWeight: '600', color: '#fed7aa', padding: '11px 16px' }}>{row.feature}</td>
                      <td style={{ backgroundColor: 'transparent', textAlign: 'center', padding: '11px 16px', color: row.trial === '✓' ? '#eab308' : (row.trial === '—' ? '#64748b' : '#ffffff'), fontWeight: row.trial === '✓' ? '700' : '500' }}>{row.trial}</td>
                      <td style={{ backgroundColor: 'transparent', textAlign: 'center', padding: '11px 16px', color: row.starter === '✓' ? '#eab308' : (row.starter === '—' ? '#64748b' : '#ffffff'), fontWeight: row.starter === '✓' ? '700' : '500' }}>{row.starter}</td>
                      <td style={{ backgroundColor: 'rgba(234, 88, 12, 0.05)', textAlign: 'center', padding: '11px 16px', color: row.growth === '✓' ? '#eab308' : (row.growth === '—' ? '#64748b' : '#ea580c'), fontWeight: '700' }}>{row.growth}</td>
                      <td style={{ backgroundColor: 'transparent', textAlign: 'center', padding: '11px 16px', color: row.pro === '✓' ? '#eab308' : (row.pro === '—' ? '#64748b' : '#ffffff'), fontWeight: row.pro === '✓' ? '700' : '500' }}>{row.pro}</td>
                      <td style={{ backgroundColor: 'transparent', textAlign: 'center', padding: '11px 16px', color: row.custom === '✓' ? '#eab308' : (row.custom === '—' ? '#64748b' : '#ffffff'), fontWeight: row.custom === '✓' ? '700' : '500' }}>{row.custom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="cta-badge">Ready to get started?</div>
            <h2>Transform Your Gym <span className="highlight">Today</span></h2>
            <p>Join thousands of gym owners who have already streamlined their operations with YOUR GYM.</p>
            <div className="cta-buttons">
              <Button variant="light" size="lg" className="mr-3" onClick={() => handlePurchaseClick('7-Day Free Trial')}>
                Start Free Trial
                <FiArrowRightIcon className="btn-icon" />
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer" style={{ backgroundColor: '#090d16', color: '#94a3b8', paddingTop: '60px', paddingBottom: '30px' }}>
        <Container>
          <Row className="gy-4 justify-content-between">
            {/* Column 1: Brand & Bio */}
            <Col lg={5} md={12} className="mb-4 mb-lg-0">
              <div className="d-flex align-items-center mb-3">
                <img src={Logo} alt="YOUR GYM Logo" style={{ height: '42px', width: 'auto', marginRight: '14px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                <span className="brand-title-text footer-brand-title" style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  YOUR <span className="brand-gym-highlight" style={{ color: '#f97316' }}>GYM</span>
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px', maxWidth: '380px' }}>
                The complete all-in-one gym management platform designed to streamline memberships, workouts, attendance, and billing effortlessly.
              </p>
              <div className="d-flex align-items-center gap-3">
                <a href="https://www.instagram.com/kiaan_technology4/" target="_blank" rel="noopener noreferrer" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', textDecoration: 'none' }}>
                  <FaInstagram size={18} />
                </a>
                <a href="https://www.linkedin.com/company/kiaan-technology-pvt-ltd/posts/?feedView=all" target="_blank" rel="noopener noreferrer" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', textDecoration: 'none' }}>
                  <FaLinkedin size={18} />
                </a>
                <a href="https://www.youtube.com/@kiaantechnology-r3p" target="_blank" rel="noopener noreferrer" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', textDecoration: 'none' }}>
                  <FaYoutube size={18} />
                </a>
                <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', textDecoration: 'none' }}>
                  <FaGlobe size={18} />
                </a>
              </div>
            </Col>

            {/* Column 2: Quick Links */}
            <Col lg={3} md={6} sm={6} className="mb-4 mb-md-0">
              <h5 style={{ color: '#ffffff', fontWeight: '600', fontSize: '1.05rem', marginBottom: '20px' }}>Quick Links</h5>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.92rem' }}>
                <li><a href="#home" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</a></li>
                <li><a href="#benefits" style={{ color: '#94a3b8', textDecoration: 'none' }}>About Us</a></li>
                <li><a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none' }}>Pricing</a></li>
                <li><a href="#features" style={{ color: '#94a3b8', textDecoration: 'none' }}>Blog</a></li>
                <li><a href="#contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact</a></li>
                <li><Link to="/delete-account" style={{ color: '#f87171', textDecoration: 'none', fontWeight: '500' }}>Delete Account</Link></li>
              </ul>
            </Col>

            {/* Column 3: Contact Us */}
            <Col lg={4} md={6} sm={6}>
              <h5 style={{ color: '#ffffff', fontWeight: '600', fontSize: '1.05rem', marginBottom: '20px' }}>Contact Us</h5>
              <div className="d-flex flex-column gap-3" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                <div className="d-flex align-items-start gap-2">
                  <FaMapMarkerAlt style={{ color: '#818cf8', marginTop: '4px', flexShrink: 0 }} size={16} />
                  <span>2341/E, Sudama Nagar, Indore, M.P.</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <FaPhoneAlt style={{ color: '#818cf8', flexShrink: 0 }} size={15} />
                  <a href="tel:+919752100980" style={{ color: '#94a3b8', textDecoration: 'none' }}>+91-97521 00980</a>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <FaEnvelope style={{ color: '#818cf8', flexShrink: 0 }} size={15} />
                  <a href="mailto:info@kiaantechnology.com" style={{ color: '#94a3b8', textDecoration: 'none' }}>info@kiaantechnology.com</a>
                </div>
              </div>
            </Col>
          </Row>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid #1e293b', marginTop: '50px', paddingTop: '24px' }} className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
              <div>&copy; {new Date().getFullYear()} YOUR GYM. All rights reserved.</div>
              <div style={{ color: '#3b82f6', fontWeight: '600', marginTop: '4px' }}>
                Powered by Kiaan Technology
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-3 gap-md-4" style={{ fontSize: '0.85rem' }}>
              <Link to="/privacy-policy" style={{ color: '#64748b', cursor: 'pointer', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link to="/terms-of-service" style={{ color: '#64748b', cursor: 'pointer', textDecoration: 'none' }}>Terms & Conditions</Link>
              <Link to="/delete-account" style={{ color: '#f87171', cursor: 'pointer', textDecoration: 'none' }}>Delete Account</Link>
            </div>
          </div>
        </Container>
      </footer>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
            <div className="modal-content" style={{ backgroundColor: '#180903', borderRadius: '18px', border: '1px solid rgba(249, 115, 22, 0.35)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 35px rgba(234, 88, 12, 0.25), 0 25px 60px rgba(0,0,0,0.85)' }}>
              <div className="modal-header border-0 pb-2 pt-3 px-4" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}>
                <h2 className="modal-title fw-bold" style={{ color: '#ffffff', fontSize: '1.3rem', margin: 0 }}>
                  {purchaseStep === 'register' ? 'Complete Your Purchase' :
                    purchaseStep === 'payment' ? 'Checkout' :
                      purchaseStep === 'processing' ? 'Processing Payment' : 'Payment Success!'}
                </h2>
                {purchaseStep !== 'processing' && purchaseStep !== 'success' && (
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowPurchaseModal(false);
                      setPurchaseStep('register');
                    }}
                    style={{ fontSize: '0.85rem' }}
                  ></button>
                )}
              </div>
              <div className="modal-body px-4 py-3" style={{ backgroundColor: '#180903', overflowY: 'auto', maxHeight: 'calc(90vh - 65px)' }}>
                {purchaseStep === 'register' && (
                  <>
                    {/* 1. Selected Plan */}
                    <div className="mb-3">
                      <label className="form-label mb-1" style={{ color: '#fed7aa', fontSize: '0.85rem', fontWeight: '600' }}>
                        Selected Plan
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={purchaseFormData.selectedPlan}
                        readOnly
                        disabled
                        style={{
                          border: '1px solid #7c2d12',
                          borderRadius: '10px',
                          padding: '9px 14px',
                          fontSize: '0.92rem',
                          backgroundColor: '#110502',
                          color: '#ea580c',
                          fontWeight: '700',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>

                    {/* 2. Email Address * */}
                    <div className="mb-3">
                      <label className="form-label mb-1" style={{ color: '#fed7aa', fontSize: '0.85rem', fontWeight: '600' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="your@email.com"
                        value={purchaseFormData.email}
                        onChange={handlePurchaseFormChange}
                        style={{
                          backgroundColor: '#271107',
                          color: '#ffffff',
                          border: '1px solid #7c2d12',
                          borderRadius: '10px',
                          padding: '9px 14px',
                          fontSize: '0.92rem'
                        }}
                        required
                      />
                    </div>

                    {/* 3. Password * with Eye Icon */}
                    <div className="mb-3">
                      <label className="form-label mb-1" style={{ color: '#fed7aa', fontSize: '0.85rem', fontWeight: '600' }}>
                        Password *
                      </label>
                      <div className="position-relative">
                        <input
                          type={showPurchasePassword ? "text" : "password"}
                          name="password"
                          className="form-control"
                          placeholder="Password"
                          value={purchaseFormData.password}
                          onChange={handlePurchaseFormChange}
                          style={{
                            backgroundColor: '#271107',
                            color: '#ffffff',
                            border: '1px solid #7c2d12',
                            borderRadius: '10px',
                            padding: '9px 42px 9px 14px',
                            fontSize: '0.92rem'
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPurchasePassword(!showPurchasePassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#fed7aa',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={showPurchasePassword ? "Hide password" : "Show password"}
                        >
                          {showPurchasePassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* 4. Confirm Password * with Eye Icon */}
                    <div className="mb-3">
                      <label className="form-label mb-1" style={{ color: '#fed7aa', fontSize: '0.85rem', fontWeight: '600' }}>
                        Confirm Password *
                      </label>
                      <div className="position-relative">
                        <input
                          type={showPurchaseConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          className="form-control"
                          placeholder="Confirm Password"
                          value={purchaseFormData.confirmPassword || ''}
                          onChange={handlePurchaseFormChange}
                          style={{
                            backgroundColor: '#271107',
                            color: '#ffffff',
                            border: purchaseFormData.confirmPassword && purchaseFormData.password !== purchaseFormData.confirmPassword ? '1px solid #ef4444' : '1px solid #7c2d12',
                            borderRadius: '10px',
                            padding: '9px 42px 9px 14px',
                            fontSize: '0.92rem'
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPurchaseConfirmPassword(!showPurchaseConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#fed7aa',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={showPurchaseConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showPurchaseConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                      {purchaseFormData.confirmPassword && purchaseFormData.password !== purchaseFormData.confirmPassword && (
                        <small className="text-danger mt-1 d-block" style={{ fontSize: '0.8rem' }}>
                          Passwords do not match
                        </small>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const cleanEmail = (purchaseFormData.email || '').trim();
                        const cleanPassword = purchaseFormData.password || '';
                        const cleanConfirm = purchaseFormData.confirmPassword || '';

                        if (!cleanEmail) {
                          alert("Please enter your email address.");
                          return;
                        }
                        if (!cleanPassword) {
                          alert("Please enter a password.");
                          return;
                        }
                        if (cleanPassword !== cleanConfirm) {
                          alert("Passwords do not match.");
                          return;
                        }

                        const lowerPlan = (purchaseFormData.selectedPlan || '').toLowerCase();
                        const isTrial = lowerPlan.includes('trial') || lowerPlan.includes('free') || lowerPlan.includes('1 day') || lowerPlan.includes('10 day');
                        if (isTrial) {
                          handlePurchaseSubmit(true); // Direct submit for free trial (bypasses Razorpay ₹0 order)
                        } else {
                          handlePurchaseSubmit(false); // Triggers Razorpay payment flow for paid plans
                        }
                      }}
                      className="btn w-100 py-2 fw-semibold mt-2 mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
                      }}
                    >
                      {((purchaseFormData.selectedPlan || '').toLowerCase().includes('trial') || (purchaseFormData.selectedPlan || '').toLowerCase().includes('free') || (purchaseFormData.selectedPlan || '').toLowerCase().includes('1 day') || (purchaseFormData.selectedPlan || '').toLowerCase().includes('10 day')) 
                        ? 'Activate Free Trial' 
                        : (isAndroidNativeApp() ? 'Subscribe with Google Play' : 'Proceed to Payment (Razorpay)')}
                    </button>
                  </>
                )}

                {/* Simulated Processing Step */}
                {purchaseStep === 'processing' && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-4" role="status" style={{ width: '4rem', height: '4rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h4 className="fw-bold">Processing Your Request</h4>
                    <p className="text-muted">Please wait...</p>
                  </div>
                )}

                {/* Simulated Success Step */}
                {purchaseStep === 'success' && (
                  <div className="text-center py-5">
                    <div className="mb-4 d-inline-flex justify-content-center align-items-center rounded-circle bg-success text-white" style={{ width: '80px', height: '80px' }}>
                      <FaCheck size={40} />
                    </div>
                    {((purchaseFormData.selectedPlan || '').toLowerCase().includes('trial') || (purchaseFormData.selectedPlan || '').toLowerCase().includes('free') || (purchaseFormData.selectedPlan || '').toLowerCase().includes('1 day') || (purchaseFormData.selectedPlan || '').toLowerCase().includes('10 day')) ? (
                      <>
                        <h3 className="fw-bold text-success">7-Day Free Trial Account Created!</h3>
                        <p className="text-muted mb-1">Your free trial account has been activated successfully.</p>
                        <p className="text-muted small mt-2">Redirecting to login page...</p>
                      </>
                    ) : (
                      <>
                        <h3 className="fw-bold text-success">Payment Successful!</h3>
                        {purchaseTxnId && <p className="text-muted mb-2">Transaction ID: <span className="fw-bold text-dark">{purchaseTxnId}</span></p>}
                        <p className="text-muted mb-0">Activating your gym software license instantly...</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <motion.div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white rounded-4 p-5 text-center"
            style={{
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
              >
                <FaCheck size={40} />
              </div>
            </div>
            <h2 className="mb-3" style={{ color: '#1a202c', fontWeight: 'bold' }}>
              Request Sent Successfully!
            </h2>
            <p className="mb-4" style={{ color: '#4a5568', fontSize: '1.1rem' }}>
              Thank you for your purchase request. We've received your information and will contact you shortly to complete the setup process.
            </p>
            <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: '#f7fafc' }}>
              <h5 className="mb-2" style={{ color: '#2d3748' }}>Order Details:</h5>
              <div className="text-start">
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Plan:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.selectedPlan || purchaseFormData.selectedPlan}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Gym Name:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.companyName || purchaseFormData.companyName}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Email:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.email || purchaseFormData.email}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Billing:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.billingDuration || purchaseFormData.billingDuration}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#718096' }}>Start Date:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.startDate || purchaseFormData.startDate}</span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              className="px-4 py-2"
              style={{
                backgroundColor: '#60a5fa',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500'
              }}
              onClick={() => setShowSuccessNotification(false)}
            >
              Got it
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* SaaS Demo Lead Capture Modal */}
      {showDemoModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content" style={{ backgroundColor: '#180903', borderRadius: '18px', border: '1px solid rgba(249, 115, 22, 0.35)', overflow: 'hidden', boxShadow: '0 0 35px rgba(234, 88, 12, 0.25), 0 25px 60px rgba(0,0,0,0.85)' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', padding: '20px 24px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{ color: '#ffffff', fontWeight: '700', margin: 0, fontSize: '1.3rem' }}>🎨 Customize Your Website & App</h4>
                    <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', fontSize: '13px' }}>Get custom logo, branding, features & workflows tailored for your gym</p>
                  </div>
                  <button className="btn-close btn-close-white" onClick={() => setShowDemoModal(false)} />
                </div>
              </div>

              {/* Body */}
              <div className="modal-body" style={{ padding: '24px 28px', backgroundColor: '#180903' }}>
                {demoSuccess ? (
                  <div className="text-center py-3">
                    <div style={{ fontSize: '52px' }}>✅</div>
                    <h5 style={{ color: '#22c55e', fontWeight: '700', marginTop: '12px' }}>Request Received!</h5>
                    <p style={{ color: '#fed7aa', fontSize: '14px' }}>Opening WhatsApp... Our team will contact you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleDemoLeadSubmit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#fed7aa', marginBottom: '6px', display: 'block' }}>
                          Full Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text" className="form-control" placeholder="Your full name"
                          value={demoForm.fullName}
                          onChange={e => setDemoForm(p => ({ ...p, fullName: e.target.value }))}
                          style={{ backgroundColor: '#271107', color: '#ffffff', borderRadius: '10px', border: '1px solid #7c2d12', padding: '10px 14px', fontSize: '14px' }}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#fed7aa', marginBottom: '6px', display: 'block' }}>
                          Phone <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="tel" className="form-control" placeholder="Mobile number"
                          value={demoForm.phone}
                          onChange={e => setDemoForm(p => ({ ...p, phone: e.target.value }))}
                          style={{ backgroundColor: '#271107', color: '#ffffff', borderRadius: '10px', border: '1px solid #7c2d12', padding: '10px 14px', fontSize: '14px' }}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#fed7aa', marginBottom: '6px', display: 'block' }}>Email</label>
                        <input
                          type="email" className="form-control" placeholder="Email address"
                          value={demoForm.email}
                          onChange={e => setDemoForm(p => ({ ...p, email: e.target.value }))}
                          style={{ backgroundColor: '#271107', color: '#ffffff', borderRadius: '10px', border: '1px solid #7c2d12', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#fed7aa', marginBottom: '6px', display: 'block' }}>Gym Name</label>
                        <input
                          type="text" className="form-control" placeholder="Your gym name"
                          value={demoForm.gymName}
                          onChange={e => setDemoForm(p => ({ ...p, gymName: e.target.value }))}
                          style={{ backgroundColor: '#271107', color: '#ffffff', borderRadius: '10px', border: '1px solid #7c2d12', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#fed7aa', marginBottom: '6px', display: 'block' }}>City</label>
                        <input
                          type="text" className="form-control" placeholder="Your city"
                          value={demoForm.city}
                          onChange={e => setDemoForm(p => ({ ...p, city: e.target.value }))}
                          style={{ backgroundColor: '#271107', color: '#ffffff', borderRadius: '10px', border: '1px solid #7c2d12', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>
                      <div className="col-12">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#fed7aa', marginBottom: '6px', display: 'block' }}>Interested Plan</label>
                        <select
                          className="form-select"
                          value={demoLeadPlan}
                          onChange={e => setDemoLeadPlan(e.target.value)}
                          style={{ backgroundColor: '#271107', color: '#ffffff', borderRadius: '10px', border: '1px solid #7c2d12', padding: '10px 14px', fontSize: '14px' }}
                        >
                          <option value="" style={{ backgroundColor: '#180903', color: '#ffffff' }}>-- Select a plan (optional) --</option>
                          {plans.length > 0 ? (
                            <>
                              {plans.map(p => (
                                <option key={p.id} value={p.name} style={{ backgroundColor: '#180903', color: '#ffffff' }}>
                                  {p.name}
                                </option>
                              ))}
                              {!plans.some(p => p.name === 'Custom Plan') && (
                                <option value="Custom Plan" style={{ backgroundColor: '#180903', color: '#ffffff' }}>
                                  Custom Plan
                                </option>
                              )}
                              {demoLeadPlan && demoLeadPlan !== 'Custom Plan' && !plans.some(p => p.name === demoLeadPlan) && (
                                <option value={demoLeadPlan} style={{ backgroundColor: '#180903', color: '#ffffff' }}>
                                  {demoLeadPlan}
                                </option>
                              )}
                            </>
                          ) : (
                            ['Basic', 'Growth', 'Premium', '7-Day Free Trial', 'Custom Plan'].map(p => (
                              <option key={p} value={p} style={{ backgroundColor: '#180903', color: '#ffffff' }}>
                                {p}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={demoSubmitting}
                      style={{
                        marginTop: '20px', width: '100%', padding: '12px',
                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        color: '#fff', border: 'none', borderRadius: '12px',
                        fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                        opacity: demoSubmitting ? 0.7 : 1,
                        boxShadow: '0 4px 15px rgba(234, 88, 12, 0.4)'
                      }}
                    >
                      {demoSubmitting ? '⏳ Submitting...' : '🚀 Submit Customization Request + Open WhatsApp'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#fed7aa', opacity: 0.8, marginTop: '10px', marginBottom: 0 }}>
                      We'll also send a WhatsApp message confirmation
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div
            style={{
              maxWidth: '750px',
              width: '100%',
              maxHeight: '85vh',
              backgroundColor: '#160904',
              borderRadius: '16px',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              boxShadow: '0 0 35px rgba(234, 88, 12, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(249, 115, 22, 0.2)', backgroundColor: '#210d05' }}>
              <div>
                <h2 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.5rem', marginBottom: '4px' }}>Privacy Policy</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0' }}>Last Updated: 8/5/2026</p>
              </div>
              <button
                type="button"
                className="policy-modal-close-btn"
                onClick={() => setShowPrivacyModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="policy-modal-scroll" style={{ padding: '24px', overflowY: 'auto', color: '#e2e8f0', fontSize: '0.92rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                Welcome to <strong style={{ color: '#ffffff' }}>Kiaan Technology Private Limited</strong>. This Privacy Policy outlines how we collect, use, process, and protect your personal information when you use our website (<a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', textDecoration: 'underline' }}>https://kiaantechnology.com/</a>), SaaS platforms, mobile applications, and services (including Payroll Management, HRMS, Job Portals, and Payment Integration). By using our services, you agree to the collection and use of information in accordance with this policy. This policy complies with the Indian IT Act 2000, DPDP Act 2023, GDPR, and app store guidelines.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>1. Information Collection</h5>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: '#e2e8f0' }}>
                <li style={{ marginBottom: '6px' }}><strong style={{ color: '#ffffff' }}>Personal Data:</strong> Name, email address, phone number, physical address, KYC documents, etc.</li>
                <li style={{ marginBottom: '6px' }}><strong style={{ color: '#ffffff' }}>Professional Data:</strong> Employee ID, designation, salary details, and resume data for HRMS and Job portals.</li>
                <li style={{ marginBottom: '6px' }}><strong style={{ color: '#ffffff' }}>Usage Data:</strong> IP address, browser type, device identifiers, and platform usage metrics.</li>
              </ul>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>2. Personal Data Usage</h5>
              <p style={{ marginBottom: '8px', color: '#e2e8f0' }}>We use your data to:</p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: '#e2e8f0' }}>
                <li style={{ marginBottom: '4px' }}>Provide, operate, and maintain our software solutions.</li>
                <li style={{ marginBottom: '4px' }}>Process payroll, attendance, and recruitment functionalities.</li>
                <li style={{ marginBottom: '4px' }}>Improve and personalize user experience.</li>
                <li style={{ marginBottom: '4px' }}>Communicate regarding updates, security alerts, and support.</li>
              </ul>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>3. Cookies Policy</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>4. Data Retention</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy, complying with legal obligations, resolving disputes, and enforcing our legal agreements.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>5. Data Security</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We implement industry-standard security measures (including encryption and secure server infrastructure) to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>6. User Rights</h5>
              <p style={{ marginBottom: '8px', color: '#e2e8f0' }}>Depending on your jurisdiction (e.g., GDPR, DPDP), you have the right to:</p>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: '#e2e8f0' }}>
                <li style={{ marginBottom: '4px' }}>Access, update, or delete your personal data.</li>
                <li style={{ marginBottom: '4px' }}>Withdraw consent at any time.</li>
                <li style={{ marginBottom: '4px' }}>Object to the processing of your data.</li>
                <li style={{ marginBottom: '4px' }}>Request data portability.</li>
              </ul>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>7. Third-Party Services</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We may employ third-party companies (such as Razorpay for payments) to facilitate our service. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>8. Analytics & Tracking</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We may use third-party Service Providers to monitor and analyze the use of our service to improve our offerings.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>9. Children's Privacy</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                Our services are not intended for use by children under the age of 18. We do not knowingly collect personally identifiable information from children.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>10. International Data Transfers</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state or country where data protection laws may differ. By consenting to this policy, you agree to that transfer.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>11. Changes to Policy</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>12. Contact Information</h5>
              <p style={{ marginBottom: '8px', color: '#e2e8f0' }}>If you have any questions about this Privacy Policy, please contact us:</p>
              <div style={{ padding: '16px', backgroundColor: 'rgba(249, 115, 22, 0.08)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)', color: '#e2e8f0' }}>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Company:</strong> Kiaan Technology Private Limited</p>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Address:</strong> 2341/E, Sudama Nagar, Indore, Madhya Pradesh, India</p>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Phone:</strong> +91-97521 00980</p>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Email:</strong> info@kiaantechnology.com</p>
                <p style={{ marginBottom: '0' }}><strong style={{ color: '#ffffff' }}>Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', textDecoration: 'underline' }}>https://kiaantechnology.com/</a></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TERMS & CONDITIONS MODAL */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#160904',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            boxShadow: '0 0 35px rgba(234, 88, 12, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: '#e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#210d05'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#f97316', fontWeight: '700', fontSize: '1.5rem', marginBottom: '4px' }}>Terms & Conditions</h3>
                <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Last Updated: 8/5/2026</small>
              </div>
              <button
                type="button"
                className="policy-modal-close-btn"
                onClick={() => setShowTermsModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="policy-modal-scroll" style={{ padding: '24px', overflowY: 'auto', fontSize: '0.92rem', lineHeight: '1.6', color: '#e2e8f0' }}>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                Welcome to <strong style={{ color: '#ffffff' }}>Kiaan Technology Private Limited</strong>. These Terms & Conditions govern your access to and use of our website (<a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', textDecoration: 'underline' }}>https://kiaantechnology.com/</a>), SaaS platforms, mobile applications, and gym management services. By accessing or using our services, you agree to comply with these terms.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>1. User Account & Registration</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                To access SaaS features, users must register an account with accurate business details. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>2. Subscription Plans & Payment Terms</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                Subscription fees are payable in advance based on the plan selected. All payment processing is securely handled via integrated payment gateways (such as Razorpay). Rates and taxes comply with Indian IT Act 2000 guidelines.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>3. Free Trial Policy</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                Free trial accounts are provided for demonstration purposes. Trial access duration is strictly limited (1 Day or as specified). Each email address is eligible for only one free trial. Upon expiration, access requires plan subscription.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>4. Acceptable Use</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                You agree not to use the services for any unlawful purpose, interfere with system operations, reverse engineer components, or transmit unauthorized data under DPDP Act 2023 and GDPR guidelines.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>5. Intellectual Property</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                All software code, visual design, logos, trademarks, and content provided by Kiaan Technology Private Limited remain the exclusive property of Kiaan Technology.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>6. Termination & Limitation of Liability</h5>
              <p style={{ marginBottom: '16px', color: '#e2e8f0' }}>
                We reserve the right to suspend or terminate service access for violations of these terms. In no event shall Kiaan Technology be liable for indirect or consequential damages arising out of service usage.
              </p>

              <h5 style={{ color: '#f97316', fontWeight: '700', fontSize: '1.05rem', marginTop: '20px', marginBottom: '8px' }}>7. Contact Information</h5>
              <p style={{ marginBottom: '8px', color: '#e2e8f0' }}>For any queries regarding these Terms & Conditions, please reach out to us:</p>
              <div style={{ padding: '16px', backgroundColor: 'rgba(249, 115, 22, 0.08)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)', color: '#e2e8f0' }}>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Company:</strong> Kiaan Technology Private Limited</p>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Address:</strong> 2341/E, Sudama Nagar, Indore, Madhya Pradesh, India</p>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Phone:</strong> +91-97521 00980</p>
                <p style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Email:</strong> info@kiaantechnology.com</p>
                <p style={{ marginBottom: '0' }}><strong style={{ color: '#ffffff' }}>Website:</strong> <a href="https://kiaantechnology.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', textDecoration: 'underline' }}>https://kiaantechnology.com/</a></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING WHATSAPP CHAT BUTTON ── */}
      <a
        href="https://wa.me/919752100980?text=Hi%2C%20I%20want%20to%20know%20more%20about%20Gym%20Management%20Software."
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="whatsapp-float-icon" />
        <span className="whatsapp-float-text">Chat with us</span>
      </a>

    </div>
  );
};

export default LendingPage;