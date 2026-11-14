import { pool } from "../../config/db.js";
import { createPurchaseService, modifyPurchaseStatus } from "./purchase.service.js";
import { sendTemplatedNotification } from "../messageTemplates/messageTemplate.service.js";
import { notifySuperAdmin } from "../notifications/notif.service.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

/**
 * Standard Google Play Subscription SKUs mapping to internal SaaS plans
 * Covers Monthly (30d), Quarterly (90d), and Yearly (365d) tiers
 */
export const GOOGLE_PLAY_SKU_MAP = {
  // Separate SKUs format
  "gym_starter_monthly": { planName: "Starter Plan", duration: "1 Month", price: 700, validityDays: 30, basePlanId: "monthly" },
  "gym_starter_quarterly": { planName: "Starter Plan", duration: "3 Months", price: 2000, validityDays: 90, basePlanId: "quarterly" },
  "gym_starter_yearly": { planName: "Starter Plan", duration: "1 Year", price: 7000, validityDays: 365, basePlanId: "yearly" },

  "gym_standard_monthly": { planName: "Standard Plan", duration: "1 Month", price: 900, validityDays: 30, basePlanId: "monthly" },
  "gym_standard_quarterly": { planName: "Standard Plan", duration: "3 Months", price: 2500, validityDays: 90, basePlanId: "quarterly" },
  "gym_standard_yearly": { planName: "Standard Plan", duration: "1 Year", price: 9000, validityDays: 365, basePlanId: "yearly" },

  "gym_pro_monthly": { planName: "Pro Plan", duration: "1 Month", price: 1200, validityDays: 30, basePlanId: "monthly" },
  "gym_pro_quarterly": { planName: "Pro Plan", duration: "3 Months", price: 3400, validityDays: 90, basePlanId: "quarterly" },
  "gym_pro_yearly": { planName: "Pro Plan", duration: "1 Year", price: 12000, validityDays: 365, basePlanId: "yearly" },

  // Unified Product IDs with base plan variation
  "gym_starter": { planName: "Starter Plan", duration: "1 Month", price: 700, validityDays: 30 },
  "gym_standard": { planName: "Standard Plan", duration: "1 Month", price: 900, validityDays: 30 },
  "gym_pro": { planName: "Pro Plan", duration: "1 Month", price: 1200, validityDays: 30 }
};

/**
 * Resolve product mapping based on Product ID, Base Plan ID, or Duration
 */
export const resolvePlanAndDuration = (productId, basePlanId, customDuration) => {
  const normProduct = (productId || "").toLowerCase();
  const normBase = (basePlanId || customDuration || "").toLowerCase();

  let matched = GOOGLE_PLAY_SKU_MAP[normProduct];
  if (!matched) {
    // Try matching prefix
    if (normProduct.includes("pro") || normProduct.includes("enterprise")) {
      matched = { planName: "Pro Plan", duration: "1 Month", price: 1200, validityDays: 30 };
    } else if (normProduct.includes("starter")) {
      matched = { planName: "Starter Plan", duration: "1 Month", price: 700, validityDays: 30 };
    } else {
      matched = { planName: "Standard Plan", duration: "1 Month", price: 900, validityDays: 30 };
    }
  }

  // Adjust duration and validityDays based on basePlanId
  let duration = matched.duration;
  let validityDays = matched.validityDays;
  let price = matched.price;

  if (normBase.includes("quarter") || normBase.includes("90")) {
    duration = "3 Months";
    validityDays = 90;
    price = matched.planName.includes("Pro") ? 3400 : matched.planName.includes("Starter") ? 2000 : 2500;
  } else if (normBase.includes("year") || normBase.includes("365") || normBase.includes("annual")) {
    duration = "1 Year";
    validityDays = 365;
    price = matched.planName.includes("Pro") ? 12000 : matched.planName.includes("Starter") ? 7000 : 9000;
  } else if (normBase.includes("month") || normBase.includes("30")) {
    duration = "1 Month";
    validityDays = 30;
  }

  return {
    planName: matched.planName,
    duration,
    price,
    validityDays
  };
};

