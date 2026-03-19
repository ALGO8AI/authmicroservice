# Architecture

This document describes the system architecture, design patterns, and data flow of the Auth Microservice.

## Overview

The Auth Microservice follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Routes Layer                          │
│   (Express routers - endpoint definitions, middleware)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     Controllers Layer                       │
│   (Request/response handling - thin wrappers)               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Services Layer                         │
│   (Business logic - all operations here)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Queries Layer                           │
│   (Database operations via Sequelize ORM)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Models Layer                           │
│   (Sequelize models - table definitions)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     Database Layer                           │
│   (MySQL - persistent storage)                              │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component      | Technology               | Purpose                          |
| -------------- | ------------------------ | -------------------------------- |
| Runtime        | Node.js (ES6)            | JavaScript execution environment |
| Framework      | Express.js               | HTTP server and routing          |
| Database       | MySQL 8.0+               | Relational data storage          |
| ORM            | Sequelize                | Database abstraction and queries |
| Authentication | JWT (jsonwebtoken)       | Stateless token-based auth       |
| OAuth          | Google OAuth 2.0         | Social login                     |
| Validation     | express-validator        | Request input validation         |
| Logging        | Winston                  | Structured application logs      |
| HTTP Logging   | Morgan                   | HTTP request/response logs       |
| API Docs       | Swagger UI + OpenAPI 3.0 | Interactive API documentation    |

## Request Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│  Routes Layer   │ ◄── Rate limiting, validation middleware
│ (auth.routes.js)│
└────────┬────────┘
         │ (validates input, checks auth)
         ▼
┌─────────────────────┐
│  Controllers Layer │
│ (auth.controller.js)│ ◄── Extracts request data
└────────┬────────────┘
         │ (calls service)
         ▼
┌─────────────────────┐
│   Services Layer   │
│ (auth.service.js)  │ ◄── Business logic, token generation
└────────┬────────────┘
         │ (database operations)
         ▼
┌─────────────────────┐
│   Queries Layer    │
│ (auth.queries.js)  │ ◄── Sequelize queries
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Database Layer   │
│     (MySQL)        │
└─────────────────────┘
         │
         ▼
Response flows back through layers with error handling at each stage
```

## Project Structure

```
src/
├── index.js                    # Entry point
│
├── app.js                      # Express app setup
│
├── constants.js                # App-wide enums
│
├── config/
│   └── db.js                   # Sequelize instance & initDatabase
│
├── models/
│   ├── index.js               # Model imports & associations
│   └── auth/
│       ├── PlatformUsers.model.js    # User entity
│       ├── Roles.model.js             # Roles (ADMIN, MANAGER, USER)
│       ├── Permissions.model.js      # Permission definitions
│       ├── Features.model.js         # Feature flags
│       └── RoleFeatures.model.js    # Role-Feature mapping
│
├── services/
│   └── auth.service.js         # All business logic (named exports)
│
├── queries/
│   └── auth.queries.js         # Sequelize queries + EXCLUDED_FIELDS
│
├── controllers/
│   ├── auth.controller.js      # Auth request handlers
│   ├── oauth.controller.js     # OAuth request handlers
│   ├── upload.controller.js    # File upload handler
│   └── healthcheck.controller.js
│
├── routes/
│   ├── index.js                # Central router
│   ├── auth.routes.js         # /api/v1/users/*
│   ├── oauth.routes.js        # /api/v1/auth/*
│   ├── upload.routes.js       # /api/v1/documents/*
│   └── healthcheck.routes.js  # /api/v1/healthcheck/*
│
├── middlewares/
│   ├── auth.middlewares.js     # verifyJWT, verifyPermission
│   ├── error.middlewares.js    # Global error handler
│   ├── requestId.middleware.js # Request ID for tracing
│   └── upload.middleware.js    # Multer file upload config
│
├── validators/
│   ├── validate.js             # express-validator middleware
│   └── auth.validators.js      # Validation rules
│
├── utils/
│   ├── ApiError.js             # Error response class
│   ├── ApiResponse.js          # Success response class
│   ├── asyncHandler.js         # Async wrapper for route handlers
│   ├── jwt.js                  # Token generation functions
│   ├── password.js             # Bcrypt password utilities
│   └── mail.js                 # Email sending utilities
│
└── logger/
    ├── winston.logger.js       # Winston logger configuration
    └── morgan.logger.js        # Morgan HTTP logger configuration
