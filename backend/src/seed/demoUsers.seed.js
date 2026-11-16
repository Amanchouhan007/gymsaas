import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

/**
 * Seed Demo & Test User Accounts.
 * Moved from server startup to explicit seed command to prevent server boot delays.
 */
export async function seedDemoUsers() {
  console.log("🌱 Seeding demo and test user accounts...");

  try {
    const defaultHash = await bcrypt.hash("123456", 10);

    const getRoleId = async (roleSearch, defaultId) => {
      try {
        const [r] = await pool.query(
          "SELECT id FROM role WHERE LOWER(name) LIKE LOWER(?) LIMIT 1",
          [`%${roleSearch}%`]
        );
        return r.length > 0 ? r[0].id : defaultId;
      } catch (e) {
        return defaultId;
      }
    };

    const roleMap = {
      superadmin: await getRoleId("superadmin", 1),
      admin: await getRoleId("admin", 2),
      subadmin: await getRoleId("subadmin", 3),
      receptionist: await getRoleId("receptionist", 4),
      generaltrainer: await getRoleId("general", 5),
      personaltrainer: await getRoleId("personal", 6),
      salesagent: await getRoleId("sales", 7),
      member: await getRoleId("member", 8),
      housekeeping: await getRoleId("housekeeping", 9)
    };

    const targetUsers = [
      { name: "Super Admin", email: "superadmin@gmail.com", roleId: roleMap.superadmin },
      { name: "Super Admin Test", email: "test@test.com", roleId: roleMap.superadmin },
      { name: "Admin Gym Owner", email: "admin@gmail.com", roleId: roleMap.admin },
      { name: "John Admin", email: "john@gmail.com", roleId: roleMap.admin },
      { name: "Pia Sub Admin", email: "piasubadmin@gmail.com", roleId: roleMap.subadmin },
      { name: "Receptionist User", email: "receptionist3@gmail.com", roleId: roleMap.receptionist },
      { name: "Personal Trainer User", email: "personal3@gmail.com", roleId: roleMap.personaltrainer },
      { name: "General Trainer User", email: "general1@gmail.com", roleId: roleMap.generaltrainer },
      { name: "Sneha Sales Agent", email: "sneha@gmail.com", roleId: roleMap.salesagent },
      { name: "John Doe Member", email: "john.doe@example.com", roleId: roleMap.member, isMember: true },
      { name: "Housekeeping User", email: "housekeeping3@gmail.com", roleId: roleMap.housekeeping }
    ];

    for (const u of targetUsers) {
      const [ex] = await pool.query("SELECT id FROM user WHERE LOWER(email) = LOWER(?)", [u.email]);
      let userId;
      if (ex.length === 0) {
        const [ins] = await pool.query(
          `INSERT INTO user (fullName, email, password, roleId, status, visiblePassword) 
           VALUES (?, ?, ?, ?, 'Active', '123456')`,
          [u.name, u.email, defaultHash, u.roleId]
        );
        userId = ins.insertId;
        console.log(`✅ Created demo user: ${u.email} (${u.name})`);
      } else {
        userId = ex[0].id;
        console.log(`ℹ️ User ${u.email} already exists (ID: ${userId}).`);
      }

      if (u.isMember) {
        const [mEx] = await pool.query("SELECT id FROM member WHERE LOWER(email) = LOWER(?) OR userId = ?", [u.email, userId]);
        if (mEx.length === 0) {
          const [adminRows] = await pool.query("SELECT id FROM user WHERE roleId = 1 OR roleId = 2 LIMIT 1");
          const adminId = adminRows.length > 0 ? adminRows[0].id : 1;
          await pool.query(
            `INSERT INTO member (userId, adminId, fullName, email, phone, status, password) 
             VALUES (?, ?, ?, ?, '9999999999', 'ACTIVE', ?)`,
            [userId, adminId, u.name, u.email, defaultHash]
          );
          console.log(`✅ Linked demo member record for ${u.email}`);
        }
      }
    }

    console.log("✅ Demo users seed completed successfully.");
  } catch (err) {
    console.error("❌ Demo users seed error:", err.message);
    throw err;
  }
}

if (process.argv[1]?.endsWith("demoUsers.seed.js")) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
