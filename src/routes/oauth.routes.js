import { Router } from "express";
import {
  googleCallback,
  googleFailed,
  googleRedirect,
  googleSuccess,
} from "../controllers/oauth.controller.js";

const router = Router();

/**
 * GET /auth/google
 * Redirects the user to Google's OAuth consent screen.
 * The frontend links/navigates to this URL to start the sign-in flow.
 */
router.route("/google").get(googleRedirect);

/**
 * GET /auth/google/callback
 * Google redirects here with a one-time authorization code.
 * This handler exchanges it for tokens, fetches the profile, and issues
 * our own JWT before redirecting to the configured frontend success URL.
 */
router.route("/google/callback").get(googleCallback);

/**
 * GET /auth/google/failed
 * Fallback when OAUTH_FAILURE_REDIRECT_URL is not set.
 * Returns a JSON error — useful for API clients / testing.
 */
router.route("/google/failed").get(googleFailed);

/**
 * GET /auth/google/success
 * Fallback when OAUTH_SUCCESS_REDIRECT_URL is not set.
 * Returns a JSON response with the accessToken — useful for API clients.
 */
router.route("/google/success").get(googleSuccess);

export default router;
