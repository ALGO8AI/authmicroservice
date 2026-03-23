# API Reference

This document provides detailed information about all API endpoints. For interactive testing, use the Swagger UI at `/docs`.

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

Most endpoints require authentication via a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

The `refreshToken` is managed automatically via an httpOnly cookie — clients do not need to send it in request bodies.

## Response Formats

### Success Response

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

### Error Response

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": ["detail1", "detail2"]
}
```

---

## Endpoints

### 1. Register User

**POST** `/users/register`

Register a new user with email and password. The user is automatically assigned the `USER` role upon registration.

#### Request Body

| Field      | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `email`    | string | Yes      | Valid email address         |
| `password` | string | Yes      | Password (min 8 characters) |

#### Example Request

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response (201 Created)

```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com",
      "firstName": null,
      "lastName": null,
      "phone": null,
      "roleId": "USER",
      "avatar": null
    }
  },
  "message": "User registered successfully",
  "success": true
}
```

#### Error Responses

- **400** — Validation error (invalid email format, password too short)
- **409** — User with this email already exists

---

### 2. Login

**POST** `/users/login`

Authenticate a user and receive access and refresh tokens.

#### Request Body

| Field      | Type   | Required | Description              |
| ---------- | ------ | -------- | ------------------------ |
| `email`    | string | Yes      | Registered email address |
| `password` | string | Yes      | User's password          |

#### Example Request

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "roleId": "USER",
      "avatar": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

#### Cookies

A `refreshToken` cookie is set automatically:

| Cookie         | Type     | Attributes                    |
| -------------- | -------- | ----------------------------- |
| `refreshToken` | httpOnly | Secure (production), SameSite |

#### Error Responses

- **400** — Email and password are required
- **401** — Invalid email or password

---

### 3. Logout

**POST** `/users/logout`

Logout the current user by clearing the refresh token.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": null,
  "message": "User logged out successfully",
  "success": true
}
```

#### Error Responses

- **401** — Unauthorized (missing or invalid access token)

---

### 4. Refresh Access Token

**POST** `/users/refresh-token`

Issue a new access token using the refresh token from cookies. Also rotates the refresh token.

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed",
  "success": true
}
```

#### Error Responses

- **401** — Refresh token missing, expired, or invalid

---

### 5. Get Current User

**GET** `/users/current-user`

Get the profile of the currently authenticated user.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "roleId": "USER",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "message": "Current user fetched successfully",
  "success": true
}
```

#### Error Responses

- **401** — Unauthorized

---

### 6. Change Password

**POST** `/users/change-password`

Change the current user's password.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### Request Body

| Field         | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| `oldPassword` | string | Yes      | Current password                |
| `newPassword` | string | Yes      | New password (min 8 characters) |

#### Example Request

```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password changed successfully",
  "success": true
}
```

#### Error Responses

- **400** — Validation error
- **401** — Invalid current password

---

### 7. Forgot Password Request

**POST** `/users/forgot-password`

Request a password reset OTP sent to the user's email.

#### Request Body

| Field   | Type   | Required | Description              |
| ------- | ------ | -------- | ------------------------ |
| `email` | string | Yes      | Registered email address |

#### Example Request

```json
{
  "email": "user@example.com"
}
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": null,
  "message": "OTP sent successfully.",
  "success": true
}
```

#### Error Responses

- **400** — Validation error or `User not found.` or `Error sending OTP, try again later.`

---

### 8. Verify OTP and Reset Password

**POST** `/users/verify-otp`

Reset password using the OTP sent to the user's email.

#### Request Body

| Field         | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| `email`       | string | Yes      | Registered email address        |
| `newPassword` | string | Yes      | New password (min 8 characters) |
| `inputedOtp`  | string | Yes      | 6-digit OTP from email          |

#### Example Request

```json
{
  "email": "user@example.com",
  "newPassword": "newSecurePassword123",
  "inputedOtp": "123456"
}
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password changed successfully.",
  "success": true
}
```

#### Error Responses

- **400** — Validation error or `OTP is invalid or expired.` or `User not found.`

---

### 9. Get All Users (Admin)

**GET** `/users`

Get all users. Requires ADMIN or MANAGER role.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### Query Parameters

