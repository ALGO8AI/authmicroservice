import "dotenv/config";
import { httpServer } from "./app.js";
import { initDatabase } from "./config/db.js";
import sequelize from "./config/db.js";
import logger from "./logger/winston.logger.js";

const REQUIRED_ENV_VARS = [
  "PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DB_HOST",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "SESSION_SECRET",
  "CORS_ORIGIN",
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

const PORT = process.env.PORT || 8080;

/**
 * Gracefully shuts down the HTTP server and database connection pool.
 * Called on SIGTERM and SIGINT signals.
 *
 * @param {string} signal - The signal that triggered the shutdown.
 */
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  // Stop accepting new HTTP connections; wait for in-flight requests to finish.
  httpServer.close(async (err) => {
    if (err) {
      logger.error("Error while closing HTTP server: " + err.message);
      process.exit(1);
    }

    logger.info("HTTP server closed");

    try {
      await sequelize.close();
      logger.info("Database connection pool closed");
      process.exit(0);
    } catch (dbErr) {
      logger.error("Error closing database connection: " + dbErr.message);
      process.exit(1);
    }
  });

  // Force exit if graceful shutdown takes too long (10 s).
  setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const startServer = async () => {
  try {
    validateEnv();
    await initDatabase();

    httpServer.on("error", (error) => {
      logger.error(`Server error: ${error.message}`);
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server: " + error.message);
    process.exit(1);
  }
};

startServer();
