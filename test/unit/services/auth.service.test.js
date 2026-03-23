import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockUserQueries = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  clearRefreshToken: jest.fn(),
  delete: jest.fn(),
  findOneAndUpdate: jest.fn(),
  getAllUsers: jest.fn(),
};
const mockGenerateAccessToken = jest.fn();
const mockGenerateRefreshToken = jest.fn();
const mockGenerateHashPassword = jest.fn();
const mockIsPasswordCorrect = jest.fn();
const mockSendEmail = jest.fn();
const mockForgotPasswordTemplate = jest.fn();
const mockGenerateOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockLoggerError = jest.fn();
const mockJwtVerify = jest.fn();

await jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hashSync: jest.fn(() => "dummy-hash"),
  },
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    verify: mockJwtVerify,
  },
}));

await jest.unstable_mockModule("../../../src/queries/auth.queries.js", () => ({
  default: mockUserQueries,
  EXCLUDED_FIELDS: [
    "password",
    "pin",
    "refreshToken",
    "otp",
    "generationTime",
    "otpAttempts",
    "otpLockedUntil",
  ],
}));

await jest.unstable_mockModule("../../../src/utils/jwt.js", () => ({
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
}));

await jest.unstable_mockModule("../../../src/utils/password.js", () => ({
  generateHashPassword: mockGenerateHashPassword,
  isPasswordCorrect: mockIsPasswordCorrect,
}));

await jest.unstable_mockModule("../../../src/logger/winston.logger.js", () => ({
  default: {
    error: mockLoggerError,
  },
}));

await jest.unstable_mockModule("../../../src/utils/mail.js", () => ({
  sendEmail: mockSendEmail,
  forgotPasswordOtpMailgenContent: mockForgotPasswordTemplate,
}));

await jest.unstable_mockModule("../../../src/utils/otp.js", () => ({
  generateOtp: mockGenerateOtp,
  verifyOtp: mockVerifyOtp,
}));

const service = await import("../../../src/services/auth.service.js");

