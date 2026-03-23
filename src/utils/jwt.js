import jwt from "jsonwebtoken";

export async function generateAccessToken(details) {
  return jwt.sign(details, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
}

export async function generateRefreshToken(details) {
  return jwt.sign(details, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
}

export async function generateTemporaryToken() {
  const { randomBytes, createHash } = await import("crypto");
  const unHashedToken = randomBytes(20).toString("hex");
  const hashedToken = createHash("sha256").update(unHashedToken).digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000;
  return { unHashedToken, hashedToken, tokenExpiry };
}
