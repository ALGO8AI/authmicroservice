# Authentication Guide

This document provides in-depth details about the authentication mechanisms used in the Auth Microservice.

## Overview

The microservice supports two authentication methods:

1. **Email/Password** — Traditional registration and login
2. **Google OAuth 2.0** — Social login via Google

Both methods use JWT (JSON Web Tokens) for session management.

---

## JWT Authentication

### Token Types

| Token          | Purpose                  | Lifetime   | Storage                       |
| -------------- | ------------------------ | ---------- | ----------------------------- |
| `accessToken`  | Authorize API requests   | 15 minutes | Response body (client stores) |
| `refreshToken` | Obtain new access tokens | 7 days     | httpOnly cookie               |

### Access Token

The access token is a JWT that contains user claims and is used to authorize API requests.

#### Payload Structure

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "roleId": "USER",
  "iat": 1705312800,
  "exp": 1705313700
}
```

#### Usage

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The `verifyJWT` middleware validates the token and attaches the user info to `req.user`.

### Refresh Token

The refresh token is used to obtain new access tokens without re-authenticating. It is:

- Stored in an httpOnly cookie (not accessible via JavaScript)
- Rotated on each use (new refresh token issued)
- Valid for 7 days
- Revoked on logout or password change

### Token Generation

Tokens are generated in `src/utils/jwt.js`:

```javascript
import jwt from "jsonwebtoken";

export const generateAccessToken = async (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });
};

export const generateRefreshToken = async (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });
};
```

### Token Refresh Flow

```
┌─────────────┐                              ┌─────────────────┐
│   Client    │                              │   Auth Server   │
└──────┬──────┘                              └────────┬────────┘
       │                                             │
       │  1. Request with expired accessToken        │
       │  ───────────────────────────────────────▶   │
       │                                             │
       │  2. Return 401 Unauthorized                 │
       │  ◀──────────────────────────────────────    │
       │                                             │
       │  3. Request new accessToken                 │
       │     (with refreshToken cookie)              │
       │  ───────────────────────────────────────▶   │
       │                                             │
       │  4. Validate refreshToken                   │
       │     Generate new accessToken                │
       │     Generate new refreshToken (rotation)    │
       │  ◀──────────────────────────────────────    │
       │                                             │
       │  5. Store new tokens, retry original req   │
       │  ───────────────────────────────────────▶   │
       │                                             │
```

### Logout Flow

On logout:

1. The client clears the access token locally
2. The server clears the refresh token from the database
3. The refresh token cookie is cleared

```javascript
// In auth.service.js
export const logoutUser = async (userId) => {
  await userQueries.clearRefreshToken(userId);
};
```

---

## Google OAuth 2.0

Manual OAuth 2.0 implementation (no Passport.js) for Google sign-in.

### Endpoints

| Endpoint                    | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `GET /auth/google`          | Start OAuth flow — redirects to Google               |
| `GET /auth/google/callback` | Handle Google redirect, exchange code for tokens     |
| `GET /auth/google/success`  | Fallback JSON response (when no frontend configured) |
| `GET /auth/google/failed`   | Error fallback                                       |

### Flow

```
Client → /auth/google → Google Consent → Callback → Exchange Code → Fetch Profile → DB → JWT → Redirect
```

| Step | What Happens                                                |
| ---- | ----------------------------------------------------------- |
| 1    | Client navigates to `/api/v1/auth/google`                   |
| 2    | Server redirects to Google consent screen                   |
| 3    | User authenticates & consents                               |
| 4    | Google redirects to `/api/v1/auth/google/callback?code=xxx` |
| 5    | Server exchanges `code` for Google tokens                   |
| 6    | Server fetches user profile from Google                     |
| 7    | Server finds/creates user in DB                             |
| 8    | Server generates JWTs (access + refresh)                    |
| 9    | Server sets tokens as httpOnly cookies                      |
| 10   | Server redirects to frontend                                |

### Find or Create Logic

```javascript
// auth.service.js — findOrCreateGoogleUser
1. Try: find by googleId (fastest)
2. If not found → try: find by email
   ├── If email exists → link googleId to existing account
   └── If no match → create new user with USER role
```

### Token Storage

- Access token → httpOnly cookie (15 min expiry)
- Refresh token → httpOnly cookie (7 days expiry)
- Prevents token leakage in URL

### CSRF Protection

Uses `state` parameter stored in session, validated on callback before processing.

---

## Password Security

### Hashing

Passwords are hashed using bcrypt with a cost factor of 10:

```javascript
// In utils/password.js
import bcrypt from "bcrypt";

