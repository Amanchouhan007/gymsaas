// require('dotenv').config();

// module.exports = {
//   port: process.env.PORT || 4000,
//   databaseUrl: process.env.DATABASE_URL
// };


import dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is missing in production!");
}

export const ENV = {
  port: process.env.PORT || 4000,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: jwtSecret || "gym_management_super_secure_jwt_secret_2026_xyz987",
  nodeEnv: process.env.NODE_ENV || "development",
};