/**
 * Resolve Google Play Service Account Credentials securely
 */
export const getGooglePlayCredentials = () => {
  let keyData = null;
  if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    try {
      keyData = typeof process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON === "string"
        ? JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)
        : process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    } catch (e) {
      console.error("Failed to parse GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:", e.message);
    }
  } else if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH) {
    try {
      const resolvedPath = path.resolve(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(resolvedPath)) {
        keyData = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
      }
    } catch (e) {
      console.error("Failed to read service account from GOOGLE_PLAY_SERVICE_ACCOUNT_PATH:", e.message);
    }
  } else {
    const defaultPath = path.resolve("./backend/config/google-service-account.json");
    if (fs.existsSync(defaultPath)) {
      try {
        keyData = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
      } catch (_) {}
    }
  }
  return keyData;
};

// OAuth2 Token Cache
let cachedAccessToken = null;
let tokenExpiryTimestamp = 0;

/**
 * Get Google OAuth2 Access Token using RS256 JWT assertion
 */
export const getGooglePlayAccessToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && tokenExpiryTimestamp > now + 300) {
    return cachedAccessToken;
  }

  const creds = getGooglePlayCredentials();
  if (!creds || !creds.client_email || !creds.private_key) {
    throw {
      status: 503,
      code: "GOOGLE_CREDENTIALS_MISSING",
      message: "Google Play Developer API service account credentials are not configured on the server."
    };
  }

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  })).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(creds.private_key, "base64url");
  const assertion = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    throw new Error(`Google OAuth2 token exchange failed (${tokenRes.status}): ${errBody}`);
  }

  const tokenData = await tokenRes.json();
  cachedAccessToken = tokenData.access_token;
  tokenExpiryTimestamp = now + (tokenData.expires_in || 3600);
  return cachedAccessToken;
};

/**
 * Query Subscription Details from Google Play Developer API (v3 Subscriptions v2)
 */
export const querySubscriptionV2 = async (packageName, token) => {
  const accessToken = await getGooglePlayAccessToken();
  const pkg = packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.gymsaas.app";
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Play subscriptionsv2 query failed (${res.status}): ${errText}`);
  }

  return await res.json();
};

/**
 * Acknowledge Subscription with Google Play
 * Returns true strictly on confirmed HTTP 200/204 response
 */
export const acknowledgeSubscription = async (packageName, subscriptionId, token) => {
  try {
    const accessToken = await getGooglePlayAccessToken();
    const pkg = packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.gymsaas.app";
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}/purchases/subscriptions/${encodeURIComponent(subscriptionId)}/tokens/${encodeURIComponent(token)}:acknowledge`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    if (res.status === 204 || res.status === 200) {
      return true;
    }
    const errText = await res.text();
    console.warn(`Google Play subscription acknowledge notice (${res.status}):`, errText);
    return false;
  } catch (err) {
    console.error("Failed acknowledging Google Play subscription:", err.message);
    return false;
  }
};

/**
 * Get available Google Play products for Android in-app display
 */
export const getAvailableGooglePlayProducts = async () => {
  try {
    const [dbPlans] = await pool.query(
      "SELECT id, name, price, duration, category, description, googlePlaySku, googlePlayBasePlanId FROM plan WHERE status = 'ACTIVE' ORDER BY price ASC"
    );

    const products = (dbPlans || []).map(p => {
      const normalizedName = (p.name || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const defaultSku = p.googlePlaySku || (normalizedName.includes("pro") ? "gym_pro" : normalizedName.includes("starter") ? "gym_starter" : "gym_standard");
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        duration: p.duration,
        category: p.category,
        description: p.description,
        googlePlaySku: defaultSku,
        googlePlayBasePlanId: p.googlePlayBasePlanId || "monthly"
      };
    });

    return { success: true, products };
  } catch (err) {
    console.error("Error fetching Google Play products:", err);
    return { success: false, message: err.message, products: Object.keys(GOOGLE_PLAY_SKU_MAP) };
  }
};

