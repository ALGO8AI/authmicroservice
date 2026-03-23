import sequelize from "../config/db.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

export const healthcheck = asyncHandler(async (req, res) => {
  let dbStatus = "ok";
  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = "error";
  }

  const data = {
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
    version,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  };

  const statusCode = dbStatus === "ok" ? 200 : 503;
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, data, "Health check"));
});
