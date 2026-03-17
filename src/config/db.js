import Sequelize from "sequelize";
import logger from "../logger/winston.logger.js";

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;

const requiredEnvVars = [];
if (!dbName) requiredEnvVars.push("DB_NAME");
if (!dbUser) requiredEnvVars.push("DB_USER");
if (!dbPassword) requiredEnvVars.push("DB_PASSWORD");
if (!dbHost) requiredEnvVars.push("DB_HOST");

if (requiredEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${requiredEnvVars.join(", ")}`,
  );
}

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  dialectOptions: {
    connectTimeout: 30000,
  },
  logging:
    process.env.NODE_ENV === "development" ? (sql) => logger.debug(sql) : false,
});

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info("MySQL connection has been established successfully.");
  } catch (err) {
    logger.error("Unable to connect to the database: " + err.message);
    throw err;
  }
};

export default sequelize;
