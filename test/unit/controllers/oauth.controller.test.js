import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ApiError } from "../../../src/utils/ApiError.js";
import { createMockNext, createMockRequest, createMockResponse, executeHandler } from "../helpers/http.helper.js";

const authService = {
  findOrCreateGoogleUser: jest.fn(),
};

await jest.unstable_mockModule("../../../src/services/auth.service.js", () => authService);

const oauthController = await import("../../../src/controllers/oauth.controller.js");

describe("oauth.controller", () => {
  beforeEach(() => {
    authService.findOrCreateGoogleUser.mockReset();
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.GOOGLE_CALLBACK_URL = "https://api.example.com/callback";
    delete process.env.OAUTH_SUCCESS_REDIRECT_URL;
    delete process.env.OAUTH_FAILURE_REDIRECT_URL;
  });

  it("googleRedirect rejects unconfigured oauth", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const next = createMockNext();

    await executeHandler(oauthController.googleRedirect, createMockRequest(), createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].message).toBe("Google OAuth is not configured on this server");
  });

  it("googleRedirect stores state in session and redirects to google", async () => {
    const req = createMockRequest({ session: {} });
    const res = createMockResponse();

    await executeHandler(oauthController.googleRedirect, req, res, createMockNext());

    expect(req.session.oauthState).toBeTruthy();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining("https://accounts.google.com/o/oauth2/v2/auth"));
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(`state=${req.session.oauthState}`));
  });

  it("googleCallback redirects failures from google back to a fallback endpoint", async () => {
    const req = createMockRequest({
      query: { error: "access_denied" },
      protocol: "https",
      headers: { host: "api.example.com" },
    });
    const res = createMockResponse();

    await executeHandler(oauthController.googleCallback, req, res, createMockNext());

    expect(res.redirect).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/auth/google/failed?error=access_denied",
    );
  });

  it("googleCallback rejects invalid state values", async () => {
    const next = createMockNext();

    await executeHandler(
      oauthController.googleCallback,
      createMockRequest({ query: { code: "abc", state: "bad" }, session: { oauthState: "expected" } }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toBe("Invalid OAuth state parameter");
  });

  it("googleCallback rejects missing authorization code", async () => {
    const next = createMockNext();

    await executeHandler(
      oauthController.googleCallback,
      createMockRequest({ query: { state: "state-1" }, session: { oauthState: "state-1" } }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toBe("Authorization code is missing");
  });

  it("googleCallback exchanges tokens, sets cookies, and redirects on success", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "google-access" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "google-1",
          email: "user@example.com",
          given_name: "Test",
          family_name: "User",
          picture: "https://avatar",
        }),
      });
    authService.findOrCreateGoogleUser.mockResolvedValue({
      user: { userId: "u1" },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    const req = createMockRequest({
      query: { code: "auth-code", state: "state-1" },
      session: { oauthState: "state-1" },
      protocol: "https",
      headers: { host: "api.example.com" },
    });
    const res = createMockResponse();

    await executeHandler(oauthController.googleCallback, req, res, createMockNext());

    expect(authService.findOrCreateGoogleUser).toHaveBeenCalledWith({
      googleId: "google-1",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      avatar: "https://avatar",
    });
    expect(res.cookie).toHaveBeenNthCalledWith(
      1,
      "refreshToken",
      "refresh-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/auth/google/success?userId=u1",
    );
    expect(req.session.oauthState).toBeUndefined();
  });

  it("googleFailed maps access_denied to a friendly message", async () => {
    const next = createMockNext();

    await executeHandler(
      oauthController.googleFailed,
      createMockRequest({ query: { error: "access_denied" } }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toBe("Google sign-in was cancelled");
  });

  it("googleSuccess returns the access token from cookie", async () => {
    const req = createMockRequest({ query: { userId: "u1" }, cookies: { accessToken: "cookie-token" } });
    const res = createMockResponse();

    await executeHandler(oauthController.googleSuccess, req, res, createMockNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { accessToken: "cookie-token", userId: "u1" } }),
    );
  });

  it("googleSuccess rejects missing access token cookie", async () => {
    const next = createMockNext();

    await executeHandler(
      oauthController.googleSuccess,
      createMockRequest({ query: { userId: "u1" }, cookies: {} }),
      createMockResponse(),
      next,
    );

    expect(next.mock.calls[0][0].message).toBe("Missing access token");
  });
});
