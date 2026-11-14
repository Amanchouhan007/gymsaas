import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";
import { verifyToken } from "../../middlewares/auth.js";
import {
  updatePurchaseStatus,
  createPurchase,
  getAllPurchases,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getGooglePlayProductsController,
  verifyGooglePlayPurchaseController,
  handleGooglePlayWebhookController
} from "./purchase.controller.js";
import { generateSaasInvoicePdf } from "./saasInvoice.controller.js";

const router = express.Router();

/**
 * Rate Limiter for Purchase Verification Endpoint (Anti-Abuse / Anti-Brute-Force)
 */
const purchaseVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 verification calls per 15 min window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many purchase verification requests. Please try again after 15 minutes."
  }
});

/**
 * Optional Authentication Extractor Middleware
 * Extracts JWT identity if present without rejecting prospective unauthenticated buyers
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['Authorization'];
  if (!authHeader) return next();
  try {
    const token = authHeader.split(" ")[1];
    if (token) {
      req.user = jwt.verify(token, ENV.jwtSecret);
    }
  } catch (_) {
    // Continue unauthenticated if token expired or invalid
  }
  next();
};

// ==========================================
// 1. Web Payments (Razorpay)
// ==========================================
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-razorpay-payment", verifyRazorpayPayment);

// ==========================================
// 2. Google Play Billing (Android App Subscriptions)
// ==========================================
// Public product & localized pricing listing
router.get("/google-play/products", getGooglePlayProductsController);

// Secure purchase verification with rate limiting and customer identity ownership check
router.post(
  "/verify-google-play-purchase",
  purchaseVerifyLimiter,
  optionalAuth,
  verifyGooglePlayPurchaseController
);

// Real-Time Developer Notifications (Pub/Sub Webhook)
router.post("/google-play/webhook", handleGooglePlayWebhookController);

// ==========================================
// 3. SaaS Purchases Management (Strictly Protected)
// ==========================================
// New guest / admin purchase request submission
router.post("/", createPurchase);

// View purchases: SuperAdmin views all; Admin only views their own gym's purchases
router.get("/", verifyToken(["Superadmin", "Admin"]), getAllPurchases);

// Status change: Strictly SuperAdmin only (never unauthenticated or regular Admin)
router.put("/purchase/status/:id", verifyToken(["Superadmin"]), updatePurchaseStatus);

// Invoices: SuperAdmin or owner Admin only
router.get("/invoice/pdf/:id", verifyToken(["Superadmin", "Admin"]), generateSaasInvoicePdf);

export default router;
