import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { FaCrown, FaCheck, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SubscriptionCheckoutModal from "../../Components/Payment/SubscriptionCheckoutModal";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../Context/CurrencyContext";
import { isAndroidNativeApp, initiateGooglePlaySubscription, restoreGooglePlayPurchases, resolvePlayBillingSku } from "../../services/playBillingService";

const AdminMySubscription = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [billingDuration, setBillingDuration] = useState("Yearly");
  const [amount, setAmount] = useState("");
  
  // Real Production Checkout Modal State
  const [showRealCheckout, setShowRealCheckout] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState(null);
  
  // Payment Gateway simulation states
  const [paymentStep, setPaymentStep] = useState('confirm'); // 'confirm' | 'gateway' | 'processing' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [user, setUser] = useState(null);
  const [generatedTxnId, setGeneratedTxnId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [superAdminContact, setSuperAdminContact] = useState({ phone: null, email: null });
  const [automationSettings, setAutomationSettings] = useState({
    trialDurationDays: 7,
    gracePeriodDays: 3,
    quarterlyDiscount: 5,
    yearlyDiscount: 15
  });

  const translatePlanName = (planName) => {
    if (!planName) return "";
    const lower = planName.toLowerCase().trim();
    
    // Trial plan check
    if (lower.includes("trial") || lower.includes("prueba") || lower.includes("essai") || lower.includes("تجريب")) {
      if (lower.includes("7")) {
        return t("subscription.plans.trial7Day", "7-Day Free Trial");
      }
      return t("subscription.plans.trial", "Trial");
    }

    const map = {
      "starter": t("subscription.plans.starter", "Starter"),
      "basic": t("subscription.plans.basic", "Basic"),
      "growth": t("subscription.plans.growth", "Growth"),
      "pro": t("subscription.plans.pro", "Pro"),
      "bronz": t("subscription.plans.bronze", "Bronze"),
      "bronze": t("subscription.plans.bronze", "Bronze"),
      "silver": t("subscription.plans.silver", "Silver"),
      "gold": t("subscription.plans.gold", "Gold"),
      "platinum": t("subscription.plans.platinum", "Platinum"),
      "custom": t("subscription.plans.custom", "Custom"),
      "custom plan": t("subscription.plans.customPlan", "Custom Plan")
    };
    return map[lower] || t(`subscription.plans.${lower}`, planName);
  };

  const translateDuration = (duration) => {
    if (!duration) return "";
    const lower = duration.toLowerCase().trim();
    const map = {
      "monthly": t("common.monthly", "Monthly"),
      "month": t("common.monthly", "Monthly"),
      "yearly": t("common.yearly", "Yearly"),
      "year": t("common.yearly", "Yearly"),
      "anual": t("common.yearly", "Yearly"),
      "annual": t("common.yearly", "Yearly"),
      "quarterly": t("common.quarterly", "Quarterly"),
      "quarter": t("common.quarterly", "Quarterly"),
      "days": t("common.days", "Days"),
      "7 days": t("common.days7", "7 Days"),
      "7 day": t("common.days7", "7 Days"),
      "7days": t("common.days7", "7 Days"),
      "14 days": t("common.days14", "14 Days"),
      "30 days": t("common.days30", "30 Days")
    };
    if (map[lower]) return map[lower];

    const matchDays = lower.match(/^(\d+)\s*days?$/);
    if (matchDays) {
      return t("common.numDays", "{{count}} Days", { count: matchDays[1] });
    }

    return t(`common.${lower}`, duration);
  };

  const translateFeature = (feature) => {
    if (!feature) return "";
    const trimmed = feature.trim();
    const lower = trimmed.toLowerCase();

    // Pattern 1: "Up to X Members" or "Up to X"
    const upToMatch = trimmed.match(/^Up\s+to\s+([\d,]+|\w+)\s+Members$/i) || trimmed.match(/^Up\s+to\s+([\d,]+|\w+)$/i);
    if (upToMatch) {
      return t("subscription.features.upToMembers", "Up to {{count}} Members", { count: upToMatch[1] });
    }

    // Pattern 2: "Staff X Members", "X Staff Members", "X Staff", "Staff X"
    const staffMatch = trimmed.match(/^([\d,]+|\w+)\s+Staff(\s+Members)?$/i) || trimmed.match(/^Staff\s+([\d,]+|\w+)(\s+Members)?$/i);
    if (staffMatch) {
      const count = staffMatch[1];
      return t("subscription.features.staffMembers", "{{count}} Staff Members", { count });
    }

    // Pattern 3: "Gym X Branches", "X Gym Branches", "Gym X Branch", "X Gym Branch", "X Branches"
    const gymMatch = trimmed.match(/^([\d,]+|\w+)\s+Gym\s+Branch(es)?$/i) || 
                     trimmed.match(/^Gym\s+([\d,]+|\w+)\s+Branch(es)?$/i) || 
                     trimmed.match(/^([\d,]+|\w+)\s+Branch(es)?$/i);
    if (gymMatch) {
      const count = gymMatch[1];
      return count === "1"
        ? t("subscription.features.gymBranchSingle", "1 Gym Branch")
        : t("subscription.features.gymBranches", "{{count}} Gym Branches", { count });
    }

    // Pattern 4: "Admin X Users", "X Admin Users", "Admin X User", "X Admin User", "X Admins"
    const adminMatch = trimmed.match(/^([\d,]+|\w+)\s+Admin\s+User(s)?$/i) || 
                      trimmed.match(/^Admin\s+([\d,]+|\w+)\s+User(s)?$/i) ||
                      trimmed.match(/^([\d,]+|\w+)\s+Admin(s)?$/i);
    if (adminMatch) {
      const count = adminMatch[1];
      return count === "1"
        ? t("subscription.features.adminUserSingle", "1 Admin User")
        : t("subscription.features.adminUsers", "{{count}} Admin Users", { count });
    }

    // Pattern 5: "X Members" (not staff)
    const membersMatch = trimmed.match(/^([\d,]+|\w+)\s+Members$/i);
    if (membersMatch && !lower.includes("staff")) {
      return t("subscription.features.membersCount", "{{count}} Members", { count: membersMatch[1] });
    }

    // Pattern 6: Trial feature matching
    if (lower.includes("trial") || lower.includes("prueba") || lower.includes("essai") || lower.includes("تجريب")) {
      return t("subscription.features.trialAccess", "7 Days full feature trial access");
    }

    // Exact string mappings
    const mappingKeys = {
      "member management": "subscription.features.memberManagement",
      "membership & plans": "subscription.features.membershipAndPlans",
      "membership & plan": "subscription.features.membershipAndPlans",
      "memberships & plans": "subscription.features.membershipAndPlans",
      "attendance (qr & biometric)": "subscription.features.attendanceQrBio",
      "attendance (qr & bio)": "subscription.features.attendanceQrBio",
      "attendance (qr & manual)": "subscription.features.attendanceQrManual",
      "attendance (manual only)": "subscription.features.attendanceManual",
      "qr attendance": "subscription.features.qrAttendance",
      "payment & invoicing": "subscription.features.paymentInvoicing",
      "expense management": "subscription.features.expenseManagement",
      "trainer": "subscription.features.trainer",
      "trainer management": "subscription.features.trainerManagement",
      "unlimited members": "subscription.features.unlimitedMembers",
      "multi-branch support": "subscription.features.multiBranch",
      "custom roles": "subscription.features.customRoles",
      "custom admin roles": "subscription.features.customRoles",
      "advanced analytics": "subscription.features.advancedAnalytics",
      "priority support": "subscription.features.prioritySupport",
      "workout & diet plans": "subscription.features.workoutDietPlans",
      "leads & follow-ups": "subscription.features.leadsFollowups",
      "renewal reminders": "subscription.features.renewalReminders",
      "reports & analytics": "subscription.features.reportsAnalytics",
      "mobile responsive app": "subscription.features.mobileApp",
      "basic backup": "subscription.features.basicBackup",
      "regular backup": "subscription.features.regularBackup",
      "priority backup": "subscription.features.priorityBackup",
      "custom data backup": "subscription.features.customDataBackup",
      "basic support": "subscription.features.basicSupport",
      "standard support": "subscription.features.standardSupport",
      "24/7 dedicated support": "subscription.features.support247",
      "logo branding": "subscription.features.logoBranding",
      "logo + custom branding": "subscription.features.customBranding",
      "full white label branding": "subscription.features.whiteLabelBranding",
      "optional domain": "subscription.features.optionalDomain",
      "personal domain": "subscription.features.personalDomain",
      "limited api/integrations": "subscription.features.limitedApi",
      "api & integrations": "subscription.features.apiIntegrations",
      "custom api & integrations": "subscription.features.customApi",
      "custom features & code": "subscription.features.customFeaturesCode"
    };

    if (mappingKeys[lower]) {
      return t(mappingKeys[lower], trimmed);
    }

    const slug = lower.replace(/[^a-z0-9]+/g, "_");
    return t(`subscription.features.${slug}`, trimmed);
  };

  useEffect(() => {
    // Get logged-in user info
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchRequestHistory(parsedUser.email);
    }
    fetchPlans();
    fetchAutomationSettings();
    // Fetch SuperAdmin contact for Custom Plan WhatsApp link
    axiosInstance.get('/plans/superadmin-contact')
      .then(res => { if (res.data?.contact) setSuperAdminContact(res.data.contact); })
      .catch(() => {});

    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchAutomationSettings = async () => {
    try {
      const res = await axiosInstance.get("/v1/automation/settings");
      if (res.data.success && res.data.settings) {
        setAutomationSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Failed to load automation settings:", err);
    }
  };

  const calculateDiscountedPrice = (basePrice, planDuration, targetDuration, quarterlyDiscount = 5, yearlyDiscount = 15) => {
    let monthlyPrice = basePrice;
    if (planDuration === 'Yearly') {
      monthlyPrice = basePrice / 12;
    } else if (planDuration === 'Quarterly') {
      monthlyPrice = basePrice / 3;
    }

    if (targetDuration === 'Monthly') {
      return Math.round(monthlyPrice);
    } else if (targetDuration === 'Quarterly') {
      const total = monthlyPrice * 3;
      const discount = (total * quarterlyDiscount) / 100;
      return Math.round(total - discount);
    } else if (targetDuration === 'Yearly') {
      const total = monthlyPrice * 12;
      const discount = (total * yearlyDiscount) / 100;
      return Math.round(total - discount);
    }
    return Math.round(basePrice);
  };

  // Recalculate amount dynamically when selected plan or billing duration changes
  useEffect(() => {
    if (!selectedPlanId || plans.length === 0) return;
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (selectedPlan) {
      const calculatedAmount = calculateDiscountedPrice(
        selectedPlan.price,
        selectedPlan.duration,
        billingDuration,
        automationSettings.quarterlyDiscount,
        automationSettings.yearlyDiscount
      );
      setAmount(calculatedAmount);
    }
  }, [selectedPlanId, billingDuration, plans, automationSettings]);

  const fetchRequestHistory = async (email) => {
    if (!email) return;
    try {
      setLoadingHistory(true);
      const res = await axiosInstance.get(`/purchases?email=${email}`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setRequestHistory(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load request history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/plans?type=SAAS");
      if (res.data.success) {
        // Filter only ACTIVE plans
        const activePlans = res.data.plans.filter(p => p.status === "ACTIVE");
        setPlans(activePlans);
        if (activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].id);
          setAmount(activePlans[0].price); // Default to plan price
        }
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
      toast.error("Failed to load available plans.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlanId(plan.id);
    setAmount(plan.price);
  };

  const openConfirmation = (planOverride = null) => {
    const selectedPlanData = planOverride || plans.find(p => p.id === selectedPlanId);
    const calculatedAmount = selectedPlanData ? calculateDiscountedPrice(
      selectedPlanData.price,
      selectedPlanData.duration,
      billingDuration,
      automationSettings.quarterlyDiscount,
      automationSettings.yearlyDiscount
    ) : 999;

    setSelectedCheckoutPlan({
      id: selectedPlanData?.id || 1,
      name: selectedPlanData?.name || 'Pro Plan',
      price: calculatedAmount || amount || 999,
      duration: billingDuration
    });
    setShowRealCheckout(true);
  };

  const [mockPurchaseData, setMockPurchaseData] = useState(null);

  const handleRestoreGooglePlay = async () => {
    try {
      toast.info("Checking Google Play for active subscriptions...");
      const res = await restoreGooglePlayPurchases({
        email: user?.email,
        companyName: user?.fullName,
        adminName: user?.fullName,
        phone: user?.phone
      });
      if (res.restored) {
        toast.success("Active subscription restored successfully!");
        fetchRequestHistory(user.email);
        window.dispatchEvent(new Event("userUpgrade"));
      } else {
        toast.info(res.message || "No active subscriptions found to restore.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to restore Google Play purchases.");
    }
  };

  const handleSubmitRequest = async (demoPaid = false, planOverride = null) => {
    const selectedPlanData = planOverride || plans.find(p => p.id === selectedPlanId);
    if (!selectedPlanData) return;

    let targetAmount = amount;
    if (planOverride) {
      targetAmount = calculateDiscountedPrice(
        planOverride.price,
        planOverride.duration,
        billingDuration,
        automationSettings.quarterlyDiscount,
        automationSettings.yearlyDiscount
      );
    }

    setSubmitting(true);
    try {
      const payload = {
        selectedPlan: selectedPlanData.name,
        companyName: user?.fullName || "Gym Owner", 
        email: user?.email || "",
        phone: user?.phone || "",
        adminName: user?.fullName || "",
        branchName: user?.branchName || "",
        billingDuration: billingDuration,
        amount: Number(targetAmount),
        startDate: new Date().toISOString(),
        isUpgrade: true,
        isDemoPaid: demoPaid,
        paymentMethod: demoPaid ? (paymentMethod === 'upi' ? 'UPI' : 'Card') : null,
        paymentDetails: demoPaid ? (paymentMethod === 'upi' ? upiId : `Card (**** ${cardNumber.slice(-4)})`) : null
      };

      if (!demoPaid) {
        if (isAndroidNativeApp()) {
          const { productId, basePlanId } = resolvePlayBillingSku(selectedPlanData.name, billingDuration);

          try {
            const playRes = await initiateGooglePlaySubscription({
              productId,
              basePlanId,
              planName: selectedPlanData.name,
              billingDuration,
              email: user?.email || '',
              companyName: user?.fullName || 'Gym Owner',
              adminName: user?.fullName || 'Gym Owner',
              phone: user?.phone || ''
            });

            if (playRes.status === 'PENDING') {
              toast.info(playRes.message || "Payment is pending with Google Play.");
            } else {
              toast.success("Subscription upgraded successfully via Google Play!");
              fetchRequestHistory(user.email);
              window.dispatchEvent(new Event("userUpgrade"));
            }
          } catch (playErr) {
            if (playErr.message?.includes('USER_CANCELED')) {
              toast.info("Purchase cancelled.");
            } else {
              toast.error(playErr.message || "Google Play purchase failed.");
            }
          } finally {
            setSubmitting(false);
          }
          return;
        }

        // Step 1: Create Razorpay Order
        const res = await axiosInstance.post("/purchases/create-razorpay-order", { amount: payload.amount });
        if (!res.data.success) throw new Error(res.data.message);

        const { order, key, isMock } = res.data;

        if (isMock || !key || key === "undefined" || !order || !order.id) {
          // Trigger Mock UI if keys are missing, dummy, or mock flag returned
          setMockPurchaseData({ orderId: order?.id || ("order_mock_" + Date.now()), payload });
          setShowModal(true);
          setPaymentStep('gateway');
          setSubmitting(false);
          return;
        }

        // Step 2: Open Real Razorpay Checkout
        const options = {
          key: key,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "Gym SaaS Subscription",
          description: `Purchase ${selectedPlanData.name}`,
          order_id: order.id,
          handler: async function (response) {
            try {
              // Step 3: Verify Payment
              const verifyRes = await axiosInstance.post('/purchases/verify-razorpay-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                purchaseData: payload
              });
              
              if (verifyRes.data.success) {
                toast.success(verifyRes.data.message || "Payment Successful! Plan activated.");
                fetchRequestHistory(user.email);
                window.dispatchEvent(new Event("userUpgrade"));
              } else {
                toast.error(verifyRes.data.message || "Payment verification failed.");
              }
            } catch (vErr) {
              console.error("Verification error:", vErr);
              const errMsg = vErr.response?.data?.message || vErr.message || "Error verifying payment.";
              toast.error(errMsg);
            }
          },
          theme: { color: "#6EB2CC" }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.open();
        setSubmitting(false);
        return;
      }

      // Process Mock Payment Validation
      if (demoPaid && mockPurchaseData) {
        const verifyRes = await axiosInstance.post('/purchases/verify-razorpay-payment', {
          razorpay_order_id: mockPurchaseData.orderId,
          razorpay_payment_id: 'pay_mock_' + Date.now(),
          razorpay_signature: 'mock_signature',
          isMock: true,
          purchaseData: mockPurchaseData.payload
        });
        
        if (verifyRes.data.success) {
          const txnId = `PAY-MOCK-${Date.now()}`;
          setGeneratedTxnId(txnId);
          setPaymentStep('success');
          fetchRequestHistory(user.email); 
          window.dispatchEvent(new Event("userUpgrade")); 
          
          setTimeout(() => {
            setShowModal(false);
            setPaymentStep('confirm'); 
            setGeneratedTxnId("");
            setMockPurchaseData(null);
          }, 4500);
        } else {
          toast.error("Payment verification failed.");
          setPaymentStep('confirm');
        }
      }

    } catch (error) {
      console.error("Error submitting purchase:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to submit plan request.");
      if (demoPaid) setPaymentStep('confirm');
    } finally {
      if (!demoPaid) setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#2c3e50", fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>{t("nav.subscription", "My Subscription")}</h3>
          <p className="text-muted mb-0" style={{fontSize: 'clamp(12px, 3vw, 14px)'}}>
            {t("subscription.subtitle", "Manage your Gym SaaS Software License. These plans are provided by the Super Admin to keep your gym management system active.")}
          </p>
        </div>
        {isAndroidNativeApp() && (
          <button
            className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2"
            onClick={handleRestoreGooglePlay}
          >
            <span>🔄 Restore Play Store Purchases</span>
          </button>
        )}
      </div>

      {/* Request History Section */}
      <div className="card shadow-sm border-0 rounded-4 mb-5">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
          <h5 className="fw-bold text-dark mb-0">{t("subscription.requestHistory", "My Request History")}</h5>
        </div>
        <div className="card-body p-0 px-2 pb-3">
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
            </div>
          ) : requestHistory.length === 0 ? (
            <div className="text-center py-4 text-muted small">{t("subscription.noPastRequests", "No past requests found.")}</div>
          ) : (
            <div className="table-responsive px-2 px-md-3">
              <table className="table table-hover table-borderless align-middle mb-0" style={{ minWidth: '400px' }}>
                <thead className="bg-light rounded-3">
                  <tr>
                    <th className="py-2 px-2 px-md-3 rounded-start text-muted small fw-semibold">{t("common.date", "Date")}</th>
                    <th className="py-2 px-2 px-md-3 text-muted small fw-semibold">{t("common.plan", "Plan")}</th>
                    <th className="py-2 px-2 px-md-3 text-muted small fw-semibold">{t("common.amount", "Amount")}</th>
                    <th className="py-2 px-2 px-md-3 rounded-end text-muted small fw-semibold">{t("common.status", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {requestHistory.map((req) => (
                    <tr key={req.id} className="border-bottom">
                      <td className="py-3 px-2 px-md-3 text-muted" style={{fontSize: 'clamp(11px, 2.5vw, 13px)'}}>{new Date(req.purchaseDate).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-2 px-md-3 fw-semibold" style={{fontSize: 'clamp(12px, 2.5vw, 14px)'}}>{translatePlanName(req.selectedPlan)} <span className="text-muted fw-normal d-block d-sm-inline" style={{fontSize:"11px"}}>({translateDuration(req.billingDuration)})</span></td>
                      <td className="py-3 px-2 px-md-3 fw-bold text-primary" style={{fontSize: 'clamp(12px, 2.5vw, 14px)'}}>{formatCurrency(req.amount)}</td>
                      <td className="py-3 px-2 px-md-3">
                        <span className={`badge rounded-pill px-2 px-md-3 py-1 py-md-2 ${
                          req.status.toLowerCase() === 'approved' ? 'bg-success' : 
                          req.status.toLowerCase() === 'rejected' ? 'bg-danger' : 
                          'bg-warning text-dark'
                        }`} style={{fontSize: 'clamp(10px, 2vw, 12px)'}}>
                          {t(`common.${req.status.toLowerCase()}`, req.status.charAt(0).toUpperCase() + req.status.slice(1))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <h5 className="fw-bold text-dark mb-4 px-2">
        {t("subscription.availableLicenses", "Available Software Licenses")}{" "}
        <span className="text-muted small fw-normal">{t("subscription.setBySuperAdmin", "(Set by Super Admin)")}</span>
      </h5>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t("common.loading", "Loading...")}</span>
          </div>
          <p className="mt-2 text-muted">{t("subscription.loadingPlans", "Loading available plans...")}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="card shadow-sm border-0 rounded-4 text-center py-5">
          <div className="card-body">
            <h5 className="text-muted">{t("subscription.noPlansAvailable", "No plans available right now.")}</h5>
            <p className="text-muted small">{t("subscription.contactSuperAdmin", "Please contact the Super Admin.")}</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Plan Selection Area */}
          <div className="col-lg-8 mb-4">
            <div className="row g-4">
              {plans.map((plan) => {
                const features = plan.description
                  ? plan.description.split(/\n|,/).map(f => f.trim()).filter(Boolean)
                  : [];

                const isSelected = selectedPlanId === plan.id;
                const isMostPopular = plan.category === 'GROWTH' || plan.name?.toLowerCase().includes('growth');

                return (
                  <div className="col-sm-6 col-xl-4" key={plan.id}>
                    <div
                      className={`card h-100 rounded-4 shadow-sm position-relative ${isSelected ? 'border-2 border-primary' : 'border-1 border-light'}`}
                      style={{ cursor: "pointer", transition: "all 0.25s ease", background: isSelected ? '#f0f6ff' : '#fff' }}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {isMostPopular && (
                        <div className="position-absolute top-0 start-50 translate-middle">
                          <span className="badge bg-danger rounded-pill px-3 py-2 shadow-sm" style={{ fontSize: '11px' }}>
                            {t("subscription.mostPopular", "Most Popular")}
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="position-absolute top-0 end-0 mt-3 me-3">
                          <FaCheck size={18} className="text-primary" />
                        </div>
                      )}

                      <div className="card-body p-4 d-flex flex-column">
                        <div className="mb-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <FaCrown size={20} className={isSelected ? 'text-primary' : 'text-warning'} />
                            <h5 className="fw-bold mb-0">{translatePlanName(plan.name)}</h5>
                          </div>
                          <div className="mb-1 d-flex align-items-baseline flex-wrap gap-1" dir="ltr">
                            <bdi className="fw-bold" style={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                              {formatCurrency(plan.price)}
                            </bdi>
                            <span className="text-muted small ms-1">/ {translateDuration(plan.duration || 'month')}</span>
                          </div>
                          <span className="badge bg-secondary rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                            {t(`subscription.category.${plan.category?.toLowerCase()}`, plan.category)}
                          </span>
                        </div>

                        {features.length > 0 && (
                          <ul className="list-unstyled mb-3 flex-grow-1">
                            {features.map((feature, idx) => (
                              <li key={idx} className="d-flex align-items-start gap-2 mb-2">
                                <span style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }}>✓</span>
                                <span className="small text-muted">{translateFeature(feature)}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <button
                          className={`btn w-100 rounded-pill fw-bold py-2 mt-auto ${isSelected ? 'btn-primary shadow' : 'btn-outline-primary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanSelect(plan);
                            handleSubmitRequest(false, plan);
                          }}
                          disabled={submitting}
                        >
                          {isSelected && submitting 
                            ? t("common.processing", "Processing...") 
                            : (isAndroidNativeApp() ? "Subscribe with Google Play" : t("subscription.getStarted", "Get Started"))}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── Custom Plan Card ── */}
              <div className="col-sm-6 col-xl-4">
                <div
                  className="card h-100 rounded-4 shadow-sm border-2 position-relative"
                  style={{ borderColor: '#f97316', background: 'linear-gradient(145deg, #fff7ed, #fff)' }}
                >
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FaCrown size={20} style={{ color: '#f97316' }} />
                        <h5 className="fw-bold mb-0" style={{ color: '#f97316' }}>{t("subscription.customPlan", "Custom Plan")}</h5>
                      </div>
                      <div className="mb-1">
                        <span className="fw-bold" style={{ fontSize: '1.6rem', color: '#2c3e50' }}>{t("subscription.custom", "Custom")}</span>
                        <span className="text-muted small ms-1">/ {t("subscription.tailored", "Tailored")}</span>
                      </div>
                      <span className="badge rounded-pill px-2 py-1" style={{ fontSize: '10px', background: '#f97316', color: '#fff' }}>
                        {t("subscription.enterprise", "ENTERPRISE")}
                      </span>
                    </div>

                    <ul className="list-unstyled mb-3 flex-grow-1">
                      {[
                        { key: "unlimitedMembers", def: "Unlimited Members" },
                        { key: "multiBranch", def: "Multi-branch Support" },
                        { key: "customRoles", def: "Custom Admin Roles" },
                        { key: "attendanceQrBio", def: "Attendance (QR & Bio)" },
                        { key: "advancedAnalytics", def: "Advanced Analytics" },
                        { key: "prioritySupport", def: "Priority Support" },
                      ].map((item, i) => (
                        <li key={i} className="d-flex align-items-start gap-2 mb-2">
                          <span style={{ color: '#f97316', marginTop: '2px', flexShrink: 0 }}>✓</span>
                          <span className="small text-muted fw-medium">{t(`subscription.features.${item.key}`, item.def)}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={(() => {
                        const raw = (superAdminContact.phone || '9752100980').replace(/[^0-9]/g, '');
                        const withCC = raw.length === 10 ? `91${raw}` : raw;
                        return `https://wa.me/${withCC}?text=Hi%2C%20I'm%20interested%20in%20a%20Custom%20Plan%20for%20my%20gym.%20Please%20share%20more%20details.`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn w-100 rounded-pill fw-bold py-2 mt-auto text-white"
                      style={{ background: '#f97316', border: 'none' }}
                    >
                      {superAdminContact.phone ? t("subscription.contactWhatsapp", "💬 Contact Us on WhatsApp") : t("subscription.contactUs", "📧 Contact Us")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Form Area */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 sticky-top" style={{ top: "90px", zIndex: 10 }}>
              <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                <h5 className="fw-bold text-dark mb-0">{t("subscription.requestPlan", "Request Plan")}</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">{t("subscription.selectedPlan", "Selected Plan")}</label>
                  <div className="form-control bg-light fw-bold border-0">
                    {translatePlanName(plans.find(p => p.id === selectedPlanId)?.name) || t("common.noneSelected", "None selected")}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">{t("subscription.billingDuration", "Billing Duration")}</label>
                  <select 
                    className="form-select border-1"
                    value={billingDuration}
                    onChange={(e) => setBillingDuration(e.target.value)}
                  >
                    <option value="Monthly">{t("common.monthly", "Monthly")}</option>
                    <option value="Quarterly">{t("common.quarterly", "Quarterly")} ({t("common.save", "Save")} {automationSettings.quarterlyDiscount}%)</option>
                    <option value="Yearly">{t("common.yearly", "Yearly")} ({t("common.save", "Save")} {automationSettings.yearlyDiscount}%)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">{t("subscription.planAmount", "Plan Amount / Funds")} ({currency.symbol})</label>
                  <input 
                    type="number" 
                    className="form-control border-1 fw-bold text-primary" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  <small className="text-muted" style={{ fontSize: "11px" }}>{t("subscription.amountNotice", "You can manually adjust the amount if agreed upon with the Super Admin.")}</small>
                </div>

                <div className="bg-light p-3 rounded-3 mb-4">
                  <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                    <FaCalendarAlt />
                    <span>{t("subscription.startsImmediately", "Starts: Immediately upon approval")}</span>
                  </div>
                  <p className="small text-muted mb-0">
                    {t("subscription.sentToSuperAdmin", "Your request will be sent to the Super Admin for offline payment verification.")}
                  </p>
                </div>

                <button 
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm"
                  onClick={() => handleSubmitRequest(false)}
                  disabled={!selectedPlanId || submitting}
                >
                  {submitting 
                    ? t("common.processing", "Processing...") 
                    : (isAndroidNativeApp() ? "Subscribe with Google Play" : t("subscription.proceedToPay", "Proceed to Pay Online"))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Mock Payment Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg" style={{ overflow: 'hidden' }}>
              
              {paymentStep === 'confirm' && (
                <>
                  <div className="modal-header border-bottom-0 pb-0">
                    <h5 className="modal-title fw-bold">{t("subscription.confirmRequest", "Confirm Plan Request")}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p className="text-muted small mb-4">{t("subscription.confirmNotice", "Please review your details before submitting the request to the Super Admin.")}</p>
                    
                    <div className="bg-light rounded-3 p-3 mb-3">
                      <h6 className="fw-bold mb-3 border-bottom pb-2">{t("subscription.adminDetails", "Admin Details")}</h6>
                      <div className="row g-2 small">
                        <div className="col-5 text-muted">{t("common.adminName", "Admin Name")}:</div>
                        <div className="col-7 fw-semibold">{user?.fullName || "N/A"}</div>
                        
                        <div className="col-5 text-muted">{t("common.phone", "Phone")}:</div>
                        <div className="col-7 fw-semibold">{user?.phone || "N/A"}</div>
                        
                        <div className="col-5 text-muted">{t("common.email", "Email")}:</div>
                        <div className="col-7 fw-semibold">{user?.email || "N/A"}</div>
                      </div>
                    </div>

                    <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                      <h6 className="fw-bold mb-3 border-bottom border-primary border-opacity-25 pb-2 text-primary">{t("subscription.planDetails", "Plan Details")}</h6>
                      <div className="row g-2 small">
                        <div className="col-5 text-muted">{t("subscription.selectedPlan", "Selected Plan")}:</div>
                        <div className="col-7 fw-bold">{translatePlanName(plans.find(p => p.id === selectedPlanId)?.name)}</div>
                        
                        <div className="col-5 text-muted">{t("subscription.duration", "Duration")}:</div>
                        <div className="col-7 fw-semibold">{translateDuration(billingDuration)}</div>
                        
                        <div className="col-5 text-muted">{t("subscription.paymentAmount", "Payment Amount")}:</div>
                        <div className="col-7 fw-bold fs-5 text-primary">{formatCurrency(amount)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>{t("common.cancel", "Cancel")}</button>
                    <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => setPaymentStep('gateway')}>
                      {t("subscription.proceedToPay", "Proceed to Pay Online")}
                    </button>
                  </div>
                </>
              )}

              {paymentStep === 'gateway' && (
                <>
                  <div className="modal-header border-bottom-0 pb-0 d-flex justify-content-between align-items-center bg-primary bg-opacity-10 py-3">
                    <div className="ps-2">
                      <h6 className="fw-bold mb-0 text-primary" style={{ letterSpacing: '0.5px' }}>SPEED FITNESS PAYMENTS</h6>
                      <span className="text-muted" style={{ fontSize: '10px' }}>Razorpay Mode</span>
                    </div>
                    <button type="button" className="btn-close" onClick={() => { setShowModal(false); setPaymentStep('confirm'); }}></button>
                  </div>
                  <div className="modal-body px-4 py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                      <div>
                        <span className="text-muted small">{t("subscription.subscriptionFor", "Subscription for")}:</span>
                        <h6 className="fw-bold mb-0">{translatePlanName(plans.find(p => p.id === selectedPlanId)?.name)}</h6>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small">{t("subscription.amountToPay", "Amount to Pay")}:</span>
                        <h4 className="fw-bold text-primary mb-0">{formatCurrency(amount)}</h4>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted mb-2">{t("subscription.selectPaymentMethod", "Select Payment Method")}</label>
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            className={`btn btn-outline-primary flex-fill py-3 fw-bold rounded-3 ${paymentMethod === 'upi' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setPaymentMethod('upi')}
                          >
                            📱 UPI (Paytm/GPay)
                          </button>
                          <button 
                            type="button" 
                            className={`btn btn-outline-primary flex-fill py-3 fw-bold rounded-3 ${paymentMethod === 'card' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            💳 Card (Credit/Debit)
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'upi' ? (
                        <div className="col-12 mt-3">
                          <label className="form-label small fw-semibold text-muted">{t("subscription.enterUpiId", "Enter UPI ID")}</label>
                          <input 
                            type="text" 
                            className="form-control border-1 p-2 rounded-3" 
                            placeholder="username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                          <small className="text-muted mt-1 d-block" style={{fontSize: "11px"}}>Demo ID: e.g., guest@gpay</small>
                        </div>
                      ) : (
                        <div className="row g-2 mt-2 px-1">
                          <div className="col-12">
                            <label className="form-label small fw-semibold text-muted">{t("subscription.cardNumber", "Card Number")}</label>
                            <input 
                              type="text" 
                              className="form-control border-1 p-2 rounded-3" 
                              placeholder="4111 2222 3333 4444"
                              maxLength="19"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold text-muted">{t("subscription.expiryDate", "Expiry Date")}</label>
                            <input 
                              type="text" 
                              className="form-control border-1 p-2 rounded-3" 
                              placeholder="MM/YY"
                              maxLength="5"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold text-muted">CVV</label>
                            <input 
                              type="password" 
                              className="form-control border-1 p-2 rounded-3" 
                              placeholder="123"
                              maxLength="3"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0 px-4">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setPaymentStep('confirm')}>{t("common.back", "Back")}</button>
                    <button 
                      type="button" 
                      className="btn btn-success rounded-pill px-5 fw-bold" 
                      onClick={() => {
                        if (paymentMethod === 'upi' && !upiId.trim()) {
                          toast.warn("Please enter a UPI ID");
                          return;
                        }
                        if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
                          toast.warn("Please fill all card fields");
                          return;
                        }
                        
                        setPaymentStep('processing');
                        handleSubmitRequest(true);
                      }}
                    >
                      {t("subscription.pay", "Pay")} {formatCurrency(amount)}
                    </button>
                  </div>
                </>
              )}

              {paymentStep === 'processing' && (
                <div className="modal-body text-center py-5">
                  <div className="spinner-border text-primary mb-4" role="status" style={{ width: '4rem', height: '4rem' }}>
                    <span className="visually-hidden">{t("common.loading", "Loading...")}</span>
                  </div>
                  <h4 className="fw-bold">{t("subscription.processingPayment", "Processing Your Payment")}</h4>
                  <p className="text-muted">{t("subscription.doNotClose", "Do not close this window. Verifying transaction with payment servers...")}</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="modal-body text-center py-5">
                  <div className="mb-4 d-inline-flex justify-content-center align-items-center rounded-circle bg-success text-white" style={{ width: '80px', height: '80px' }}>
                    <FaCheck size={40} />
                  </div>
                  <h3 className="fw-bold text-success">{t("subscription.paymentSuccessful", "Payment Successful!")}</h3>
                  <p className="text-muted mb-2">{t("subscription.txnId", "Transaction ID")}: <span className="fw-bold text-dark">{generatedTxnId}</span></p>
                  <p className="text-muted mb-0">{t("subscription.activatingLicense", "Activating your SaaS license instantly...")}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {/* Real Production Payment Checkout Modal */}
      <SubscriptionCheckoutModal
        show={showRealCheckout}
        onHide={() => setShowRealCheckout(false)}
        plan={selectedCheckoutPlan}
        onSuccess={() => {
          toast.success("Subscription Activated Successfully!");
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            fetchRequestHistory(parsedUser.email);
          }
          fetchPlans();
          window.dispatchEvent(new Event("userUpgrade"));
        }}
      />
    </div>
  );
};

export default AdminMySubscription;
