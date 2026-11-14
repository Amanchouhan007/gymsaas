import axios from "axios";

/**
 * Check if the application is running inside the native Android Capacitor shell
 */
export const isAndroidNativeApp = () => {
  if (typeof window === "undefined") return false;
  const isCapacitor = Boolean(window.Capacitor);
  const platform = window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : null;
  const isNative = typeof window.Capacitor?.isNativePlatform === "function" 
    ? window.Capacitor.isNativePlatform() 
    : platform === "android";
  return isCapacitor && platform === "android" && isNative;
};

/**
 * Get native Google Play Billing Capacitor plugin instance
 */
const getBillingPlugin = () => {
  if (!isAndroidNativeApp()) return null;
  return window.Capacitor?.Plugins?.GooglePlayBilling || null;
};

/**
 * Check if Google Play Billing client is ready on the device
 */
export const isBillingReady = async () => {
  const plugin = getBillingPlugin();
  if (!plugin || typeof plugin.isReady !== "function") return false;
  try {
    const res = await plugin.isReady();
    return Boolean(res?.ready);
  } catch (err) {
    console.warn("Failed to check Google Play Billing status:", err);
    return false;
  }
};

/**
 * Resolves Product ID, Base Plan ID, and legacy SKU for a given plan and duration
 * Supports Monthly, Quarterly, and Yearly tiers
 */
export const resolvePlayBillingSku = (planName = "", billingDuration = "Monthly") => {
  const pName = (planName || "").toLowerCase();
  const dur = (billingDuration || "").toLowerCase();

  let tier = "standard";
  if (pName.includes("pro") || pName.includes("enterprise")) {
    tier = "pro";
  } else if (pName.includes("starter") || pName.includes("basic")) {
    tier = "starter";
  }

  let cycle = "monthly";
  if (dur.includes("quarter") || dur.includes("90")) {
    cycle = "quarterly";
  } else if (dur.includes("year") || dur.includes("365") || dur.includes("annual")) {
    cycle = "yearly";
  }

  return {
    productId: `gym_${tier}`,
    basePlanId: cycle
  };
};

/**
 * Query live product details & localized pricing directly from Google Play
 */
export const queryNativeProductDetails = async (productIds = []) => {
  const plugin = getBillingPlugin();
  if (!plugin || typeof plugin.queryProductDetails !== "function") return [];
  try {
    const res = await plugin.queryProductDetails({
      productIds: Array.isArray(productIds) ? productIds : [productIds],
      productType: "SUBS"
    });
    return res?.products || [];
  } catch (err) {
    console.warn("Failed to query native Google Play product details:", err);
    return [];
  }
};

/**
 * Get Clean API Base URL with mobile production fallback
 */
export const getApiBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").trim();
  if (isAndroidNativeApp() && (url.includes("localhost") || url.includes("127.0.0.1"))) {
    url = "https://api.gym-newss.kiaantechnology.com/api";
  }
  return url.replace(/\/+$/, "");
};

/**
 * Fetch available Google Play plans from backend and enrich with live Play Store pricing if available
 */
export const fetchGooglePlayProducts = async () => {
  const cleanUrl = getApiBaseUrl();

  let backendProducts = [];
  try {
    const res = await axios.get(`${cleanUrl}/purchases/google-play/products`);
    backendProducts = res.data?.products || [];
  } catch (err) {
    console.error("Failed to fetch Google Play products from backend:", err);
    return [];
  }

  // If on Android, enrich with live Google Play prices
  if (isAndroidNativeApp()) {
    try {
      const skus = backendProducts.map(p => p.googlePlaySku).filter(Boolean);
      if (skus.length > 0) {
        const nativeDetails = await queryNativeProductDetails(skus);
        const detailsMap = new Map(nativeDetails.map(d => [d.productId, d]));

        backendProducts = backendProducts.map(p => {
          const native = detailsMap.get(p.googlePlaySku);
          if (native) {
            const firstOffer = native.subscriptionOffers?.[0];
            const firstPhase = firstOffer?.pricingPhases?.[0];
            return {
              ...p,
              formattedPrice: firstPhase?.formattedPrice || `₹${p.price}`,
              currencyCode: firstPhase?.priceCurrencyCode || "INR",
              nativeTitle: native.title,
              nativeDescription: native.description,
              nativeOfferToken: firstOffer?.offerToken
            };
          }
          return p;
        });
      }
    } catch (enrichErr) {
      console.warn("Could not enrich products with native details:", enrichErr);
    }
  }

  return backendProducts;
};

/**
 * Helper to build authenticated headers if user is logged in
 */
const getAuthHeaders = () => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Initiate real Google Play Subscription purchase and verify receipt with backend
 */
