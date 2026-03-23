import userQueries, { EXCLUDED_FIELDS } from "../queries/auth.queries.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await userQueries.findById(decodedToken?.userId, {
      attributes: { exclude: EXCLUDED_FIELDS },
    });
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user.toJSON();
    next();
  } catch (error) {
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
};

/**
 * @param {AvailableUserRoles} roles
 * @description
 * * This middleware is responsible for validating multiple user role permissions at a time.
 * * So, in future if we have a route which can be accessible by multiple roles, we can achieve that with this middleware
 */
export const verifyPermission =
  (roles = []) =>
  async (req, res, next) => {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, "Unauthorized request");
      }
      if (roles.includes(req.user?.roleId)) {
        next();
      } else {
        throw new ApiError(403, "You are not allowed to perform this action");
      }
    } catch (error) {
      next(error);
    }
  };
