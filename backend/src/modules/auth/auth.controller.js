import { uploadToCloudinary } from "../../config/cloudinary.js";
import { registerUser, loginUser , fetchUserById,
  modifyUser,
  removeUser, fetchAdmins, fetchDashboardStats, loginMemberService,changeUserPassword, getAdminDashboardData,
  forgotPasswordService, verifyOtpService, resendOtpService, resetPasswordService, loginWithResetTokenService
} from "./auth.service.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../../config/db.js";
import { PaymentCredentialResolver, BrevoCredentialResolver } from "../../utils/credentialResolvers.js";
import { logAudit } from "../auditLog/auditLog.service.js";



export const register = async (req, res, next) => {
  try {
    // ⚠️ Abhi ke liye adminId body se aa raha hai
    // Frontend se bhejna hoga:
    // { ..., adminId: 1 }

    // Agar baad me token lagaoge to aise kar sakte ho:
    // if (req.user) {
    //   req.body.adminId = req.user.id;   // jis admin ne create kiya
    // }
    
    const { paymentMethod, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (paymentMethod === "Razorpay") {
      const creds = PaymentCredentialResolver.getSuperAdminRazorpayCredentials();
      const activeKeySecret = creds.keySecret;
      
      if (activeKeySecret && !activeKeySecret.includes("dummy") && !razorpay_order_id?.startsWith("order_mock_")) {
        const generated_signature = crypto
          .createHmac("sha256", activeKeySecret)
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest("hex");

        if (generated_signature !== razorpay_signature) {
          return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
      }
    }

    let imageUrl = null;
    if (req.files?.profileImage) {
      imageUrl = await uploadToCloudinary(
        req.files.profileImage,
        "users/profile"
      );
    }

    const payload = { profileImage: imageUrl };
    console.log(payload)

    const user = await registerUser(req.body,payload)
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};



export const getUserById = async (req, res, next) => {
  try {
    const data = await fetchUserById(Number(req.params.id));
    res.json({ success: true, user: data });
  } catch (err) {
    next(err);
  }
};


export const getAdmins = async (req, res, next) => {
  try {
    const data = await fetchAdmins(); // service se fetch

    res.json({
      success: true,
      admins: data
    });
  } catch (err) {
    next(err);
  }
};



export const updateUser = async (req, res, next) => {
  try {
    const data = await modifyUser(Number(req.params.id), req.body, req.files);

    logAudit({
      req,
      userId: req.params.id,
      adminId: req.user?.adminId || req.user?.id,
      action: "USER_UPDATE",
      module: "AUTHENTICATION",
      resourceType: "User",
      resourceId: req.params.id,
      description: `Updated account details for user ID #${req.params.id}`,
      status: "SUCCESS",
      severity: "INFO",
      newValue: req.body
    });

    res.json({ success: true, user: data });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const data = await removeUser(Number(req.params.id));

    logAudit({
      req,
      userId: req.params.id,
      adminId: req.user?.adminId || req.user?.id,
      action: "USER_DELETE",
      module: "AUTHENTICATION",
      resourceType: "User",
      resourceId: req.params.id,
      description: `Deleted user ID #${req.params.id}`,
      status: "SUCCESS",
      severity: "WARNING"
    });

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await fetchDashboardStats(); // service se fetch

    res.json({
      success: true,
      dashboard: data
    });
  } catch (err) {
    next(err);
  }
};




// ✅ controller
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { token, user } = await loginUser({ email, password });

    logAudit({
      req,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userRole: user.roleName,
      adminId: user.adminId || user.id,
      action: "LOGIN",
      module: "AUTHENTICATION",
      resourceType: "user",
      resourceId: user.id,
      description: `User ${user.email} (${user.roleName}) logged in successfully`,
      status: "SUCCESS",
      severity: "INFO"
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,

        roleId: user.roleId,
        roleName: user.roleName,

        branchId: user.branchId,
        branchName: user.branchName,

        adminId: user.adminId,
        staffId: user.staffId,
        memberId: user.memberId,   // ✅ ADD THIS LINE

        razorpayKeyId: user.razorpayKeyId,

        profileImage: user.profileImage,
        permissions: user.permissions
      }
    });
  } catch (err) {
    logAudit({
      req,
      userEmail: email || "N/A",
      action: "FAILED_LOGIN",
      module: "AUTHENTICATION",
      resourceType: "user",
      description: `Failed login attempt for email: ${email || "unknown"} - ${err.message || "Invalid credentials"}`,
      status: "FAILED",
      severity: "WARNING"
    });
    next(err);
  }
};








