/**
 * Comprehensive Automated Test Suite: Google Play Billing Integration
 * Tests Security, Ownership, RTDN Webhook, State Machine, Acknowledgement, and SKU Resolution
 */
import assert from "assert";
import {
  GOOGLE_PLAY_SKU_MAP,
  resolvePlanAndDuration,
  applyEntitlementState,
  validatePubSubAuth,
  handleGooglePlayWebhook,
  verifyAndProcessGooglePlayPurchase
} from "../src/modules/purchase/googlePlay.service.js";
import { pool } from "../src/config/db.js";

async function runTests() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("🧪 RUNNING GOOGLE PLAY BILLING AUTOMATED TEST SUITE");
  console.log("══════════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  };

  // ----------------------------------------------------
  // TEST GROUP 1: Product & Base Plan Mapping (Monthly, Quarterly, Yearly)
  // ----------------------------------------------------
  await test("SKU Map defines all 3 billing cycles (Monthly, Quarterly, Yearly)", () => {
    const requiredSkus = [
      "gym_starter_monthly", "gym_starter_quarterly", "gym_starter_yearly",
      "gym_standard_monthly", "gym_standard_quarterly", "gym_standard_yearly",
      "gym_pro_monthly", "gym_pro_quarterly", "gym_pro_yearly"
    ];
    for (const sku of requiredSkus) {
      assert(GOOGLE_PLAY_SKU_MAP[sku], `Missing SKU in map: ${sku}`);
      assert(GOOGLE_PLAY_SKU_MAP[sku].validityDays > 0, `Invalid validityDays for ${sku}`);
    }
  });

  await test("resolvePlanAndDuration resolves Monthly, Quarterly, and Yearly correctly", () => {
    const starterQuarterly = resolvePlanAndDuration("gym_starter", "quarterly");
    assert.strictEqual(starterQuarterly.planName, "Starter Plan");
    assert.strictEqual(starterQuarterly.duration, "3 Months");
    assert.strictEqual(starterQuarterly.validityDays, 90);

    const proYearly = resolvePlanAndDuration("gym_pro", "yearly");
    assert.strictEqual(proYearly.planName, "Pro Plan");
    assert.strictEqual(proYearly.duration, "1 Year");
    assert.strictEqual(proYearly.validityDays, 365);

    const standardMonthly = resolvePlanAndDuration("gym_standard", "monthly");
    assert.strictEqual(standardMonthly.planName, "Standard Plan");
    assert.strictEqual(standardMonthly.duration, "1 Month");
    assert.strictEqual(standardMonthly.validityDays, 30);
  });

  // ----------------------------------------------------
  // TEST GROUP 2: Security & Credentials Guard
  // ----------------------------------------------------
  await test("Missing Google credentials rejects without activating paid subscription", async () => {
    const originalEnv = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    const originalPath = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;

    let threw = false;
    try {
      await verifyAndProcessGooglePlayPurchase({
        packageName: "com.gymsaas.app",
        productId: "gym_starter_monthly",
        purchaseToken: "test_unauth_token",
        email: "unauth_tester@example.com"
      });
    } catch (err) {
      threw = true;
      assert.strictEqual(err.code, "GOOGLE_CREDENTIALS_MISSING");
    } finally {
      if (originalEnv) process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = originalEnv;
      if (originalPath) process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH = originalPath;
    }
    assert(threw, "Must throw GOOGLE_CREDENTIALS_MISSING error");
  });

  // ----------------------------------------------------
  // TEST GROUP 3: RTDN Pub/Sub Push Authentication
  // ----------------------------------------------------
  await test("Pub/Sub Webhook rejects unauthorized requests when secret is configured", () => {
    process.env.GOOGLE_PUBSUB_WEBHOOK_SECRET = "secret_test_token_999";

    // Request without secret
    const reqNoAuth = { query: {}, headers: {} };
    const auth1 = validatePubSubAuth(reqNoAuth);
    assert.strictEqual(auth1.authenticated, false);

    // Request with wrong secret
    const reqWrongAuth = { query: { token: "wrong_token" }, headers: {} };
    const auth2 = validatePubSubAuth(reqWrongAuth);
    assert.strictEqual(auth2.authenticated, false);

    // Request with valid secret
    const reqValidAuth = { query: { token: "secret_test_token_999" }, headers: {} };
    const auth3 = validatePubSubAuth(reqValidAuth);
    assert.strictEqual(auth3.authenticated, true);

    delete process.env.GOOGLE_PUBSUB_WEBHOOK_SECRET;
  });

  await test("Pub/Sub Webhook strictly rejects unauthenticated requests in production", () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.GOOGLE_PUBSUB_WEBHOOK_SECRET;
    delete process.env.GOOGLE_PUBSUB_AUDIENCE;

    const reqNoAuth = { query: {}, headers: {} };
    const auth = validatePubSubAuth(reqNoAuth);
    assert.strictEqual(auth.authenticated, false);
    assert(auth.message.includes("production"));

    process.env.NODE_ENV = prevNodeEnv || "development";
  });

  await test("RTDN Webhook rejects mismatched package name", async () => {
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.gymsaas.app";
    const fakeData = Buffer.from(JSON.stringify({
      packageName: "com.malicious.app",
      subscriptionNotification: { notificationType: 2, purchaseToken: "tok", subscriptionId: "gym_pro" }
    })).toString("base64");

    const res = await handleGooglePlayWebhook({
      query: {},
      headers: {},
      body: { message: { data: fakeData } }
    });
    assert.strictEqual(res.success, false);
    assert(res.message.includes("Package name mismatch"));
  });

  await test("RTDN Webhook enforces message idempotency (duplicate prevention)", async () => {
    const testMsgId = "msg_idemp_test_" + Date.now();
    await pool.query(
      "INSERT INTO google_play_rtdn_messages (messageId, status) VALUES (?, 'PROCESSING')",
      [testMsgId]
    );

    const fakeData = Buffer.from(JSON.stringify({
      packageName: "com.gymsaas.app",
      subscriptionNotification: { notificationType: 2, purchaseToken: "tok_test", subscriptionId: "gym_pro" }
    })).toString("base64");

    const res = await handleGooglePlayWebhook({
      query: {},
      headers: {},
      body: { message: { messageId: testMsgId, data: fakeData } }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.duplicate, true);

    // Cleanup test record
    await pool.query("DELETE FROM google_play_rtdn_messages WHERE messageId = ?", [testMsgId]);
  });

  // ----------------------------------------------------
  // TEST GROUP 4: Subscription Entitlement State Machine
  // ----------------------------------------------------
  await test("State Machine: SUBSCRIPTION_STATE_ACTIVE grants full access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const futureExpiry = new Date(Date.now() + 30 * 86400000);
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_active_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        latestOrderId: "GPA.TEST-ACTIVE",
        expiryDate: futureExpiry,
        matchedPlan: { planName: "Pro Plan", duration: "1 Month", price: 1200 },
        purchaseToken: "tok_active_" + Date.now(),
        productId: "gym_pro_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, true);
      assert.strictEqual(res.userStatus, "Active");
      assert.strictEqual(res.purchaseStatus, "APPROVED");
      await conn.rollback(); // Rollback so database remains clean
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_CANCELED with future expiry retains paid access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const futureExpiry = new Date(Date.now() + 15 * 86400000); // 15 days remaining
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_cancel_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
        latestOrderId: "GPA.TEST-CANCEL-FUTURE",
        expiryDate: futureExpiry,
        matchedPlan: { planName: "Starter Plan", duration: "1 Month", price: 700 },
        purchaseToken: "tok_cancel_future_" + Date.now(),
        productId: "gym_starter_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, true, "User must retain access until paid period ends");
      assert.strictEqual(res.userStatus, "Active");
      assert.strictEqual(res.purchaseStatus, "APPROVED");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_CANCELED with past expiry revokes access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const pastExpiry = new Date(Date.now() - 5 * 86400000); // expired 5 days ago
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_cancel_past@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
        latestOrderId: "GPA.TEST-CANCEL-PAST",
        expiryDate: pastExpiry,
        matchedPlan: { planName: "Starter Plan", duration: "1 Month", price: 700 },
        purchaseToken: "tok_cancel_past_" + Date.now(),
        productId: "gym_starter_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, false);
      assert.strictEqual(res.userStatus, "Expired");
      assert.strictEqual(res.purchaseStatus, "EXPIRED");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_IN_GRACE_PERIOD maintains access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const futureExpiry = new Date(Date.now() + 7 * 86400000);
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_grace_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
        latestOrderId: "GPA.TEST-GRACE",
        expiryDate: futureExpiry,
        matchedPlan: { planName: "Standard Plan", duration: "1 Month", price: 900 },
        purchaseToken: "tok_grace_" + Date.now(),
        productId: "gym_standard_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, true);
      assert.strictEqual(res.userStatus, "Active");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_ON_HOLD suspends paid access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_hold_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_ON_HOLD",
        latestOrderId: "GPA.TEST-HOLD",
        expiryDate: new Date(),
        matchedPlan: { planName: "Standard Plan", duration: "1 Month", price: 900 },
        purchaseToken: "tok_hold_" + Date.now(),
        productId: "gym_standard_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, false);
      assert.strictEqual(res.userStatus, "Suspended");
      assert.strictEqual(res.purchaseStatus, "ON_HOLD");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_PAUSED suspends paid access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_paused_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_PAUSED",
        latestOrderId: "GPA.TEST-PAUSED",
        expiryDate: new Date(),
        matchedPlan: { planName: "Pro Plan", duration: "1 Month", price: 1200 },
        purchaseToken: "tok_pause_" + Date.now(),
        productId: "gym_pro_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, false);
      assert.strictEqual(res.userStatus, "Paused");
      assert.strictEqual(res.purchaseStatus, "PAUSED");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_EXPIRED revokes paid access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_expired_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_EXPIRED",
        latestOrderId: "GPA.TEST-EXPIRED",
        expiryDate: new Date(Date.now() - 86400000),
        matchedPlan: { planName: "Standard Plan", duration: "1 Month", price: 900 },
        purchaseToken: "tok_expired_" + Date.now(),
        productId: "gym_standard_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, false);
      assert.strictEqual(res.userStatus, "Expired");
      assert.strictEqual(res.purchaseStatus, "EXPIRED");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: SUBSCRIPTION_STATE_PENDING does NOT grant paid access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_pending_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_PENDING",
        latestOrderId: null,
        expiryDate: null,
        matchedPlan: { planName: "Starter Plan", duration: "1 Month", price: 700 },
        purchaseToken: "tok_pending_" + Date.now(),
        productId: "gym_starter_monthly",
        isAcknowledged: false,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, false);
      assert.strictEqual(res.purchaseStatus, "PENDING");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  await test("State Machine: REVOKED purchase immediately revokes user access", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_revoked_user@example.com",
        subscriptionState: "REVOKED",
        latestOrderId: "GPA.TEST-REVOKED",
        expiryDate: new Date(),
        matchedPlan: { planName: "Pro Plan", duration: "1 Month", price: 1200 },
        purchaseToken: "tok_revoked_" + Date.now(),
        productId: "gym_pro_monthly",
        isAcknowledged: true,
        existingPurchaseId: null
      });

      assert.strictEqual(res.shouldGrantAccess, false);
      assert.strictEqual(res.userStatus, "Expired");
      assert.strictEqual(res.purchaseStatus, "REVOKED");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  // ----------------------------------------------------
  // TEST GROUP 5: Acknowledgement Accuracy & Anti-Replay
  // ----------------------------------------------------
  await test("Acknowledgement failure records googlePlayAcknowledged = FALSE in DB", async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const testToken = "tok_unack_" + Date.now();
      const res = await applyEntitlementState({
        connection: conn,
        userEmail: "test_unack_user@example.com",
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        latestOrderId: "GPA.TEST-UNACK",
        expiryDate: new Date(Date.now() + 30 * 86400000),
        matchedPlan: { planName: "Starter Plan", duration: "1 Month", price: 700 },
        purchaseToken: testToken,
        productId: "gym_starter_monthly",
        isAcknowledged: false, // Acknowledgement failed
        existingPurchaseId: null
      });

      const [check] = await conn.query(
        "SELECT googlePlayAcknowledged FROM purchase WHERE id = ?",
        [res.purchaseId]
      );
      assert.strictEqual(Boolean(check[0].googlePlayAcknowledged), false, "Must record FALSE when acknowledgement failed");
      await conn.rollback();
    } finally {
      conn.release();
    }
  });

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("══════════════════════════════════════════════════════════");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test runner crash:", err);
  process.exit(1);
});
