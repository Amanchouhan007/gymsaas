import { Router } from "express";
import {
  getDashboardStats,
  register,
  login,
  getUserById,
  updateUser,
  deleteUser,
  getAdmins,
  loginMember,
  changePasswordController,
  getAdminDashboard,
  forgotPassword,
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
  resetPassword,
  loginWithResetToken,
  fixLoginsController,
  requestAccountDeletion,
  verifyAccountDeletionOtp,
  deleteOwnAccount,
  getAccountDeletionRequests
} from "./auth.controller.js";
import { verifyToken } from "../../middlewares/auth.js";
import { loginLimiter, passwordResetLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

router.get("/fix-logins", verifyToken(["Superadmin"]), fixLoginsController);
router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/login-member", loginLimiter, loginMember);
router.post("/logout", (req, res) => res.json({ success: true, message: "Logged out successfully" }));

// Account Deletion Compliance (Google Play Store Policy)
router.post("/request-account-deletion", requestAccountDeletion);
router.post("/verify-account-deletion-otp", verifyAccountDeletionOtp);
router.delete("/delete-account", verifyToken(), deleteOwnAccount);
router.get("/deletion-requests", verifyToken(["Superadmin", "Subadmin"]), getAccountDeletionRequests);

// Forgot Password Flow
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/resend-forgot-password-otp", passwordResetLimiter, resendForgotPasswordOtp);
router.post("/login-with-reset-token", loginLimiter, loginWithResetToken);
router.post("/reset-password", passwordResetLimiter, resetPassword);

router.get("/user/:id", verifyToken(), getUserById);
router.put("/user/:id", verifyToken(), updateUser);
router.delete("/user/:id", verifyToken(["Superadmin", "Admin", "Subadmin"]), deleteUser);
router.get("/admins", verifyToken(["Superadmin", "Subadmin"]), getAdmins);
router.get("/dashboard", verifyToken(["Superadmin", "Subadmin"]), getDashboardStats);
router.put("/changepassword", verifyToken(), changePasswordController);
router.get("/admindashboard/:id", verifyToken(["Superadmin", "Admin", "Subadmin"]), getAdminDashboard);

export default router;