/**
 * Entitlement State Machine: Applies subscription state atomically in MySQL transaction
 */
export const applyEntitlementState = async ({
  connection,
  userEmail,
  subscriptionState,
  latestOrderId,
  expiryDate,
  matchedPlan,
  purchaseToken,
  productId,
  isAcknowledged,
  existingPurchaseId,
  companyName,
  adminName,
  phone
}) => {
  const now = new Date();
  const isExpiryInFuture = expiryDate && new Date(expiryDate) > now;

  let userStatus = "Active";
  let purchaseStatus = "APPROVED";
  let shouldGrantAccess = false;
  let actionNotes = "";

  switch (subscriptionState) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      shouldGrantAccess = true;
      userStatus = "Active";
      purchaseStatus = "APPROVED";
      actionNotes = "Active subscription verified.";
      break;

    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      shouldGrantAccess = isExpiryInFuture;
      userStatus = isExpiryInFuture ? "Active" : "Suspended";
      purchaseStatus = "APPROVED";
      actionNotes = "Subscription in grace period (payment retry in progress).";
      break;

    case "SUBSCRIPTION_STATE_CANCELED":
      // User cancelled auto-renewal: Entitlement remains active until expiry date!
      shouldGrantAccess = isExpiryInFuture;
      userStatus = isExpiryInFuture ? "Active" : "Expired";
      purchaseStatus = isExpiryInFuture ? "APPROVED" : "EXPIRED";
      actionNotes = isExpiryInFuture
        ? "Auto-renewal canceled; access active until end of paid period."
        : "Subscription period has ended.";
      break;

    case "SUBSCRIPTION_STATE_ON_HOLD":
      shouldGrantAccess = false;
      userStatus = "Suspended";
      purchaseStatus = "ON_HOLD";
      actionNotes = "Account placed on hold due to payment failure.";
      break;

    case "SUBSCRIPTION_STATE_PAUSED":
      shouldGrantAccess = false;
      userStatus = "Paused";
      purchaseStatus = "PAUSED";
      actionNotes = "Subscription voluntarily paused by user.";
      break;

    case "SUBSCRIPTION_STATE_EXPIRED":
      shouldGrantAccess = false;
      userStatus = "Expired";
      purchaseStatus = "EXPIRED";
      actionNotes = "Subscription expired.";
      break;

    case "SUBSCRIPTION_STATE_PENDING":
      shouldGrantAccess = false;
      userStatus = null; // Do not touch user status
      purchaseStatus = "PENDING";
      actionNotes = "Purchase pending payment settlement by Google Play.";
      break;

    case "REVOKED":
      shouldGrantAccess = false;
      userStatus = "Expired";
      purchaseStatus = "REVOKED";
      actionNotes = "Purchase revoked/refunded by Google Play.";
      break;

    default:
      shouldGrantAccess = false;
      purchaseStatus = "UNKNOWN";
      actionNotes = `Unknown subscription state: ${subscriptionState}`;
      break;
  }

  // 1. Update or create Purchase record
  let finalPurchaseId = existingPurchaseId;
  if (finalPurchaseId) {
    await connection.query(
      `UPDATE purchase 
       SET googlePlayPurchaseToken = ?, googlePlayOrderId = ?, googlePlayProductId = ?, 
           googlePlayAcknowledged = ?, status = ?, paymentDetails = ?
       WHERE id = ?`,
      [purchaseToken, latestOrderId || null, productId, isAcknowledged ? 1 : 0, purchaseStatus, actionNotes, finalPurchaseId]
    );
  } else {
    const [insRes] = await connection.query(
      `INSERT INTO purchase (
        selectedPlan, companyName, email, phone, adminName, 
        billingDuration, startDate, amount, paymentMethod, status, 
        googlePlayProductId, googlePlayPurchaseToken, googlePlayOrderId, 
        googlePlayAcknowledged, paymentDetails
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Google Play Billing', ?, ?, ?, ?, ?, ?)`,
      [
        matchedPlan.planName,
        companyName || "Google Play Member",
        userEmail,
        phone || "9999999999",
        adminName || "Play Store User",
        matchedPlan.duration,
        new Date().toISOString().split("T")[0],
        matchedPlan.price,
        purchaseStatus,
        productId,
        purchaseToken,
        latestOrderId || null,
        isAcknowledged ? 1 : 0,
        actionNotes
      ]
    );
    finalPurchaseId = insRes.insertId;
  }

  // 2. Update user entitlement if email is present and entitlement state requires it
  let activeUserId = null;
  if (userEmail && userStatus !== null) {
    const [users] = await connection.query(
      "SELECT id, status, subscriptionPlan FROM user WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [userEmail]
    );

    if (users.length > 0) {
      activeUserId = users[0].id;
      if (shouldGrantAccess) {
        await connection.query(
          `UPDATE user 
           SET subscriptionPlan = ?, planName = ?, licenseExpiryDate = ?, status = 'Active', trialStatus = 'Converted' 
           WHERE id = ?`,
          [matchedPlan.planName, matchedPlan.planName, expiryDate, activeUserId]
        );
      } else if (userStatus === "Expired" || userStatus === "Suspended" || userStatus === "Paused") {
        // Only set status without deleting unrelated trial records
        await connection.query(
          `UPDATE user SET status = ? WHERE id = ?`,
          [userStatus, activeUserId]
        );
      }
    } else if (shouldGrantAccess) {
      // Create new Admin User for mobile app buyer
      const tempPassword = "Gym" + Math.floor(100000 + Math.random() * 900000) + "!";
      const hash = await bcrypt.hash(tempPassword, 10);
      const [newU] = await connection.query(
        `INSERT INTO user (
          fullName, email, password, phone, roleId, 
          gymName, planName, price, duration, status, 
          trialStatus, licenseExpiryDate, isTrial,
          visiblePassword, tax, subscriptionPlan
        ) VALUES (?, ?, ?, ?, 2, ?, ?, ?, ?, 'Active', 'Converted', ?, 0, ?, '18', ?)`,
        [
          adminName || companyName || "Gym Owner",
          userEmail,
          hash,
          phone || null,
          companyName || "Gym",
          matchedPlan.planName,
          matchedPlan.price,
          matchedPlan.duration,
          expiryDate,
          tempPassword,
          matchedPlan.planName
        ]
      );
      activeUserId = newU.insertId;
    }
  }

  return {
    purchaseId: finalPurchaseId,
    userId: activeUserId,
    shouldGrantAccess,
    userStatus,
    purchaseStatus,
    actionNotes
  };
};

