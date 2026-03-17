import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import userQueries, { EXCLUDED_FIELDS } from "../queries/auth.queries.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
} from "../utils/jwt.js";
import { generateHashPassword, isPasswordCorrect } from "../utils/password.js";
import { forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js";

// Sequelize options object — reused wherever a query must exclude sensitive fields.
const SAFE_ATTRS = { attributes: { exclude: EXCLUDED_FIELDS } };

// A valid bcrypt hash used solely for timing-attack mitigation when a user is
// not found. Generated synchronously at module load to ensure it's ready before
// any login attempts.
const DUMMY_HASH = bcrypt.hashSync("__timing_mitigation_placeholder__", 10);

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await userQueries.findOne({ where: { userId } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = await generateAccessToken({
    userId: user.userId,
    email: user.email,
    roleId: user.roleId,
  });
  const refreshToken = await generateRefreshToken({
    userId: user.userId,
    email: user.email,
    roleId: user.roleId,
  });

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const registerUser = async ({ email, password }) => {
  const existedUser = await userQueries.findOne({ where: { email } });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const hashPassword = await generateHashPassword(password);

  const user = await userQueries.create({ email, password: hashPassword });

  const createdUser = await userQueries.findById(user.userId, SAFE_ATTRS);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return createdUser;
};

export const loginUser = async ({ email, password }) => {
  const user = await userQueries.findOne({ where: { email } });

  if (!user) {
    // Anti-user enumeration and timing attack protection
    await isPasswordCorrect(password, DUMMY_HASH);
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await isPasswordCorrect(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.userId,
  );

  const loggedInUser = await userQueries.findById(user.userId, SAFE_ATTRS);

  return { user: loggedInUser, accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
  await userQueries.clearRefreshToken(userId);
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  let decodedToken;

  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await userQueries.findById(decodedToken?.userId);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const incomingDigest = crypto
    .createHash("sha256")
    .update(incomingRefreshToken)
    .digest();
  const storedDigest = crypto
    .createHash("sha256")
    .update(user.refreshToken || "")
    .digest();

  if (!crypto.timingSafeEqual(incomingDigest, storedDigest)) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user.userId);

  return { accessToken, newRefreshToken };
};

export const forgotPasswordRequest = async (email) => {
  const user = await userQueries.findOne({ where: { email } });

  // Anti-user enumeration: always return success
  if (!user) {
    return;
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    await generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save();

  await sendEmail(
    [user.email],
    "Password reset request",
    forgotPasswordMailgenContent(
      user.firstName,
      `${process.env.RESET_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  );
};

export const resetForgottenPassword = async ({ resetToken, newPassword }) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await userQueries.findOne({
    where: { forgotPasswordToken: hashedToken },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  if (
    user.forgotPasswordExpiry &&
    new Date(user.forgotPasswordExpiry) < new Date()
  ) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  user.forgotPasswordToken = null;
  user.forgotPasswordExpiry = null;
  user.password = await generateHashPassword(newPassword);
  // Revoke all existing sessions by clearing the refresh token
  user.refreshToken = null;
  await user.save();
};

export const changeCurrentPassword = async ({
  userId,
  oldPassword,
  newPassword,
}) => {
  const user = await userQueries.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await isPasswordCorrect(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = await generateHashPassword(newPassword);
  await user.save();
};

export const addNewUser = async ({ email, roleId, firstName, password }) => {
  const existedUser = await userQueries.findOne({ where: { email } });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const hashPassword = await generateHashPassword(password);

  const user = await userQueries.create({
    email,
    firstName,
    roleId,
    password: hashPassword,
  });

  const createdUser = await userQueries.findById(user.userId, SAFE_ATTRS);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  return createdUser;
};

export const editUserDetails = async ({ userId, updateData }) => {
  const allowedFields = ["firstName", "lastName", "phone", "avatar"];
  const sanitizedData = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      sanitizedData[field] = updateData[field];
    }
  });

  if (Object.keys(sanitizedData).length === 0) {
    throw new ApiError(400, "No valid fields provided to update");
  }

  const updatedUser = await userQueries.findOneAndUpdate(
    { userId },
    sanitizedData,
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return updatedUser;
};

export const deleteUser = async (userId) => {
  const deletedCount = await userQueries.delete(userId);
  if (deletedCount === 0) {
    throw new ApiError(404, "User not found");
  }
};

/**
 * Find an existing user by Google subject ID (googleId) or email, or create a
 * new one.  Called from the OAuth callback after we have verified the Google
 * token and extracted the profile.
 *
 * @param {object} profile
 * @param {string} profile.googleId  - Google subject identifier (stable)
 * @param {string} profile.email     - Verified email from Google
 * @param {string} [profile.firstName]
 * @param {string} [profile.lastName]
 * @param {string} [profile.avatar]  - Profile picture URL from Google
 */
export const findOrCreateGoogleUser = async ({
  googleId,
  email,
  firstName,
  lastName,
  avatar,
}) => {
  // 1. Try to find an existing user by googleId first (fastest path).
  let user = await userQueries.findOne({ where: { googleId } });

  if (!user) {
    // 2. Maybe they previously registered with email/password using the same email.
    //    Link the Google ID to that account.
    user = await userQueries.findOne({ where: { email } });

    if (user) {
      // Link Google to the existing account.
      user.googleId = googleId;
      user.loginType = "GOOGLE";
      if (!user.firstName && firstName) user.firstName = firstName;
      if (!user.lastName && lastName) user.lastName = lastName;
      if (!user.profilePicUrl && avatar) user.profilePicUrl = avatar;
      await user.save();
    } else {
      // 3. Brand-new user — create them without a password.
      user = await userQueries.create({
        googleId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        profilePicUrl: avatar || null,
        roleId: "USER",
        loginType: "GOOGLE",
        password: null,
      });
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.userId,
  );

  const safeUser = await userQueries.findById(user.userId, SAFE_ATTRS);

  return { user: safeUser, accessToken, refreshToken };
};

export const getAllUsers = async ({ page = 1, limit = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  return await userQueries.getAllUsers({ limit: parsedLimit, offset });
};
