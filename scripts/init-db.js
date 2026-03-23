import "dotenv/config";
import mysql from "mysql2/promise";
import sequelize from "../src/config/db.js";
import "../src/models/auth/PlatformUsers.model.js";
import Roles from "../src/models/auth/Roles.model.js";
import "../src/models/auth/Permissions.model.js";
import "../src/models/auth/Features.model.js";
import "../src/models/auth/RoleFeatures.model.js";
import logger from "../src/logger/winston.logger.js";

async function createDatabaseIfNotExists() {
  // Validate DB_NAME contains only safe identifier characters to prevent SQL injection.
  const dbName = process.env.DB_NAME;
  if (!dbName || !/^[A-Za-z0-9_-]+$/.test(dbName)) {
    throw new Error(
      `Invalid DB_NAME "${dbName}". Only alphanumerics, underscores, and hyphens are allowed.`,
    );
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    logger.info(`Database '${dbName}' ensured.`);
  } finally {
    await connection.end();
  }
}

async function syncModels() {
  if (process.env.NODE_ENV === "production") {
    logger.warn(
      "Skipping sequelize.sync() in production — use migrations instead.",
    );
    return;
  }
  await sequelize.sync({ alter: true });
  logger.info("Database tables synchronized.");
}

async function seedRoles() {
  const roles = [
    { roleId: "ADMIN", role: "Admin", description: "Full access" },
    { roleId: "USER", role: "User", description: "Limited access" },
    { roleId: "MANAGER", role: "Manager", description: "Team management" },
  ];

  for (const role of roles) {
    await Roles.findOrCreate({
      where: { roleId: role.roleId },
      defaults: role,
    });
  }
  logger.info("Default roles seeded.");
}

async function main() {
  try {
    await createDatabaseIfNotExists();
    await sequelize.authenticate();
    await syncModels();
    await seedRoles();
    logger.info("Database initialization complete.");
    process.exit(0);
  } catch (error) {
    logger.error("Database initialization failed:\n" + error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
