import logger from "../logger/winston.logger.js";
import { ApiError } from "../utils/ApiError.js";
import Sequelize from "sequelize";

/**
 *
 * @param {Error | ApiError} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 *
 * @description This middleware is responsible to catch the errors from any request handler wrapped inside the {@link asyncHandler}
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error instanceof Sequelize.Error ? 400 : 500);

    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const isProduction = process.env.NODE_ENV === "production";

  const response = {
    statusCode: error.statusCode,
    message:
      isProduction && error.statusCode >= 500
        ? "Internal server error"
        : error.message,
    errors: error.errors || [],
    ...(isProduction ? {} : { stack: error.stack }),
  };

  logger.error(error.message, {
    statusCode: error.statusCode,
    method: req.method,
    url: req.url,
    userId: req.user?.userId ?? null,
    ip: req.ip,
    requestId: req.requestId ?? null,
  });

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