export const generateHashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const isPasswordCorrect = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

### Password Requirements

- Minimum 8 characters
- No strict complexity rules (flexible for users)

---

## Timing Attack Protection

### The Problem

When a user attempts to login with an invalid email, a naive implementation would immediately return an error. An attacker could measure response times to determine which emails are registered in the system (timing attack).

### The Solution

The service uses a **DUMMY_HASH** — a pre-computed bcrypt hash that is compared against regardless of whether the user exists:

```javascript
// In auth.service.js
const DUMMY_HASH = bcrypt.hashSync("__timing_mitigation_placeholder__", 10);

export const loginUser = async ({ email, password }) => {
  const user = await userQueries.findOne({ where: { email } });

  if (!user) {
    // Always perform password comparison to prevent timing attacks
    await isPasswordCorrect(password, DUMMY_HASH);
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await isPasswordCorrect(password, user.password);
  // ...
};
```

This ensures consistent response times regardless of whether the email exists.

---

## Session Management

### Cookie Configuration

Refresh tokens are stored in httpOnly cookies with the following attributes:

```javascript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

| Attribute | Development | Production |
| --------- | ----------- | ---------- |
| httpOnly  | Yes         | Yes        |
| secure    | No          | Yes        |
| sameSite  | strict      | strict     |
| maxAge    | 7 days      | 7 days     |

### Session Expiry

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Password Reset Token**: 20 minutes
- **OAuth State**: Should be validated within minutes

---

## Password Reset Flow

### 1. Request Reset

```
POST /api/v1/users/forgot-password
Body: { "email": "user@example.com" }
```

The server:

1. Generates a secure random token
2. Stores hashed token and expiry in the database
3. Sends an email with the reset link

### 2. Reset Password

```
POST /api/v1/users/reset-password/:resetToken
Body: { "newPassword": "newPassword123" }
```

The server:

1. Verifies the token hasn't expired
2. Hashes the new password
3. Updates the user's password
4. **Clears all refresh tokens** (invalidates all sessions)
5. Sends confirmation email

### Security Note

When a password is reset, all existing sessions are invalidated:

```javascript
// In auth.service.js
export const resetForgottenPassword = async (resetToken, newPassword) => {
  // ... verify token ...

  // Clear all refresh tokens (revoke all sessions)
  user.refreshToken = null;
  user.password = newHashedPassword;
  await user.save();
};
```

---

## Role-Based Access Control (RBAC)

### User Roles

| Role    | Value     | Description                  |
| ------- | --------- | ---------------------------- |
| ADMIN   | "ADMIN"   | Full access to all resources |
| MANAGER | "MANAGER" | Limited admin capabilities   |
| USER    | "USER"    | Basic authenticated access   |

### Permission Middleware

The `verifyPermission` middleware checks if the user's role is allowed:

```javascript
// In middlewares/auth.middlewares.js
export const verifyPermission = (allowedRoles) => {
  return async (req, res, next) => {
    const userRole = req.user.roleId;

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(403, "Access denied");
    }

    next();
  };
};
```

### Usage in Routes

```javascript
// Only ADMIN can delete users
router.delete(
  "/:userId",
  verifyJWT,
  verifyPermission([UserRolesEnum.ADMIN]),
  deleteUser,
);

// ADMIN and MANAGER can get all users
router.get(
  "/",
  verifyJWT,
  verifyPermission([UserRolesEnum.ADMIN, UserRolesEnum.MANAGER]),
  getAllUsers,
);
```

---

## Best Practices

### For Clients

1. **Store access tokens securely** (memory, not localStorage)
2. **Handle 401 responses** by attempting token refresh
3. **Clear tokens on logout**
4. **Use HTTPS** in production

### For Developers

1. **Never log tokens** — they could be exposed in logs
2. **Use strong secrets** — minimum 32 characters for JWT secrets
3. **Rotate secrets** — change secrets periodically
4. **Monitor failed logins** — could indicate brute-force attacks
5. **Implement account lockout** — after N failed attempts (future enhancement)

---

## Environment Variables

Key authentication-related environment variables:

| Variable               | Description                          |
| ---------------------- | ------------------------------------ |
| `ACCESS_TOKEN_SECRET`  | Secret for signing access tokens     |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens    |
| `ACCESS_TOKEN_EXPIRY`  | Access token lifetime (default: 15m) |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime (default: 7d) |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID               |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret           |
| `GOOGLE_CALLBACK_URL`  | OAuth callback URL                   |
