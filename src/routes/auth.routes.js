import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyUserByOtp,
  addNewUser,
  editUserDetails,
  getAllUsers,
  deleteUser,
} from "../controllers/auth.controller.js";
import {
  verifyJWT,
  verifyPermission,
} from "../middlewares/auth.middlewares.js";
import { UserRolesEnum } from "../constants.js";
import {
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userLoginValidator,
  userRegisterValidator,
  verifyUserByOtpValidator,
  userRefreshTokenValidator,
  addNewUserValidator,
  userIdParamValidator,
} from "../validators/auth.validators.js";
import { validate } from "../validators/validate.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 429,
      "Too many requests. Please try again later.",
    );
  },
});

// Separate limiter for refresh token endpoint to allow more frequent access which is 20 requests per 15 minutes per IP.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 429,
      "Too many requests. Please try again later.",
    );
  },
});

// Unsecured routes
router
  .route("/register")
  .post(authLimiter, userRegisterValidator(), validate, registerUser);
router
  .route("/login")
  .post(authLimiter, userLoginValidator(), validate, loginUser);
router
  .route("/refresh-token")
  .post(
    refreshLimiter,
    userRefreshTokenValidator(),
    validate,
    refreshAccessToken,
  );
router
  .route("/forgot-password")
  .post(
    authLimiter,
    userForgotPasswordValidator(),
    validate,
    forgotPasswordRequest,
  );
router
  .route("/verify-otp")
  .post(authLimiter, verifyUserByOtpValidator(), validate, verifyUserByOtp);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword,
  );

// Admin routes
router
  .route("/")
  .get(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN, UserRolesEnum.MANAGER]),
    getAllUsers,
  )
  .post(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN, UserRolesEnum.MANAGER]),
    addNewUserValidator(),
    validate,
    addNewUser,
  );

router
  .route("/:userId")
  .patch(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    userIdParamValidator(),
    validate,
    editUserDetails,
  )
  .delete(
    verifyJWT,
    verifyPermission([UserRolesEnum.ADMIN]),
    userIdParamValidator(),
    validate,
    deleteUser,
  );

export default router;