```

## Design Patterns

### 1. Service Layer Pattern

All business logic resides in `src/services/auth.service.js`. Controllers are thin wrappers that:

- Extract data from `req` (body, params, headers)
- Call the appropriate service function
- Return `ApiResponse` with the result

```javascript
// Controller - thin wrapper
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: result.user, accessToken: result.accessToken },
        "Login successful",
      ),
    );
});
```

### 2. Error Handling Pattern

Errors are thrown using `ApiError` throughout the service layer. The `asyncHandler` wrapper catches them and passes them to the global error handler:

```javascript
// Service - throws ApiError
export const loginUser = async ({ email, password }) => {
  const user = await userQueries.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }
  // ...
};
```

### 3. Query Abstraction Pattern

All database operations are encapsulated in `src/queries/auth.queries.js`. This provides a single point for:

- Defining which fields to exclude (password, tokens)
- Implementing query logic
- Changing the underlying database implementation

```javascript
const SAFE_ATTRS = { attributes: { exclude: EXCLUDED_FIELDS } };

export const findOne = async (options) => {
  return await PlatformUsers.findOne({
    ...options,
    ...SAFE_ATTRS,
  });
};
```

### 4. Middleware Chain Pattern

Express middleware is chained to provide:

- Authentication (`verifyJWT`)
- Authorization (`verifyPermission`)
- Validation (`validate`)
- Rate limiting

```javascript
router.post(
  "/register",
  rateLimit({ ... }),           // Rate limiting
  userRegisterValidator(),       // Validation rules
  validate,                     // Run validation
  registerUser                  // Handler
);
```

## Data Models

### PlatformUsers

The main user entity with fields for:

- Identity: `userId` (UUID), `email`, `googleId`
- Profile: `firstName`, `lastName`, `phone`, `profilePicUrl`, `designation`, etc.
- Auth: `password` (nullable for OAuth users), `loginType`
- Security: `refreshToken`, `otp`, `generationTime`
- Metadata: `roleId`, `status`, `createdBy`, `modifiedBy`

### Roles

Pre-seeded roles: `ADMIN`, `MANAGER`, `USER`

### RoleFeatures

Maps roles to features (future RBAC enhancement)

## Configuration

### Environment Variables

All configuration is environment-driven via `.env` files:

- Database connection (host, port, credentials)
- JWT secrets (ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET)
- OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Application settings (PORT, CORS_ORIGIN)

### Sequelize Configuration

Database connection is configured in `src/config/db.js`:

- Connection pooling for performance
- Query logging in development mode
- Support for custom port via DB_PORT

## Logging

### Winston

Structured logging with multiple transports:

- Console (human-readable)
- File (persistent, rotated in production)

Log levels: `error`, `warn`, `info`, `http`, `debug`

### Morgan

HTTP request/response logging with custom format including:

- Request method and URL
- Response status code
- Response time
- Request ID for correlation

### Request ID Middleware

Every request gets a unique `requestId` (UUID) that is:

- Added to `req.requestId`
- Logged with every Winston log entry
- Included in response headers (`X-Request-ID`)

## Security Measures

1. **Password Hashing**: bcrypt with automatic salt generation
2. **Token Security**: JWTs signed with strong secrets
3. **Timing Attack Protection**: DUMMY_HASH prevents user enumeration
4. **Rate Limiting**: Prevents brute-force attacks
5. **httpOnly Cookies**: Refresh tokens stored securely
6. **CORS**: Configurable origin whitelisting
7. **Helmet**: Security headers

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

## API Documentation

The service includes an interactive Swagger UI at `/docs`:

- Based on `swagger.yaml` (OpenAPI 3.0)
- No build step required — edit YAML directly
- Restart server to see changes

## Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals:

1. Stops accepting new HTTP connections
2. Waits for in-flight requests to complete
3. Closes database connection pool
4. Forces exit after 10-second timeout

This ensures no data corruption and clean resource release.
