import { pool } from "../config/db.js";

/**
 * Migration 001: Ensure required user columns exist safely.
 * Checks information_schema before attempting to add any column,
 * guaranteeing zero errors and zero table locks if columns already exist.
 */
export async function up() {
  console.log("Running Migration 001: Ensure user columns...");

  const [existingCols] = await pool.query(`
    SELECT COLUMN_NAME 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user'
  `);

  const colNames = new Set(existingCols.map(c => c.COLUMN_NAME.toLowerCase()));

  const requiredColumns = [
    { name: "isTrial", ddl: "ADD COLUMN isTrial TINYINT(1) DEFAULT 0" },
    { name: "licenseExpiryDate", ddl: "ADD COLUMN licenseExpiryDate DATETIME DEFAULT NULL" },
    { name: "razorpayKeyId", ddl: "ADD COLUMN razorpayKeyId VARCHAR(255) DEFAULT NULL" },
    { name: "razorpayKeySecret", ddl: "ADD COLUMN razorpayKeySecret VARCHAR(255) DEFAULT NULL" },
    { name: "trialStatus", ddl: "ADD COLUMN trialStatus VARCHAR(50) DEFAULT 'None'" },
    { name: "trialStartDate", ddl: "ADD COLUMN trialStartDate DATETIME DEFAULT NULL" },
    { name: "trialEndDate", ddl: "ADD COLUMN trialEndDate DATETIME DEFAULT NULL" },
    { name: "gracePeriodEndDate", ddl: "ADD COLUMN gracePeriodEndDate DATETIME DEFAULT NULL" }
  ];

  for (const col of requiredColumns) {
    if (!colNames.has(col.name.toLowerCase())) {
      console.log(`Adding missing column user.${col.name}...`);
      await pool.query(`ALTER TABLE user ${col.ddl}`);
    } else {
      console.log(`Column user.${col.name} already exists. Skipping.`);
    }
  }

  console.log("Migration 001 completed successfully.");
}

// Allow standalone execution: node src/migrations/001_ensure_user_columns.js
if (process.argv[1]?.endsWith("001_ensure_user_columns.js")) {
  up()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration 001 failed:", err);
      process.exit(1);
    });
}