describe("auth.service", () => {
  beforeEach(() => {
    Object.values(mockUserQueries).forEach((fn) => fn.mockReset());
    mockGenerateAccessToken.mockReset();
    mockGenerateRefreshToken.mockReset();
    mockGenerateHashPassword.mockReset();
    mockIsPasswordCorrect.mockReset();
    mockSendEmail.mockReset();
    mockForgotPasswordTemplate.mockReset();
    mockGenerateOtp.mockReset();
    mockVerifyOtp.mockReset();
    mockLoggerError.mockReset();
    mockJwtVerify.mockReset();
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  });

  describe("registerUser", () => {
    it("creates a new user and returns the safe record", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);
      mockGenerateHashPassword.mockResolvedValue("hashed-password");
      mockUserQueries.create.mockResolvedValue({ userId: "u1" });
      mockUserQueries.findById.mockResolvedValue({ userId: "u1", email: "user@example.com" });

      const result = await service.registerUser({ email: "user@example.com", password: "password123" });

      expect(result).toEqual({ userId: "u1", email: "user@example.com" });
      expect(mockUserQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "user@example.com", password: "hashed-password", roleId: "USER" }),
      );
    });

    it("rejects duplicate registrations", async () => {
      mockUserQueries.findOne.mockResolvedValue({ userId: "existing" });

      await expect(service.registerUser({ email: "user@example.com", password: "password123" })).rejects.toMatchObject({ statusCode: 409, message: "User with email already exists" });
    });

    it("fails when the created user cannot be reloaded safely", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);
      mockGenerateHashPassword.mockResolvedValue("hashed-password");
      mockUserQueries.create.mockResolvedValue({ userId: "u1" });
      mockUserQueries.findById.mockResolvedValue(null);

      await expect(service.registerUser({ email: "user@example.com", password: "password123" })).rejects.toMatchObject({ statusCode: 500 });
    });
  });

  describe("loginUser", () => {
    it("rejects unknown users after timing-mitigation compare", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);
      mockIsPasswordCorrect.mockResolvedValue(false);

      await expect(service.loginUser({ email: "missing@example.com", password: "password123" })).rejects.toMatchObject({ statusCode: 401 });
      expect(mockIsPasswordCorrect).toHaveBeenCalledWith("password123", "dummy-hash");
    });

    it("rejects invalid passwords", async () => {
      mockUserQueries.findOne.mockResolvedValue({ userId: "u1", password: "hash" });
      mockIsPasswordCorrect.mockResolvedValue(false);

      await expect(service.loginUser({ email: "user@example.com", password: "bad-pass" })).rejects.toMatchObject({ statusCode: 401 });
    });

    it("returns tokens and a safe user on success", async () => {
      const persistedUser = { userId: "u1", email: "user@example.com", roleId: "USER", save: jest.fn() };
      mockUserQueries.findOne
        .mockResolvedValueOnce({ userId: "u1", password: "hash" })
        .mockResolvedValueOnce(persistedUser);
      mockIsPasswordCorrect.mockResolvedValue(true);
      mockGenerateAccessToken.mockResolvedValue("access-token");
      mockGenerateRefreshToken.mockResolvedValue("refresh-token");
      mockUserQueries.findById.mockResolvedValue({ userId: "u1", email: "user@example.com" });

      const result = await service.loginUser({ email: "user@example.com", password: "password123" });

      expect(result).toEqual({
        user: { userId: "u1", email: "user@example.com" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(persistedUser.refreshToken).toBe("refresh-token");
      expect(persistedUser.save).toHaveBeenCalled();
    });
  });

  it("logoutUser clears the stored refresh token", async () => {
    await service.logoutUser("u1");
    expect(mockUserQueries.clearRefreshToken).toHaveBeenCalledWith("u1");
  });

  describe("refreshAccessToken", () => {
    it("rejects invalid jwt refresh tokens", async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error("invalid jwt");
      });

      await expect(service.refreshAccessToken("bad-token")).rejects.toMatchObject({ statusCode: 401, message: "Invalid refresh token" });
    });

    it("rejects tokens for deleted users", async () => {
      mockJwtVerify.mockReturnValue({ userId: "u1" });
      mockUserQueries.findById.mockResolvedValue(null);

      await expect(service.refreshAccessToken("token-1")).rejects.toMatchObject({ statusCode: 401, message: "Invalid refresh token" });
    });

    it("rejects replayed or mismatched refresh tokens", async () => {
      mockJwtVerify.mockReturnValue({ userId: "u1" });
      mockUserQueries.findById.mockResolvedValue({ userId: "u1", refreshToken: "different-token" });

      await expect(service.refreshAccessToken("token-1")).rejects.toMatchObject({ statusCode: 401, message: "Refresh token is expired or used" });
    });

    it("rotates refresh tokens on success", async () => {
      const persistedUser = { userId: "u1", email: "user@example.com", roleId: "USER", refreshToken: "token-1", save: jest.fn() };
      mockJwtVerify.mockReturnValue({ userId: "u1" });
      mockUserQueries.findById
        .mockResolvedValueOnce({ userId: "u1", refreshToken: "token-1" })
        .mockResolvedValueOnce(persistedUser);
      mockUserQueries.findOne.mockResolvedValue(persistedUser);
      mockGenerateAccessToken.mockResolvedValue("next-access");
      mockGenerateRefreshToken.mockResolvedValue("next-refresh");

      const result = await service.refreshAccessToken("token-1");

      expect(result).toEqual({ accessToken: "next-access", newRefreshToken: "next-refresh" });
      expect(persistedUser.save).toHaveBeenCalled();
    });
  });

  describe("forgotPasswordRequest", () => {
    it("rejects unknown users", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);

      await expect(service.forgotPasswordRequest("missing@example.com")).rejects.toMatchObject({ statusCode: 400, message: "User not found." });
    });

    it("stores otp metadata after a successful email send", async () => {
      const user = { userId: "u1", email: "user@example.com", firstName: "Test", save: jest.fn() };
      mockUserQueries.findOne.mockResolvedValue(user);
      mockGenerateOtp.mockResolvedValue({ otp: 123456, hashedOtp: "hashed-otp", generationTime: new Date("2024-01-01T00:00:00.000Z") });
      mockForgotPasswordTemplate.mockReturnValue("<html>otp</html>");
      mockSendEmail.mockResolvedValue({ flag: true });

      const result = await service.forgotPasswordRequest("user@example.com");

      expect(result).toBe(true);
      expect(user.otp).toBe("hashed-otp");
      expect(user.otpAttempts).toBe(0);
      expect(user.otpLockedUntil).toBeNull();
      expect(user.save).toHaveBeenCalled();
    });

    it("logs and throws when email delivery fails", async () => {
      const user = { userId: "u1", email: "user@example.com", firstName: null, save: jest.fn() };
      mockUserQueries.findOne.mockResolvedValue(user);
      mockGenerateOtp.mockResolvedValue({ otp: 123456, hashedOtp: "hashed-otp", generationTime: new Date() });
      mockForgotPasswordTemplate.mockReturnValue("<html>otp</html>");
      mockSendEmail.mockResolvedValue({ flag: false, error: { message: "smtp failed", code: "EAUTH" } });

      await expect(service.forgotPasswordRequest("user@example.com")).rejects.toMatchObject({ statusCode: 400, message: "Error in sending otp, try again later." });
      expect(mockLoggerError).toHaveBeenCalledWith(
        "Failed to send password reset email",
        expect.objectContaining({ userId: "u1", error: "smtp failed" }),
      );
    });
  });

  describe("verifyUserByOtp", () => {
    it("rejects unknown users", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);

      await expect(service.verifyUserByOtp({ email: "missing@example.com", newPassword: "password123", inputedOtp: "123456" })).rejects.toMatchObject({ statusCode: 400, message: "User not found." });
    });

    it("rejects users without otp metadata", async () => {
      mockUserQueries.findOne.mockResolvedValue({ otp: null, generationTime: null });

      await expect(service.verifyUserByOtp({ email: "user@example.com", newPassword: "password123", inputedOtp: "123456" })).rejects.toMatchObject({ statusCode: 400, message: "OTP is invalid or expired." });
    });

    it("rejects locked accounts", async () => {
      mockUserQueries.findOne.mockResolvedValue({ otp: "hashed", generationTime: new Date(), otpLockedUntil: new Date(Date.now() + 60000) });

      await expect(service.verifyUserByOtp({ email: "user@example.com", newPassword: "password123", inputedOtp: "123456" })).rejects.toMatchObject({ statusCode: 400, message: "Too many failed attempts. Please try again later." });
    });

    it("resets otp state and password on valid otp", async () => {
      const user = {
        otp: "hashed",
        generationTime: new Date(),
        otpAttempts: 2,
        otpLockedUntil: null,
        refreshToken: "old-refresh",
        save: jest.fn(),
      };
      mockUserQueries.findOne.mockResolvedValue(user);
      mockVerifyOtp.mockResolvedValue(true);
      mockGenerateHashPassword.mockResolvedValue("new-hash");

      const result = await service.verifyUserByOtp({ email: "user@example.com", newPassword: "password123", inputedOtp: "123456" });

      expect(result).toBe(true);
      expect(user.password).toBe("new-hash");
      expect(user.otp).toBeNull();
      expect(user.generationTime).toBeNull();
      expect(user.otpAttempts).toBe(0);
      expect(user.otpLockedUntil).toBeNull();
      expect(user.refreshToken).toBeNull();
      expect(user.save).toHaveBeenCalled();
    });

    it("increments failed attempts for invalid otp", async () => {
      const user = { otp: "hashed", generationTime: new Date(), otpAttempts: 1, otpLockedUntil: null, save: jest.fn() };
      mockUserQueries.findOne.mockResolvedValue(user);
      mockVerifyOtp.mockResolvedValue(false);

      await expect(service.verifyUserByOtp({ email: "user@example.com", newPassword: "password123", inputedOtp: "000000" })).rejects.toMatchObject({ statusCode: 400, message: "OTP is invalid or expired." });
      expect(user.otpAttempts).toBe(2);
      expect(user.save).toHaveBeenCalled();
    });

    it("locks the account after too many failed attempts", async () => {
      const user = { otp: "hashed", generationTime: new Date(), otpAttempts: 4, otpLockedUntil: null, save: jest.fn() };
      mockUserQueries.findOne.mockResolvedValue(user);
      mockVerifyOtp.mockResolvedValue(false);

      await expect(service.verifyUserByOtp({ email: "user@example.com", newPassword: "password123", inputedOtp: "000000" })).rejects.toMatchObject({ statusCode: 400, message: "Too many failed attempts. Please try again later." });
      expect(user.otp).toBeNull();
      expect(user.generationTime).toBeNull();
      expect(user.otpLockedUntil).toBeInstanceOf(Date);
    });
  });

  describe("changeCurrentPassword", () => {
    it("rejects unknown users", async () => {
      mockUserQueries.findById.mockResolvedValue(null);

      await expect(service.changeCurrentPassword({ userId: "missing", oldPassword: "old", newPassword: "newpass123" })).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    it("rejects invalid old passwords", async () => {
      mockUserQueries.findById.mockResolvedValue({ password: "hash" });
      mockIsPasswordCorrect.mockResolvedValue(false);

      await expect(service.changeCurrentPassword({ userId: "u1", oldPassword: "bad", newPassword: "newpass123" })).rejects.toMatchObject({ statusCode: 400, message: "Invalid old password" });
    });

    it("saves a new password hash", async () => {
      const user = { password: "hash", save: jest.fn() };
      mockUserQueries.findById.mockResolvedValue(user);
      mockIsPasswordCorrect.mockResolvedValue(true);
      mockGenerateHashPassword.mockResolvedValue("new-hash");

      await service.changeCurrentPassword({ userId: "u1", oldPassword: "old", newPassword: "newpass123" });

      expect(user.password).toBe("new-hash");
      expect(user.save).toHaveBeenCalled();
    });
  });

  describe("addNewUser", () => {
    it("rejects duplicates", async () => {
      mockUserQueries.findOne.mockResolvedValue({ userId: "existing" });

      await expect(service.addNewUser({ email: "user@example.com", roleId: "USER", firstName: "Test", password: "password123" })).rejects.toMatchObject({ statusCode: 409 });
    });

    it("returns the created safe user", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);
      mockGenerateHashPassword.mockResolvedValue("hashed-password");
      mockUserQueries.create.mockResolvedValue({ userId: "u1" });
      mockUserQueries.findById.mockResolvedValue({ userId: "u1", email: "user@example.com" });

      const result = await service.addNewUser({ email: "user@example.com", roleId: "MANAGER", firstName: "Test", password: "password123" });

      expect(result).toEqual({ userId: "u1", email: "user@example.com" });
      expect(mockUserQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: "MANAGER", firstName: "Test" }),
      );
    });

    it("fails when the created user cannot be reloaded", async () => {
      mockUserQueries.findOne.mockResolvedValue(null);
      mockGenerateHashPassword.mockResolvedValue("hashed-password");
      mockUserQueries.create.mockResolvedValue({ userId: "u1" });
      mockUserQueries.findById.mockResolvedValue(null);

      await expect(service.addNewUser({ email: "user@example.com", roleId: "MANAGER", firstName: "Test", password: "password123" })).rejects.toMatchObject({ statusCode: 500 });
    });
  });

  describe("editUserDetails", () => {
    it("rejects requests without allowed fields", async () => {
      await expect(service.editUserDetails({ userId: "u1", updateData: { roleId: "ADMIN" } })).rejects.toMatchObject({ statusCode: 400, message: "No valid fields provided to update" });
    });

    it("rejects unknown target users", async () => {
      mockUserQueries.findById.mockResolvedValue(null);

      await expect(service.editUserDetails({ userId: "u1", updateData: { firstName: "Updated" } })).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    it("blocks admin updates", async () => {
      mockUserQueries.findById.mockResolvedValue({ roleId: "ADMIN" });

      await expect(service.editUserDetails({ userId: "u1", updateData: { firstName: "Updated" } })).rejects.toMatchObject({ statusCode: 403, message: "Admin details cannot be modified" });
    });

    it("updates only allowed fields", async () => {
      mockUserQueries.findById.mockResolvedValue({ roleId: "USER" });
      mockUserQueries.findOneAndUpdate.mockResolvedValue({ userId: "u1", firstName: "Updated" });

      const result = await service.editUserDetails({ userId: "u1", updateData: { firstName: "Updated", roleId: "ADMIN", avatar: "avatar.png" } });

      expect(mockUserQueries.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: "u1" },
        { firstName: "Updated", avatar: "avatar.png" },
      );
      expect(result).toEqual({ userId: "u1", firstName: "Updated" });
    });
  });

  describe("deleteUser", () => {
    it("rejects missing users", async () => {
      mockUserQueries.findById.mockResolvedValue(null);

      await expect(service.deleteUser("u1")).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    it("blocks admin deletions", async () => {
      mockUserQueries.findById.mockResolvedValue({ roleId: "ADMIN" });

      await expect(service.deleteUser("u1")).rejects.toMatchObject({ statusCode: 403, message: "Admin users cannot be deleted" });
    });

    it("fails when the downstream delete reports nothing deleted", async () => {
      mockUserQueries.findById.mockResolvedValue({ roleId: "USER" });
      mockUserQueries.delete.mockResolvedValue(0);

      await expect(service.deleteUser("u1")).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
    });

    it("allows deleting non-admin users", async () => {
      mockUserQueries.findById.mockResolvedValue({ roleId: "USER" });
      mockUserQueries.delete.mockResolvedValue(1);

      await expect(service.deleteUser("u1")).resolves.toBeUndefined();
    });
  });

  describe("findOrCreateGoogleUser", () => {
    it("uses an existing google-linked user when available", async () => {
      const persistedUser = { userId: "u1", email: "user@example.com", roleId: "USER", save: jest.fn() };
      mockUserQueries.findOne
        .mockResolvedValueOnce({ userId: "u1" })
        .mockResolvedValueOnce(persistedUser);
      mockGenerateAccessToken.mockResolvedValue("access-token");
      mockGenerateRefreshToken.mockResolvedValue("refresh-token");
      mockUserQueries.findById.mockResolvedValue({ userId: "u1", email: "user@example.com" });

      const result = await service.findOrCreateGoogleUser({ googleId: "g1", email: "user@example.com", firstName: "Test", lastName: "User", avatar: "pic" });

      expect(result).toEqual({
        user: { userId: "u1", email: "user@example.com" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("links an existing email/password account to google", async () => {
      const linkedUser = { userId: "u2", firstName: null, lastName: null, profilePicUrl: null, save: jest.fn() };
      const persistedUser = { userId: "u2", email: "user@example.com", roleId: "USER", save: jest.fn() };
      mockUserQueries.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(linkedUser)
        .mockResolvedValueOnce(persistedUser);
      mockGenerateAccessToken.mockResolvedValue("access-token");
      mockGenerateRefreshToken.mockResolvedValue("refresh-token");
      mockUserQueries.findById.mockResolvedValue({ userId: "u2", email: "user@example.com" });

      await service.findOrCreateGoogleUser({ googleId: "g2", email: "user@example.com", firstName: "Test", lastName: "User", avatar: "pic" });

      expect(linkedUser.googleId).toBe("g2");
      expect(linkedUser.loginType).toBe("GOOGLE");
      expect(linkedUser.firstName).toBe("Test");
      expect(linkedUser.lastName).toBe("User");
      expect(linkedUser.profilePicUrl).toBe("pic");
      expect(linkedUser.save).toHaveBeenCalled();
    });

    it("creates a new google user when none exists", async () => {
      const persistedUser = { userId: "u3", email: "new@example.com", roleId: "USER", save: jest.fn() };
      mockUserQueries.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(persistedUser);
      mockUserQueries.create.mockResolvedValue({ userId: "u3" });
      mockGenerateAccessToken.mockResolvedValue("access-token");
      mockGenerateRefreshToken.mockResolvedValue("refresh-token");
      mockUserQueries.findById.mockResolvedValue({ userId: "u3", email: "new@example.com" });

      await service.findOrCreateGoogleUser({ googleId: "g3", email: "new@example.com", firstName: "New", lastName: "User", avatar: null });

      expect(mockUserQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: "g3", email: "new@example.com", loginType: "GOOGLE", password: null }),
      );
    });
  });

  it("getAllUsers normalizes pagination bounds", async () => {
    mockUserQueries.getAllUsers.mockResolvedValue({ users: [], total: 0, limit: 100, offset: 0 });

    const result = await service.getAllUsers({ page: "0", limit: "200" });

    expect(mockUserQueries.getAllUsers).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    expect(result).toEqual({ users: [], total: 0, limit: 100, offset: 0 });
  });
});
