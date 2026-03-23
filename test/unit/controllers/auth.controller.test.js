import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ApiError } from "../../../src/utils/ApiError.js";
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  executeHandler,
} from "../helpers/http.helper.js";

const authService = {
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  refreshAccessToken: jest.fn(),
  forgotPasswordRequest: jest.fn(),
  verifyUserByOtp: jest.fn(),
  changeCurrentPassword: jest.fn(),
  addNewUser: jest.fn(),
  editUserDetails: jest.fn(),
  deleteUser: jest.fn(),
  getAllUsers: jest.fn(),
};

await jest.unstable_mockModule("../../../src/services/auth.service.js", () => authService);

const controller = await import("../../../src/controllers/auth.controller.js");

describe("auth.controller", () => {
  beforeEach(() => {
    Object.values(authService).forEach((mockFn) => mockFn.mockReset());
  });

  it("registerUser returns 201 with created user", async () => {
    const req = createMockRequest({ body: { email: "user@example.com", password: "password123" } });
    const res = createMockResponse();
    authService.registerUser.mockResolvedValue({ userId: "u1" });

    await executeHandler(controller.registerUser, req, res, createMockNext());

    expect(authService.registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User registered successfully." }),
    );
  });

  it("registerUser forwards validation errors", async () => {
    const next = createMockNext();

    await executeHandler(
      controller.registerUser,
      createMockRequest({ body: { email: "", password: "" } }),
      createMockResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].message).toBe("Email and password are required");
  });

  it("loginUser sets a refresh token cookie and returns access token data", async () => {
    const req = createMockRequest({ body: { email: "user@example.com", password: "password123" } });
    const res = createMockResponse();
    authService.loginUser.mockResolvedValue({
      user: { userId: "u1" },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    await executeHandler(controller.loginUser, req, res, createMockNext());

    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.objectContaining({ httpOnly: true, secure: false }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("loginUser rejects missing credentials", async () => {
    const next = createMockNext();

    await executeHandler(
      controller.loginUser,
      createMockRequest({ body: { email: "user@example.com" } }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toBe("Password and email are required");
  });

  it("logoutUser clears the refresh token cookie", async () => {
    const req = createMockRequest({ user: { userId: "u1" } });
    const res = createMockResponse();

    await executeHandler(controller.logoutUser, req, res, createMockNext());

    expect(authService.logoutUser).toHaveBeenCalledWith("u1");
    expect(res.clearCookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("refreshAccessToken reads token from cookies when present", async () => {
    const req = createMockRequest({ cookies: { refreshToken: "cookie-token" }, body: {} });
    const res = createMockResponse();
    authService.refreshAccessToken.mockResolvedValue({
      accessToken: "new-access",
      newRefreshToken: "new-refresh",
    });

    await executeHandler(controller.refreshAccessToken, req, res, createMockNext());

    expect(authService.refreshAccessToken).toHaveBeenCalledWith("cookie-token");
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "new-refresh",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("refreshAccessToken rejects missing refresh token", async () => {
    const next = createMockNext();

    await executeHandler(
      controller.refreshAccessToken,
      createMockRequest({ body: {}, cookies: {} }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toBe("Unauthorized request");
  });

  it("forgotPasswordRequest delegates to the service", async () => {
    const req = createMockRequest({ body: { email: "user@example.com" } });
    const res = createMockResponse();

    await executeHandler(controller.forgotPasswordRequest, req, res, createMockNext());

    expect(authService.forgotPasswordRequest).toHaveBeenCalledWith("user@example.com");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("verifyUserByOtp rejects incomplete payloads", async () => {
    const next = createMockNext();

    await executeHandler(
      controller.verifyUserByOtp,
      createMockRequest({ body: { email: "user@example.com", newPassword: "short" } }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toContain("valid new password");
  });

  it("verifyUserByOtp delegates valid payloads", async () => {
    const req = createMockRequest({ body: { email: "user@example.com", newPassword: "password123", inputedOtp: "123456" } });
    const res = createMockResponse();

    await executeHandler(controller.verifyUserByOtp, req, res, createMockNext());

    expect(authService.verifyUserByOtp).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("changeCurrentPassword passes req.user context to the service", async () => {
    const req = createMockRequest({ body: { oldPassword: "old", newPassword: "newpass123" }, user: { userId: "u1" } });

    await executeHandler(controller.changeCurrentPassword, req, createMockResponse(), createMockNext());

    expect(authService.changeCurrentPassword).toHaveBeenCalledWith({
      userId: "u1",
      oldPassword: "old",
      newPassword: "newpass123",
    });
  });

  it("getCurrentUser returns the authenticated user", async () => {
    const req = createMockRequest({ user: { userId: "u1" } });
    const res = createMockResponse();

    await executeHandler(controller.getCurrentUser, req, res, createMockNext());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "u1" } }),
    );
  });

  it("addNewUser returns created user details", async () => {
    const req = createMockRequest({ body: { email: "user@example.com", roleId: "USER", firstName: "Test", password: "password123" } });
    const res = createMockResponse();
    authService.addNewUser.mockResolvedValue({ userId: "u9" });

    await executeHandler(controller.addNewUser, req, res, createMockNext());

    expect(authService.addNewUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("editUserDetails updates the targeted user", async () => {
    const req = createMockRequest({ params: { userId: "u2" }, body: { firstName: "Updated" } });
    const res = createMockResponse();
    authService.editUserDetails.mockResolvedValue({ userId: "u2", firstName: "Updated" });

    await executeHandler(controller.editUserDetails, req, res, createMockNext());

    expect(authService.editUserDetails).toHaveBeenCalledWith({
      userId: "u2",
      updateData: { firstName: "Updated" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deleteUser delegates by route param", async () => {
    const req = createMockRequest({ params: { userId: "u3" } });
    const res = createMockResponse();

    await executeHandler(controller.deleteUser, req, res, createMockNext());

    expect(authService.deleteUser).toHaveBeenCalledWith("u3");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getAllUsers forwards pagination query params", async () => {
    const req = createMockRequest({ query: { page: "2", limit: "50" } });
    const res = createMockResponse();
    authService.getAllUsers.mockResolvedValue({ users: [], total: 0, limit: 50, offset: 50 });

    await executeHandler(controller.getAllUsers, req, res, createMockNext());

    expect(authService.getAllUsers).toHaveBeenCalledWith({ page: "2", limit: "50" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
