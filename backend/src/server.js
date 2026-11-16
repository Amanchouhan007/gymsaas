import app from "./app.js";
import { ENV } from "./config/env.js";
import bcrypt from "bcryptjs";
import "./modules/alert/alert.corn.js";
import "./modules/notifications/notif.corn.js";
import { initTrialCronJobs } from "./cron/trial.cron.js";
import { initNotificationQueueCron } from "./cron/notificationQueue.cron.js";
import { initNotificationCleanupCron } from "./cron/notificationCleanup.cron.js";
import { initOtpCleanupCron } from "./cron/otpCleanup.cron.js";
import { initBackupCronJob } from "./cron/backup.cron.js";
import { initSocket } from "./config/socket.js";

import { pool } from "./config/db.js";

// Initialize scheduled tasks (Connected to local MySQL database)
initTrialCronJobs();
initNotificationQueueCron();
initNotificationCleanupCron();
initOtpCleanupCron();
initBackupCronJob();

import { seedDemoUsers } from "./seed/demoUsers.seed.js";
export const syncAllUserAccounts = seedDemoUsers;

/**
 * Fast, atomic role initialization for production foreign keys
 */
export async function ensureEssentialSystemRoles() {
  try {
    const requiredRoles = [
      [1, "Superadmin"],
      [2, "Admin"],
      [3, "Subadmin"],
      [4, "Receptionist"],
      [5, "General Trainer"],
      [6, "Personal Trainer"],
      [7, "Sales Agent"],
      [8, "Member"],
      [9, "Housekeeping"]
    ];

    await pool.query(
      "INSERT INTO role (id, name) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name)",
      [requiredRoles]
    );
    console.log("✅ Essential system roles verified.");
  } catch (err) {
    console.error("⚠️ Roles initialization notice:", err.message);
  }
}

(async () => {
  const startupStart = Date.now();

  // 1. Essential System Roles Check (Fast single query)
  await ensureEssentialSystemRoles();

  // 2. Start HTTP Server Immediately to serve incoming traffic
  try {
    const server = app.listen(ENV.port, () => {
      const startupDuration = Date.now() - startupStart;
      console.log(`🚀 Server running on http://localhost:${ENV.port} (Startup completed in ${startupDuration}ms)`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${ENV.port} is already in use. Retrying in 1s...`);
        setTimeout(() => {
          server.close();
          app.listen(ENV.port);
        }, 1000);
      } else {
        console.error("Server startup error:", err);
      }
    });

    // Initialize Socket.io
    initSocket(server);

    // Auto restore active WhatsApp sessions (non-blocking)
    import("./modules/integrations/whatsapp.service.js")
      .then(({ WhatsAppService }) => WhatsAppService.autoRestoreSessions())
      .catch(e => console.error("WhatsApp auto restore error:", e.message));

  } catch (err) {
    console.error("Server listen error:", err);
  }

  // 3. Optional Non-Blocking Background Table Checks
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gym_equipment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NULL,
        quantity INT DEFAULT 1,
        \`condition\` VARCHAR(100) DEFAULT 'Good',
        purchaseDate DATE NULL,
        purchaseCost DECIMAL(10,2) NULL,
        location VARCHAR(255) NULL,
        nextMaintenanceDate DATE NULL,
        branchId INT NOT NULL,
        notes TEXT NULL,
        imageUrl TEXT NULL,
        isActive TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipment_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requestedBy INT NOT NULL,
        role VARCHAR(100) DEFAULT 'MEMBER',
        itemName VARCHAR(255) NOT NULL,
        category VARCHAR(255) DEFAULT 'Other',
        quantity INT DEFAULT 1,
        reason TEXT NULL,
        branchId INT NULL,
        adminId INT NULL,
        imageUrl TEXT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        adminRemarks TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Equipment table background setup notice:", e.message);
  }
})();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});