export const loginMember = async (req, res, next) => {
  try {
    const data = await loginMemberService(req.body);
    res.json({
      success: true,
      token: data.token,
      member: {
        id: data.member.id,
        fullName: data.member.fullName,
        email: data.member.email,
        phone: data.member.phone,
        branchId: data.member.branchId,
        branchName: data.member.branch?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
};


export const changePasswordController = async (req, res, next) => {
  try {
    // const id = req.user.id; // from JWT middleware
    const { oldPassword, newPassword,id } = req.body;

    if (!oldPassword || !newPassword || !id) {
      return res.status(400).json({ success: false, message: "Old & new password required & id" });
    }

    const result = await changeUserPassword(id, oldPassword, newPassword);

    logAudit({
      req,
      userId: id,
      adminId: req.user?.adminId || req.user?.id,
      action: "PASSWORD_CHANGE",
      module: "AUTHENTICATION",
      resourceType: "User",
      resourceId: id,
      description: `User ID #${id} changed their account password`,
      status: "SUCCESS",
      severity: "INFO"
    });

    res.json({ success: true, ...result });

  } catch (err) {
    next(err);
  }
};


// export const getAdminDashboard = async (req, res, next) => {
//   try {
//     const data = await getAdminDashboardData();

//     res.json({
//       success: true,
//       message: "Dashboard data fetched successfully",
//       data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };


export const getAdminDashboard = async (req, res, next) => {
  try {
    const adminId = req.params.id; // or req.user.adminId
    const branchId = req.query.branchId; // Get branchId from query parameters
    const month = req.query.month; // e.g., '2026-07'
    const chartPeriod = req.query.chartPeriod ? parseInt(req.query.chartPeriod) : 6;

    const data = await getAdminDashboardData(adminId, branchId, month, chartPeriod);

    res.json({
      success: true,
      message: "Dashboard data fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log("🔑 FORGOT PASSWORD REQUEST RECEIVED FOR:", email);
    const result = await forgotPasswordService(email, req.ip, req.headers['user-agent']);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtpService(email, otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resendForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await resendOtpService(email, req.ip, req.headers['user-agent']);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const loginWithResetToken = async (req, res, next) => {
  try {
    const { email, resetToken } = req.body;
    const result = await loginWithResetTokenService(email, resetToken, req.ip, req.headers['user-agent']);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;
    const result = await resetPasswordService(email, resetToken, newPassword, confirmPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const fixLoginsController = async (req, res, next) => {
  try {
    const { syncAllUserAccounts } = await import("../../server.js");
    await syncAllUserAccounts();
    return res.json({
      success: true,
      message: "Required system roles and target accounts synchronized successfully."
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public Account Deletion Request Submission (Google Play Store Mandatory Requirement)
 */
export const requestAccountDeletion = async (req, res, next) => {
  try {
    const { email, fullName, phone, reason } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Rate Limiting: Max 5 deletion requests per hour per email
    const [rateRows] = await pool.query(
      "SELECT COUNT(*) as count FROM account_deletion_requests WHERE email = ? AND requestedAt >= NOW() - INTERVAL 1 HOUR",
      [cleanEmail]
    );
    if (rateRows[0]?.count >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many deletion requests for this email. Please try again after 1 hour."
      });
    }

    // 2. Generate secure 6-digit verification code
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Store deletion request with pending verification
    await pool.query(
      `INSERT INTO account_deletion_requests (email, fullName, phone, reason, status, otpHash, otpExpiresAt, isVerified) 
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?, FALSE)`,
      [cleanEmail, fullName ? fullName.trim() : null, phone ? phone.trim() : null, reason ? reason.trim() : "Requested via public portal", hashedOtp, expiresAt]
    );

    // 4. Dispatch Email with OTP and Google Play Subscription Warning
    try {
      const platformCreds = BrevoCredentialResolver.getSuperAdminBrevoCredentials();
      if (platformCreds && platformCreds.apiKey) {
        const apiKey = platformCreds.apiKey.replace(/['"]/g, '').trim();
        const senderEmail = platformCreds.senderEmail || "info@kiaantechnology.com";
        const senderName = platformCreds.senderName || "Gym Management Support";

        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: cleanEmail }],
            subject: "Verification Code for Account & Data Deletion",
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
                <h2 style="color: #ea580c; margin-bottom: 16px;">Account Deletion Verification</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                  A request was submitted to delete the account and associated data for <strong>${cleanEmail}</strong>.
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                  Please enter the 6-digit confirmation code below to verify your request:
                </p>
                <div style="background-color: #ffffff; border: 2px dashed #ea580c; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ea580c;">${rawOtp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">
                  This code expires in 10 minutes. If you did not make this request, your account remains secure and no action will be taken.
                </p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  <strong>Important:</strong> Deleting your account will not automatically cancel active Google Play subscriptions. Manage or cancel recurring subscriptions in your <a href="https://play.google.com/store/account/subscriptions" style="color: #ea580c; font-weight: bold;">Google Play Subscriptions settings</a>.
                </div>
              </div>
            `,
            textContent: `Your 6-digit verification code for account deletion is: ${rawOtp}. This code expires in 10 minutes.\n\nImportant: Deleting your account will not automatically cancel active Google Play subscriptions. Manage subscriptions at https://play.google.com/store/account/subscriptions.`
          })
        });
      }
    } catch (mailErr) {
      console.warn("Notice: Email dispatch for account deletion OTP:", mailErr.message);
    }

    return res.json({
      success: true,
      step: "OTP_REQUIRED",
      message: "A 6-digit verification code has been sent to your email address. Please enter it to verify your deletion request."
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify Public Account Deletion OTP
 */
export const verifyAccountDeletionOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and verification code are required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Fetch the latest pending deletion request for this email
    const [rows] = await pool.query(
      "SELECT * FROM account_deletion_requests WHERE email = ? AND isVerified = FALSE ORDER BY id DESC LIMIT 1",
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No active deletion request found for this email. Please request a new code." });
    }

    const record = rows[0];

    // Check expiration
    if (record.otpExpiresAt && new Date() > new Date(record.otpExpiresAt)) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new code." });
    }

    // Compare OTP
    if (!record.otpHash) {
      return res.status(400).json({ success: false, message: "Invalid deletion verification state." });
    }

    const isMatch = await bcrypt.compare(cleanOtp, record.otpHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect verification code. Please check and try again." });
    }

    // Mark as verified
    await pool.query(
      "UPDATE account_deletion_requests SET isVerified = TRUE, status = 'PENDING', notes = 'Identity verified via Email OTP' WHERE id = ?",
      [record.id]
    );

    return res.json({
      success: true,
      step: "VERIFIED",
      message: "Identity verified successfully. Your account deletion request has been registered and all personal data will be purged within 30 days."
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticated In-App Account Deletion (Google Play Store Mandatory Requirement)
 */
export const deleteOwnAccount = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const memberId = req.user?.memberId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to confirm account deletion." });
    }

    if (userId) {
      const [uRows] = await pool.query("SELECT password FROM user WHERE id = ?", [userId]);
      if (uRows.length === 0) {
        return res.status(404).json({ success: false, message: "User account not found." });
      }
      const isMatch = await bcrypt.compare(password, uRows[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Incorrect password. Account deletion aborted." });
      }
      await removeUser(userId);
    } else if (memberId) {
      const [mRows] = await pool.query("SELECT password FROM member WHERE id = ?", [memberId]);
      if (mRows.length === 0) {
        return res.status(404).json({ success: false, message: "Member record not found." });
      }
      const isMatch = await bcrypt.compare(password, mRows[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Incorrect password. Account deletion aborted." });
      }
      await pool.query("DELETE FROM memberattendance WHERE memberId = ?", [memberId]);
      await pool.query("DELETE FROM member_plan_assignment WHERE memberId = ?", [memberId]);
      await pool.query("DELETE FROM payment WHERE memberId = ?", [memberId]);
      await pool.query("DELETE FROM member_health_log WHERE memberId = ?", [memberId]);
      await pool.query("DELETE FROM member WHERE id = ?", [memberId]);
    } else {
      return res.status(400).json({ success: false, message: "Invalid session or missing user identity." });
    }

    // Invalidate existing token
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await pool.query("INSERT IGNORE INTO token_blacklist (token) VALUES (?)", [token]);
    }

    return res.json({
      success: true,
      message: "Your account and associated personal data have been permanently deleted."
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List Account Deletion Requests (Admin / SuperAdmin)
 */
export const getAccountDeletionRequests = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM account_deletion_requests ORDER BY requestedAt DESC");
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