| Parameter | Type    | Required | Default | Description    |
| --------- | ------- | -------- | ------- | -------------- |
| `page`    | integer | No       | 1       | Page number    |
| `limit`   | integer | No       | 20      | Items per page |

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "users": [
      {
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "admin@example.com",
        "firstName": "Admin",
        "lastName": "User",
        "phone": "+919876543210",
        "roleId": "ADMIN"
      }
    ],
    "total": 42,
    "limit": 20,
    "page": 1
  },
  "message": "Users fetched successfully",
  "success": true
}
```

#### Error Responses

- **401** — Unauthorized
- **403** — Forbidden (insufficient permissions)

---

### 10. Add New User (Admin)

**POST** `/users`

Create a new user. Requires ADMIN or MANAGER role.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### Request Body

| Field       | Type   | Required | Description                 |
| ----------- | ------ | -------- | --------------------------- |
| `email`     | string | Yes      | User's email                |
| `password`  | string | Yes      | Initial password            |
| `firstName` | string | No       | First name                  |
| `lastName`  | string | No       | Last name                   |
| `phone`     | string | No       | Phone number                |
| `roleId`    | string | No       | Role (USER, MANAGER, ADMIN) |

#### Example Request

```json
{
  "email": "newuser@example.com",
  "password": "tempPassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+919876543210",
  "roleId": "USER"
}
```

#### Response (201 Created)

```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f1234567890",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+919876543210",
      "roleId": "USER"
    }
  },
  "message": "User created successfully",
  "success": true
}
```

#### Error Responses

- **400** — Validation error
- **401** — Unauthorized
- **403** — Forbidden
- **409** — User with this email already exists

---

### 11. Edit User Details (Admin)

**PATCH** `/users/:userId`

Update user details. Requires ADMIN role. Admin users cannot be edited — attempting to edit an Admin returns a `403`.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### URL Parameters

| Parameter | Type          | Description      |
| --------- | ------------- | ---------------- |
| `userId`  | string (UUID) | User's unique ID |

#### Request Body

All fields are optional — only provided fields will be updated.

| Field       | Type   | Description                 |
| ----------- | ------ | --------------------------- |
| `firstName` | string | First name                  |
| `lastName`  | string | Last name                   |
| `phone`     | string | Phone number                |
| `roleId`    | string | Role (USER, MANAGER, ADMIN) |
| `status`    | string | User status                 |

#### Example Request

```json
{
  "firstName": "Jane",
  "roleId": "MANAGER"
}
```

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f1234567890",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+919876543210",
      "roleId": "MANAGER"
    }
  },
  "message": "User details updated successfully",
  "success": true
}
```

#### Error Responses

- **400** — Validation error or no valid fields provided
- **401** — Unauthorized
- **403** — Forbidden (insufficient permissions, or target user is an Admin)
- **404** — User not found

**DELETE** `/users/:userId`

Delete a user. Requires ADMIN role. Admin users cannot be deleted — attempting to delete an Admin returns a `403`.

#### Headers

```
Authorization: Bearer <accessToken>
```

#### URL Parameters

| Parameter | Type          | Description      |
| --------- | ------------- | ---------------- |
| `userId`  | string (UUID) | User's unique ID |

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": null,
  "message": "User deleted successfully",
  "success": true
}
```

#### Error Responses

- **401** — Unauthorized
- **403** — Forbidden (insufficient permissions, or target user is an Admin)
- **404** — User not found

---

### 13. Google OAuth Redirect

**GET** `/auth/google`

Redirect the user to Google's OAuth consent screen. The frontend should navigate to this URL to start the OAuth flow.

#### Response

Redirects to Google's consent page:

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=...
```

---

### 14. Google OAuth Callback

**GET** `/auth/google/callback`

Google redirects here with an authorization code. The server:

1. Exchanges the code for tokens
2. Fetches the user's Google profile
3. Creates or updates the user in the database
4. Issues JWTs
5. Redirects to the frontend

#### Query Parameters

| Parameter | Description                                  |
| --------- | -------------------------------------------- |
| `code`    | One-time authorization code from Google      |
| `state`   | Optional state parameter for CSRF protection |

#### Behavior

- **Success**: Redirects to `OAUTH_SUCCESS_REDIRECT_URL` (if configured) with accessToken in cookie
- **Failure**: Redirects to `OAUTH_FAILURE_REDIRECT_URL` (if configured) or returns JSON error

---

### 15. Google OAuth Success (Fallback)

**GET** `/auth/google/success`

Fallback endpoint when `OAUTH_SUCCESS_REDIRECT_URL` is not configured. Returns JSON response.

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "...",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "roleId": "USER"
    }
  },
  "message": "Google login successful",
  "success": true
}
```

---

### 16. Google OAuth Failed (Fallback)

**GET** `/auth/google/failed`

Fallback endpoint when `OAUTH_FAILURE_REDIRECT_URL` is not configured. Returns JSON error.

#### Response (401 Unauthorized)

```json
{
  "statusCode": 401,
  "data": null,
  "message": "Google authentication failed",
  "success": false,
  "errors": []
}
```

---

### 17. Upload Document

**POST** `/documents/upload`

Upload a file (multipart/form-data). No authentication required.

#### Request

Content-Type: `multipart/form-data`

| Field  | Type | Required | Description              |
| ------ | ---- | -------- | ------------------------ |
| `file` | file | Yes      | File to upload (max 5MB) |

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "originalName": "document.pdf",
    "fileName": "1705312345678-document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "path": "uploads/1705312345678-document.pdf"
  },
  "message": "File uploaded successfully",
  "success": true
}
```

#### Error Responses

- **400** — No file uploaded or file too large

---

### 18. Health Check

**GET** `/healthcheck`

Check server and database health.

#### Response (200 OK)

```json
{
  "statusCode": 200,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 123.45,
    "database": {
      "status": "connected",
      "host": "localhost",
      "name": "authbase"
    }
  },
  "message": "Server is running",
  "success": true
}
```

---

## Rate Limiting

| Endpoint Category                                   | Limit                         |
| --------------------------------------------------- | ----------------------------- |
| Auth (register, login, forgot-password, verify-otp) | 10 requests / 15 minutes / IP |
| Refresh token                                       | 20 requests / 15 minutes / IP |
| All other endpoints                                 | No rate limit                 |

---

## Roles and Permissions

| Role      | Permissions                                        |
| --------- | -------------------------------------------------- |
| `USER`    | Login, logout, change password, view own profile   |
| `MANAGER` | All USER permissions + get all users, create users |
| `ADMIN`   | All permissions including edit and delete any user |

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication mechanisms.
