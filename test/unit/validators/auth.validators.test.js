import { describe, expect, it } from "@jest/globals";
import {
  addNewUserValidator,
  userAssignRoleValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userIdParamValidator,
  userLoginValidator,
  userRefreshTokenValidator,
  userRegisterValidator,
  verifyUserByOtpValidator,
} from "../../../src/validators/auth.validators.js";
import { createMockRequest } from "../helpers/http.helper.js";
import { runValidationChains } from "../helpers/validation.helper.js";

const getMessages = async (chains, req) => {
  const result = await runValidationChains(chains, req);
  return result.array().map((error) => error.msg);
};

describe("auth validators", () => {
  it("validates user registration payloads", async () => {
    const badMessages = await getMessages(
      userRegisterValidator(),
      createMockRequest({ body: { email: "bad", password: "123" } }),
    );

    expect(badMessages).toEqual(
      expect.arrayContaining([
        "Email is invalid",
        "password must be at least 8 characters long",
      ]),
    );

    const goodResult = await runValidationChains(
      userRegisterValidator(),
      createMockRequest({ body: { email: "USER@EXAMPLE.COM", password: "password123" } }),
    );

    expect(goodResult.isEmpty()).toBe(true);
  });

  it("requires either email or username for login", async () => {
    const messages = await getMessages(
      userLoginValidator(),
      createMockRequest({ body: { password: "password123" } }),
    );

    expect(messages).toContain("Email or username is required");
  });

  it("validates change-password payloads", async () => {
    const messages = await getMessages(
      userChangeCurrentPasswordValidator(),
      createMockRequest({ body: { oldPassword: "", newPassword: "123" } }),
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        "Old password is required",
        "newPassword must be at least 8 characters long",
      ]),
    );
  });

  it("validates forgot-password requests", async () => {
    const messages = await getMessages(
      userForgotPasswordValidator(),
      createMockRequest({ body: { email: "" } }),
    );

    expect(messages).toContain("Email is required");
  });

  it("validates otp verification payloads", async () => {
    const messages = await getMessages(
      verifyUserByOtpValidator(),
      createMockRequest({ body: { email: "user@example.com", newPassword: "short", inputedOtp: "" } }),
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        "newPassword must be at least 8 characters long",
        "OTP is required",
      ]),
    );
  });

  it("validates role assignment payloads", async () => {
    const messages = await getMessages(
      userAssignRoleValidator(),
      createMockRequest({ body: { role: "ROOT" } }),
    );

    expect(messages).toContain("Invalid user role");
  });

  it("allows refresh token validator to pass when token is omitted from body", async () => {
    const result = await runValidationChains(
      userRefreshTokenValidator(),
      createMockRequest({ body: {} }),
    );

    expect(result.isEmpty()).toBe(true);
  });

  it("rejects empty body refresh tokens", async () => {
    const messages = await getMessages(
      userRefreshTokenValidator(),
      createMockRequest({ body: { refreshToken: "" } }),
    );

    expect(messages).toContain("Refresh token is required");
  });

  it("validates add-new-user payloads", async () => {
    const messages = await getMessages(
      addNewUserValidator(),
      createMockRequest({ body: { email: "user@example.com", password: "password123", firstName: "", roleId: "" } }),
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        "First name is required",
        "Role ID is required",
      ]),
    );
  });

  it("validates user id params", async () => {
    const messages = await getMessages(
      userIdParamValidator(),
      createMockRequest({ params: { userId: "not-a-uuid" } }),
    );

    expect(messages).toContain("Invalid user ID");
  });
});
