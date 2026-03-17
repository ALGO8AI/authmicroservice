# Setup Guide

This guide covers the complete installation and configuration process for the Auth Microservice.

## Prerequisites

| Requirement | Version   | Notes                |
| ----------- | --------- | -------------------- |
| Node.js     | >= 18.0.0 | ES6 modules required |
| MySQL       | 8.0+      | Database server      |
| npm         | 9.0+      | Comes with Node.js   |

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/ALGO8AI/authmicroservice.git
cd authmicroservice
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages defined in `package.json`.

### 3. Configure Environment Variables

Copy the sample environment file and update it with your credentials:

```bash
cp .env.sample .env
```

#### Environment Variables Reference

| Variable                      | Required | Description                                                                                                                                  |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                    | Yes      | Environment: `development` or `production`                                                                                                   |
| `PORT`                        | Yes      | Server port (default: `8080`)                                                                                                                |
| `CORS_ORIGIN`                 | Yes      | Allowed origins for CORS (e.g., `http://localhost:3000`). **Never use `*` in production** — it allows any origin and enables CSRF/XSS risks. |
| `DB_NAME`                     | Yes      | MySQL database name                                                                                                                          |
| `DB_HOST`                     | Yes      | Database host (e.g., `localhost`, `127.0.0.1`)                                                                                               |
| `DB_PORT`                     | Yes      | Database port (default: `3306`)                                                                                                              |
| `DB_USER`                     | Yes      | Database username                                                                                                                            |
| `DB_PASSWORD`                 | Yes      | Database password                                                                                                                            |
| `ACCESS_TOKEN_SECRET`         | Yes      | Secret key for access tokens (min 32 chars)                                                                                                  |
| `REFRESH_TOKEN_SECRET`        | Yes      | Secret key for refresh tokens (min 32 chars)                                                                                                 |
| `SESSION_SECRET`              | Yes      | Secret for Express session (min 32 chars)                                                                                                    |
| `CLIENT_ID`                   | No       | Microsoft OAuth client ID (for mail)                                                                                                         |
| `CLIENT_SECRET`               | No       | Microsoft OAuth client secret                                                                                                                |
| `MAIL`                        | No       | Email address for sending transactional emails                                                                                               |
| `PASSKEY`                     | No       | Password/app key for the email account                                                                                                       |
| `MAIL_TENANT_ID`              | No       | Microsoft tenant ID for Graph API                                                                                                            |
| `RESET_PASSWORD_REDIRECT_URL` | No       | Frontend URL for password reset                                                                                                              |
| `PRODUCT_DOCS_URL`            | No       | URL for product documentation in emails                                                                                                      |
| `GOOGLE_CLIENT_ID`            | No       | Google OAuth client ID (required for OAuth)                                                                                                  |
| `GOOGLE_CLIENT_SECRET`        | No       | Google OAuth client secret                                                                                                                   |
| `GOOGLE_CALLBACK_URL`         | No       | OAuth callback URL                                                                                                                           |
| `OAUTH_SUCCESS_REDIRECT_URL`  | No       | Frontend redirect after successful OAuth                                                                                                     |
| `OAUTH_FAILURE_REDIRECT_URL`  | No       | Frontend redirect after failed OAuth                                                                                                         |

#### Example `.env` File

```env
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:3000

DB_NAME=authbase
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password

ACCESS_TOKEN_SECRET=your_access_token_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars
SESSION_SECRET=your_session_secret_min_32_chars

RESET_PASSWORD_REDIRECT_URL=http://localhost:3000/reset-password
PRODUCT_DOCS_URL=http://localhost:8080/docs

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/v1/auth/google/callback
OAUTH_SUCCESS_REDIRECT_URL=http://localhost:3000/auth/success
OAUTH_FAILURE_REDIRECT_URL=http://localhost:3000/auth/failed
```

### 4. Initialize Database

Create the database, sync all tables, and seed default roles:

```bash
npm run init-db
```

This script:

1. Creates the database if it doesn't exist
2. Syncs all Sequelize models to the database (with `alter: true`)
3. Seeds default roles: `ADMIN`, `MANAGER`, `USER`

> **Important**: Run this script whenever you modify database models.
>
> **Warning**: `Sequelize.sync({ alter: true })` can drop columns and cause data loss. **Never run against a production database.** Use proper schema migrations (e.g., Sequelize migrations) for production changes. Only run `npm run init-db` in development or controlled environments. Always back up your data before running.

### 5. Create Initial Admin

After setting up the database, create your first admin user:

```bash
npm run create-admin
```

This interactive script prompts for email and password (hidden input), then creates an admin user with `roleId: ADMIN`.

### 6. Start the Server

#### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:8080` with nodemon for automatic reloads on file changes.

#### Production Mode

```bash
npm start
```

### 6. Verify Installation

#### Health Check Endpoint

```bash
curl http://localhost:8080/api/v1/healthcheck
```

Expected response:

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

#### Access API Documentation

Open your browser and navigate to:

```
http://localhost:8080/docs
```

This provides an interactive Swagger UI to explore and test all API endpoints.

## Google OAuth Setup (Optional)

If you want to enable Google OAuth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Configure consent screen and create OAuth credentials
5. Add authorized redirect URI: `http://localhost:8080/api/v1/auth/google/callback`
6. Copy `CLIENT_ID` and `CLIENT_SECRET` to your `.env` file

## First-Time Setup Checklist

- [ ] Node.js >= 18.0.0 installed
- [ ] MySQL server running
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database initialized (`npm run init-db`)
- [ ] Server started (`npm run dev`)
- [ ] Health check verified
- [ ] Swagger docs accessible at `/docs`

## Troubleshooting

If you encounter issues during setup, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
- Explore [API.md](./API.md) for detailed endpoint documentation
- Review [SECURITY.md](./SECURITY.md) for security best practices