/**
 * Verify and process Google Play Subscription purchase
 */
export const verifyAndProcessGooglePlayPurchase = async (purchasePayload) => {
  const {
    packageName,
    productId,
    basePlanId,
    purchaseToken,
    orderId,
    purchaseState,
    email,
    companyName,
    adminName,
    phone,
    isRestore
  } = purchasePayload;

  if (!productId || !purchaseToken) {
    throw { status: 400, message: "productId and purchaseToken are required for Google Play verification" };
  }

  const pkgName = packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.gymsaas.app";
  const cleanEmail = email ? email.toLowerCase().trim() : null;

  // 1. Anti-Replay: Check for existing purchase token
  const [existingPurchases] = await pool.query(
    "SELECT id, email, status, selectedPlan, googlePlayOrderId, googlePlayAcknowledged FROM purchase WHERE googlePlayPurchaseToken = ? LIMIT 1",
    [purchaseToken]
  );

  let existingPurchase = null;
  if (existingPurchases.length > 0) {
    existingPurchase = existingPurchases[0];
    const isOwner = cleanEmail && existingPurchase.email && existingPurchase.email.toLowerCase() === cleanEmail;
    if (!isRestore && !isOwner) {
      throw {
        status: 409,
        code: "DUPLICATE_PURCHASE_TOKEN",
        message: "Duplicate purchase token: This subscription token has already been claimed by another account."
      };
    }
  }

  // 2. Resolve Plan and Duration
  const matchedPlan = resolvePlanAndDuration(productId, basePlanId);

  // 3. Handle Client-Reported Pending Purchase State
  if (purchaseState === "PENDING") {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const entitlement = await applyEntitlementState({
        connection: conn,
        userEmail: cleanEmail,
        subscriptionState: "SUBSCRIPTION_STATE_PENDING",
        latestOrderId: orderId || null,
        expiryDate: null,
        matchedPlan,
        purchaseToken,
        productId,
        isAcknowledged: false,
        existingPurchaseId: existingPurchase?.id || null,
        companyName,
        adminName,
        phone
      });
      await conn.commit();
      return {
        success: true,
        status: "PENDING",
        message: "Subscription purchase is pending payment completion by Google Play.",
        purchaseId: entitlement.purchaseId
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // 4. Server-Side Verification via Google Play Developer API
  const creds = getGooglePlayCredentials();
  if (!creds) {
    throw {
      status: 503,
      code: "GOOGLE_CREDENTIALS_MISSING",
      message: "Google Play Developer API service account credentials are not configured on the server. Cannot verify purchase."
    };
  }

  let googleSubData;
  try {
    googleSubData = await querySubscriptionV2(pkgName, purchaseToken);
  } catch (apiErr) {
    throw {
      status: 502,
      code: "GOOGLE_API_ERROR",
      message: `Google Play API verification error: ${apiErr.message}`
    };
  }

  const subState = googleSubData?.subscriptionState;

  // 5. Server Acknowledgement Handling (Strict check: only mark true if verified by Google)
  let isAcknowledged = (googleSubData?.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED");
  if (!isAcknowledged && subState === "SUBSCRIPTION_STATE_ACTIVE") {
    const ackResult = await acknowledgeSubscription(pkgName, productId, purchaseToken);
    isAcknowledged = ackResult;
  }

  // 6. Calculate expiration & real Order ID from Google API
  const latestOrderId = googleSubData?.latestOrderId || orderId || null;
  let expiryDate = new Date();
  const lineItem = googleSubData?.lineItems?.[0];
  if (lineItem?.expiryTime) {
    expiryDate = new Date(lineItem.expiryTime);
  } else {
    expiryDate.setDate(expiryDate.getDate() + (matchedPlan.validityDays || 30));
  }

  // 7. Execute Atomic Entitlement Update in Transaction
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const entitlement = await applyEntitlementState({
      connection: conn,
      userEmail: cleanEmail,
      subscriptionState: subState,
      latestOrderId,
      expiryDate,
      matchedPlan,
      purchaseToken,
      productId,
      isAcknowledged,
      existingPurchaseId: existingPurchase?.id || null,
      companyName,
      adminName,
      phone
    });
    await conn.commit();

    // Send notifications if access was granted
    if (entitlement.shouldGrantAccess && cleanEmail && entitlement.userId) {
      try {
        await sendTemplatedNotification({
          eventKey: "SUBSCRIPTION_ACTIVATED",
          tenantId: entitlement.userId,
          receiverId: entitlement.userId,
          receiverRole: "Admin",
          receiverEmail: cleanEmail,
          receiverPhone: phone,
          variables: {
            Name: adminName || companyName || "Admin",
            SoftwareName: companyName || "Gym Management",
            Email: cleanEmail,
            PlanName: matchedPlan.planName,
            Amount: matchedPlan.price,
            Duration: matchedPlan.duration,
            StartDate: new Date().toLocaleDateString("en-IN"),
            ExpiryDate: expiryDate.toLocaleDateString("en-IN"),
            LoginUrl: "https://gym-newss.kiaantechnology.com/login"
          },
          referenceType: "SUBSCRIPTION",
          referenceId: (entitlement.purchaseId || "").toString(),
          actionUrl: "/"
        });
      } catch (_) {}

      notifySuperAdmin(
        `📱 Google Play Subscription Verified!\nPlan: ${matchedPlan.planName}\nAmount: ₹${matchedPlan.price}\nEmail: ${cleanEmail}\nOrder: ${latestOrderId || 'N/A'}\nState: ${subState}`,
        "NEW_PLAN_PURCHASE",
        { subject: `📱 Google Play Purchase: ${cleanEmail} (${matchedPlan.planName})` }
      ).catch(() => {});
    }

    return {
      success: true,
      status: subState,
      grantAccess: entitlement.shouldGrantAccess,
      orderId: latestOrderId,
      acknowledged: isAcknowledged,
      plan: matchedPlan.planName,
      purchaseId: entitlement.purchaseId,
      message: entitlement.actionNotes
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Validates Google Cloud Pub/Sub Webhook Authentication
 */
export const validatePubSubAuth = (req) => {
  // Method 1: Webhook Secret Token query parameter (?token=...)
  const queryToken = req.query?.token;
  const configuredSecret = process.env.GOOGLE_PUBSUB_WEBHOOK_SECRET;

  if (configuredSecret && queryToken === configuredSecret) {
    return { authenticated: true };
  }

  // Method 2: Google OIDC Bearer Token in Authorization header
  const authHeader = req.headers?.authorization || req.headers?.['Authorization'];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const decoded = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
        const now = Math.floor(Date.now() / 1000);

        // Verify issuer, expiration, audience, and email if configured
        if (decoded.iss !== "https://accounts.google.com") {
          return { authenticated: false, message: "Invalid token issuer" };
        }
        if (decoded.exp && decoded.exp < now) {
          return { authenticated: false, message: "Token expired" };
        }
        if (process.env.GOOGLE_PUBSUB_AUDIENCE && decoded.aud !== process.env.GOOGLE_PUBSUB_AUDIENCE) {
          return { authenticated: false, message: "Audience mismatch" };
        }
        if (process.env.GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL && decoded.email !== process.env.GOOGLE_PUBSUB_SERVICE_ACCOUNT_EMAIL) {
          return { authenticated: false, message: "Service account email mismatch" };
        }
        return { authenticated: true, identity: decoded.email };
      }
    } catch (jwtErr) {
      console.warn("Pub/Sub JWT parsing failed:", jwtErr.message);
    }
  }

  // If secret is configured but neither matched, reject
  if (configuredSecret) {
    return { authenticated: false, message: "Invalid or missing webhook authentication credentials." };
  }

  // In production, strictly reject unauthenticated webhooks
  if (process.env.NODE_ENV === "production") {
    return { authenticated: false, message: "Webhook authentication (GOOGLE_PUBSUB_WEBHOOK_SECRET or OIDC) must be configured in production." };
  }

  // In development, log warning
  console.warn("⚠️ Warning: GOOGLE_PUBSUB_WEBHOOK_SECRET not set in environment. Webhook is accepting requests in open mode.");
  return { authenticated: true };
};

/**
 * Handle Google Play Real-Time Developer Notifications (RTDN via Cloud Pub/Sub)
 * Authenticates request, ensures message idempotency, and validates with Google API
 */
export const handleGooglePlayWebhook = async (req) => {
  // 1. Authenticate Request
  const authCheck = validatePubSubAuth(req);
  if (!authCheck.authenticated) {
    return { success: false, authFailed: true, message: authCheck.message };
  }

  const pubSubBody = req.body;
  if (!pubSubBody?.message?.data) {
    return { success: false, retryable: false, message: "Invalid Pub/Sub payload structure." };
  }

  const messageId = pubSubBody.message.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const publishTime = pubSubBody.message.publishTime ? new Date(pubSubBody.message.publishTime) : new Date();

  // 2. Decode Notification Payload
  let notificationData;
  try {
    const rawData = Buffer.from(pubSubBody.message.data, "base64").toString("utf8");
    notificationData = JSON.parse(rawData);
  } catch (err) {
    console.error("Failed to decode RTDN payload:", err);
    return { success: false, retryable: false, message: "Failed to decode notification JSON." };
  }

  const expectedPkg = process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.gymsaas.app";
  if (notificationData.packageName && notificationData.packageName !== expectedPkg) {
    console.warn(`RTDN package mismatch. Received: ${notificationData.packageName}, Expected: ${expectedPkg}`);
    return { success: false, retryable: false, message: "Package name mismatch." };
  }

  const subscriptionNotification = notificationData.subscriptionNotification;
  if (!subscriptionNotification) {
    return { success: true, message: "Ignored non-subscription event." };
  }

  const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;

  // 3. Idempotent Processing Guard via Database Table
  try {
    await pool.query(
      `INSERT INTO google_play_rtdn_messages (messageId, publishTime, notificationType, purchaseToken, subscriptionId, status)
       VALUES (?, ?, ?, ?, ?, 'PROCESSING')`,
      [messageId, publishTime, notificationType, purchaseToken, subscriptionId]
    );
  } catch (dbErr) {
    if (dbErr.code === "ER_DUP_ENTRY" || dbErr.message?.includes("Duplicate")) {
      console.log(`ℹ️ Duplicate Pub/Sub message ${messageId} already processed. Acknowledging.`);
      return { success: true, duplicate: true, message: "Duplicate message already processed." };
    }
  }

  // 4. Authoritative Verification via Google Play Developer API (subscriptionsv2)
  try {
    const subDetails = await querySubscriptionV2(expectedPkg, purchaseToken);
    const authoritativeState = subDetails?.subscriptionState;
    const latestOrderId = subDetails?.latestOrderId;
    const lineItem = subDetails?.lineItems?.[0];
    const expiryTime = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : new Date();

    // Find linked purchase to locate user email
    const [purchases] = await pool.query(
      "SELECT id, email, selectedPlan FROM purchase WHERE googlePlayPurchaseToken = ? LIMIT 1",
      [purchaseToken]
    );
    const existing = purchases[0] || null;
    const userEmail = existing?.email || null;
    const matchedPlan = resolvePlanAndDuration(subscriptionId || existing?.selectedPlan);

    // Apply authoritative entitlement in transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await applyEntitlementState({
        connection: conn,
        userEmail,
        subscriptionState: authoritativeState,
        latestOrderId,
        expiryDate: expiryTime,
        matchedPlan,
        purchaseToken,
        productId: subscriptionId,
        isAcknowledged: subDetails?.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
        existingPurchaseId: existing?.id || null
      });

      await conn.query(
        "UPDATE google_play_rtdn_messages SET status = 'SUCCESS' WHERE messageId = ?",
        [messageId]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    console.log(`✓ RTDN successfully processed: Message ${messageId}, State: ${authoritativeState}, Email: ${userEmail}`);
    return { success: true, handled: true, state: authoritativeState };
  } catch (err) {
    console.error(`❌ RTDN processing failed for message ${messageId}:`, err.message);
    await pool.query(
      "UPDATE google_play_rtdn_messages SET status = 'FAILED', errorMessage = ? WHERE messageId = ?",
      [err.message, messageId]
    ).catch(() => {});

    // Return retryable error so Pub/Sub will retry
    return { success: false, retryable: true, error: err.message };
  }
};

/**
 * Retry helper to acknowledge pending unacknowledged purchases
 */
export const retryPendingAcknowledgements = async () => {
  const [rows] = await pool.query(
    "SELECT id, googlePlayPurchaseToken, googlePlayProductId FROM purchase WHERE googlePlayPurchaseToken IS NOT NULL AND (googlePlayAcknowledged IS FALSE OR googlePlayAcknowledged = 0) AND status = 'APPROVED'"
  );

  let successCount = 0;
  for (const r of rows) {
    const ok = await acknowledgeSubscription(null, r.googlePlayProductId, r.googlePlayPurchaseToken);
    if (ok) {
      await pool.query("UPDATE purchase SET googlePlayAcknowledged = TRUE WHERE id = ?", [r.id]);
      successCount++;
    }
  }
  return { attempted: rows.length, acknowledged: successCount };
};