export const initiateGooglePlaySubscription = async ({
  productId,
  basePlanId,
  offerToken,
  planName,
  billingDuration,
  email,
  companyName,
  adminName,
  phone
}) => {
  if (!isAndroidNativeApp()) {
    throw new Error("Google Play Billing is only supported on Android native devices.");
  }

  const plugin = getBillingPlugin();
  if (!plugin || typeof plugin.purchase !== "function") {
    throw new Error("Google Play Billing native plugin is not available on this device.");
  }

  const cleanUrl = getApiBaseUrl();

  // Auto-resolve productId and basePlanId if not explicitly provided
  const resolved = resolvePlayBillingSku(planName, billingDuration);
  const targetProductId = productId || resolved.productId;
  const targetBasePlanId = basePlanId || resolved.basePlanId;

  // 1. Launch Native Google Play Billing Flow
  const purchaseResult = await plugin.purchase({
    productId: targetProductId,
    basePlanId: targetBasePlanId,
    offerToken: offerToken || undefined
  });

  if (!purchaseResult || !purchaseResult.purchaseToken) {
    throw new Error("No purchase token received from Google Play.");
  }

  // 2. Handle Pending Purchases (e.g. cash, bank delayed payment)
  if (purchaseResult.purchaseState === "PENDING") {
    const pendingRes = await axios.post(
      `${cleanUrl}/purchases/verify-google-play-purchase`,
      {
        packageName: purchaseResult.packageName || "com.gymsaas.app",
        productId: purchaseResult.productId || targetProductId,
        basePlanId: targetBasePlanId,
        purchaseToken: purchaseResult.purchaseToken,
        orderId: purchaseResult.orderId || null,
        purchaseState: "PENDING",
        email,
        companyName,
        adminName,
        phone
      },
      { headers: getAuthHeaders() }
    );

    return {
      success: true,
      status: "PENDING",
      message: "Your payment is pending with Google Play. Your subscription will be activated automatically once payment completes.",
      orderId: purchaseResult.orderId || null,
      backendResponse: pendingRes.data
    };
  }

  // 3. Send real purchase token to backend for server-side verification with Google Play Developer API
  const verifyRes = await axios.post(
    `${cleanUrl}/purchases/verify-google-play-purchase`,
    {
      packageName: purchaseResult.packageName || "com.gymsaas.app",
      productId: purchaseResult.productId || targetProductId,
      basePlanId: targetBasePlanId,
      purchaseToken: purchaseResult.purchaseToken,
      orderId: purchaseResult.orderId || null,
      purchaseState: "PURCHASED",
      email,
      companyName,
      adminName,
      phone
    },
    { headers: getAuthHeaders() }
  );

  if (!verifyRes.data?.success) {
    throw new Error(verifyRes.data?.message || "Failed to verify purchase with server.");
  }

  return {
    success: true,
    status: "ACTIVE",
    orderId: verifyRes.data.orderId || purchaseResult.orderId,
    plan: verifyRes.data.plan || planName,
    purchaseId: verifyRes.data.purchaseId
  };
};

/**
 * Restore purchases and sync active Google Play subscriptions with backend
 */
export const restoreGooglePlayPurchases = async ({ email, companyName, adminName, phone } = {}) => {
  if (!isAndroidNativeApp()) {
    throw new Error("Restore purchases is only available on Android native devices.");
  }

  const plugin = getBillingPlugin();
  if (!plugin || typeof plugin.restorePurchases !== "function") {
    throw new Error("Google Play Billing native restore method is unavailable.");
  }

  const cleanUrl = getApiBaseUrl();

  const res = await plugin.restorePurchases();
  const purchases = res?.purchases || [];

  if (purchases.length === 0) {
    return { success: true, restored: false, message: "No active Google Play subscriptions found to restore." };
  }

  const restoredResults = [];
  for (const p of purchases) {
    if (p.purchaseToken) {
      try {
        const verifyRes = await axios.post(
          `${cleanUrl}/purchases/verify-google-play-purchase`,
          {
            packageName: p.packageName || "com.gymsaas.app",
            productId: p.productId,
            purchaseToken: p.purchaseToken,
            orderId: p.orderId,
            email,
            companyName,
            adminName,
            phone,
            isRestore: true
          },
          { headers: getAuthHeaders() }
        );
        restoredResults.push(verifyRes.data);
      } catch (verErr) {
        console.warn("Failed to verify restored purchase token:", verErr.message);
      }
    }
  }

  return {
    success: true,
    restored: restoredResults.length > 0,
    results: restoredResults
  };
};

// Concurrency mutex for App Resume Synchronization
let isAppResumeSyncing = false;

/**
 * Automatically synchronize active and pending Google Play subscriptions on App Resume
 */
export const syncActivePurchasesOnResume = async (userEmail) => {
  if (isAppResumeSyncing || !isAndroidNativeApp()) return;
  isAppResumeSyncing = true;
  try {
    const isReady = await isBillingReady();
    if (!isReady) return;

    const email = userEmail || (typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}").email : null);
    if (!email) return;

    const res = await restoreGooglePlayPurchases({ email });
    if (res?.restored) {
      console.log("App Resume: Synced active Google Play subscription.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userUpgrade"));
      }
    }
  } catch (err) {
    console.warn("App resume sync notice:", err.message);
  } finally {
    isAppResumeSyncing = false;
  }
};

export default {
  isAndroidNativeApp,
  isBillingReady,
  resolvePlayBillingSku,
  queryNativeProductDetails,
  fetchGooglePlayProducts,
  initiateGooglePlaySubscription,
  restoreGooglePlayPurchases,
  syncActivePurchasesOnResume
};
