import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";

const COOKIE_OPTIONS = (isProduction) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await authService.registerUser({ email, password });
  return res
    .status(201)
    .json(new ApiResponse(201, { user }, "User registered successfully."));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!password || !email) {
    throw new ApiError(400, "Password and email are required");
  }

  const { user, accessToken, refreshToken } = await authService.loginUser({
    email,
    password,
  });

  res.cookie(
    "refreshToken",
    refreshToken,
    COOKIE_OPTIONS(process.env.NODE_ENV === "production"),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken },
        "User logged in successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.userId);
  res.clearCookie(
    "refreshToken",
    COOKIE_OPTIONS(process.env.NODE_ENV === "production"),
  );
  return res.status(200).json(new ApiResponse(200, {}, "User logged out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { accessToken, newRefreshToken } =
    await authService.refreshAccessToken(incomingRefreshToken);

  res.cookie(
    "refreshToken",
    newRefreshToken,
    COOKIE_OPTIONS(process.env.NODE_ENV === "production"),
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  await authService.forgotPasswordRequest(req.body.email);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Otp sent successfully."));
});

export const verifyUserByOtp = asyncHandler(async (req, res) => {
  const { email, newPassword, inputedOtp } = req.body;

  if (!email || !newPassword || !inputedOtp || newPassword.length < 8) {
    throw new ApiError(
      400,
      "Email, inputedOtp and a valid new password (min 8 chars) are required",
    );
  }

  await authService.verifyUserByOtp({ email, newPassword, inputedOtp });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully."));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await authService.changeCurrentPassword({
    userId: req.user.userId,
    oldPassword,
    newPassword,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const addNewUser = asyncHandler(async (req, res) => {
  const { email, roleId, firstName, password } = req.body;
  const user = await authService.addNewUser({
    email,
    roleId,
    firstName,
    password,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, { user }, "User created successfully."));
});

export const editUserDetails = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const updatedUser = await authService.editUserDetails({
    userId,
    updateData: req.body,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await authService.deleteUser(req.params.userId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await authService.getAllUsers({ page, limit });
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully."));
});
