import { describe, expect, it, jest } from "@jest/globals";

const mockSign = jest.fn();

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: mockSign,
  },
}));

const { generateAccessToken, generateRefreshToken, generateTemporaryToken } =
  await import("../../../src/utils/jwt.js");

describe("jwt utils", () => {
  it("generates access tokens with configured secret and expiry", async () => {
    mockSign.mockReturnValue("access-token");

    const result = await generateAccessToken({ userId: "user-1" });

    expect(result).toBe("access-token");
    expect(mockSign).toHaveBeenCalledWith(
      { userId: "user-1" },
      "test-access-secret",
      { expiresIn: "15m" },
    );
  });

  it("generates refresh tokens with configured secret and expiry", async () => {
    mockSign.mockReturnValue("refresh-token");

    const result = await generateRefreshToken({ userId: "user-2" });

    expect(result).toBe("refresh-token");
    expect(mockSign).toHaveBeenCalledWith(
      { userId: "user-2" },
      "test-refresh-secret",
      { expiresIn: "7d" },
    );
  });

  it("creates a temporary token pair and expiry", async () => {
    const result = await generateTemporaryToken();

    expect(result.unHashedToken).toHaveLength(40);
    expect(result.hashedToken).toHaveLength(64);
    expect(result.tokenExpiry).toBeGreaterThan(Date.now());
  });
});
