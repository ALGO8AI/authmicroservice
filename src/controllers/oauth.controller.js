import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build Google's OAuth2 authorization URL.
 * Redirect the browser here to start the "Login with Google" flow.
 */
const buildGoogleAuthUrl = (state) => {
  const base = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    // `state` is an opaque value we send and get back — used to prevent
    // CSRF attacks on the callback.
    state: state || "",
  });
  return `${base}?${params.toString()}`;
};

/**
 * Exchange an authorization `code` for tokens using Google's token endpoint.
 * Returns the raw token response JSON from Google.
 */
const exchangeCodeForTokens = async (code) => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    }).toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      502,
      `Google token exchange failed: ${data.error_description || data.error || "unknown error"}`,
    );
  }

  return data; // { access_token, id_token, token_type, expires_in, ... }
};

/**
 * Fetch the authenticated user's profile from Google using the access token.
 */
const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      502,
      `Failed to fetch Google profile: ${data.error_description || data.error || "unknown error"}`,
    );
  }

  // data.sub  — stable, unique Google subject ID
  // data.email
  // data.given_name, data.family_name
  // data.picture
  return data;
};

const COOKIE_OPTIONS = (isProduction) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * GET /auth/google
 *
 * Redirects the browser to Google's consent screen.
 * The frontend simply links to (or navigates to) this endpoint.
 */
export const googleRedirect = asyncHandler(async (req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_CALLBACK_URL
  ) {
    throw new ApiError(501, "Google OAuth is not configured on this server");
  }

  // Generate a random state value and store it in the session so we can
  // verify it when Google redirects back.
  const state = crypto.randomUUID();
  req.session.oauthState = state;

  const url = buildGoogleAuthUrl(state);
  return res.redirect(url);
});

/**
 * GET /auth/google/callback
 *
 * Google redirects here after the user grants (or denies) permission.
 * We exchange the one-time `code` for tokens, fetch the user profile,
 * find-or-create the user in our DB, then issue our own JWT.
 *
 * On success: redirects to OAUTH_SUCCESS_REDIRECT_URL with the access token
 *   in the query string (so SPAs / native apps can read it).
 * On failure: redirects to OAUTH_FAILURE_REDIRECT_URL with an `error` param.
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  // If Google returned an error (e.g. user denied access)
  if (error) {
    const failUrl = new URL(
      process.env.OAUTH_FAILURE_REDIRECT_URL ||
        `${req.protocol}://${req.get("host")}/api/v1/auth/google/failed`,
    );
    failUrl.searchParams.set("error", error);
    return res.redirect(failUrl.toString());
  }

  // CSRF check — verify the state parameter matches what we stored in the session.
  if (!state || state !== req.session.oauthState) {
    throw new ApiError(400, "Invalid OAuth state parameter");
  }

  // Clear the state from the session immediately (one-time use).
  delete req.session.oauthState;

  if (!code) {
    throw new ApiError(400, "Authorization code is missing");
  }

  // Step 1: Exchange code → Google tokens
  const tokens = await exchangeCodeForTokens(code);

  // Step 2: Fetch user profile from Google
  const profile = await fetchGoogleProfile(tokens.access_token);

  // Step 3: Find or create user in our DB, issue our own JWT
  const { user, accessToken, refreshToken } =
    await authService.findOrCreateGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      firstName: profile.given_name || null,
      lastName: profile.family_name || null,
      avatar: profile.picture || null,
    });

  // Set both tokens as httpOnly cookies (more secure than URL query string)
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS(isProduction));
  // Short-lived access token cookie (15 min expiry to match JWT expiry)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  // Redirect to the frontend success URL.
  // The frontend can read the accessToken from the cookie (set by the browser)
  // or call the /auth/google/success endpoint which reads from the cookie.
  const successUrl = new URL(
    process.env.OAUTH_SUCCESS_REDIRECT_URL ||
      `${req.protocol}://${req.get("host")}/api/v1/auth/google/success`,
  );
  // Only pass userId (not the token) so frontend can fetch user data if needed
  successUrl.searchParams.set("userId", user.userId);

  return res.redirect(successUrl.toString());
});

/**
 * GET /auth/google/failed
 *
 * Fallback endpoint used when OAUTH_FAILURE_REDIRECT_URL is not configured.
 * Returns a JSON error response.
 */
export const googleFailed = asyncHandler(async (req, _res) => {
  const { error } = req.query;
  throw new ApiError(
    401,
    error === "access_denied"
      ? "Google sign-in was cancelled"
      : "Google sign-in failed",
  );
});

/**
 * GET /auth/google/success
 *
 * Fallback endpoint used when OAUTH_SUCCESS_REDIRECT_URL is not configured.
 * Returns a JSON response with the access token — useful for API clients and
 * testing.
 */
export const googleSuccess = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  // Read the accessToken from the httpOnly cookie set by googleCallback.
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    throw new ApiError(400, "Missing access token");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken, userId },
        "Google sign-in successful",
      ),
    );
});
