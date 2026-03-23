# Troubleshooting Guide

This guide covers common issues and their solutions for the Auth Microservice.

---

## Installation Issues

### Error: `EADDRINUSE` — Port Already in Use

**Problem**: The server fails to start because port 8080 is already in use.

**Solution**:

1. Find what's using the port:

   ```bash
   # Linux/Mac
   lsof -i :8080

   # or
   netstat -tulpn | grep 8080
   ```

2. Stop the process or use a different port:
   ```bash
   PORT=8081 npm run dev
   ```

---

### Error: `Cannot find module 'dotenv'`

**Problem**: Missing dependencies.

**Solution**:

```bash
npm install
```

---

### Error: `Module not found` — ES6 Module Issues

**Problem**: Cannot resolve file extensions.

**Solution**:

1. Ensure `package.json` has `"type": "module"`
2. Use `.js` extensions in imports:

   ```javascript
   // Good
   import userRoutes from "./routes/user.routes.js";

   // Bad
   import userRoutes from "./routes/user.routes";
   ```

---

## Database Issues

### Error: `Connection refused` — Database Not Running

**Problem**: MySQL server is not running.

**Solution**:

1. Start MySQL:

   ```bash
   # Linux (systemd)
   sudo systemctl start mysql

   # macOS
   brew services start mysql

   # Windows (via Services)
   ```

2. Verify connection:
   ```bash
   mysql -u root -p -h localhost
   ```

---

### Error: `Access denied` — Wrong Credentials

**Problem**: Database username or password is incorrect.

**Solution**:

1. Check `.env` file credentials
2. Test manually:

   ```bash
   mysql -u your_db_user -p -h your_db_host
   ```

3. Create a new user with permissions:
   ```sql
   CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON authbase.* TO 'username'@'localhost';
   FLUSH PRIVILEGES;
   ```

---

### Error: `Unknown database 'authbase'`

**Problem**: Database doesn't exist.

**Solution**:

```bash
npm run init-db
```

This creates the database automatically.

---

### Error: `Table 'authbase.PlatformUsers' doesn't exist`

**Problem**: Tables haven't been created.

**Solution**:

```bash
npm run init-db
```

This syncs all models to the database.

---

### Error: Column Too Small for JWT (Data Truncation)

**Problem**: `refreshToken` or `otp` data is truncated.

**Solution**:

The columns were changed from `VARCHAR(255)` to `TEXT`. Run the init script:

```bash
npm run init-db
```

This applies the schema changes.

---

## Authentication Issues

### Error: `Invalid email or password` — Even with Correct Credentials

**Possible Causes**:

1. **Whitespace in password**: Password has leading/trailing spaces
2. **Case-sensitive email**: Email is stored differently
3. **Old password hash**: Password was hashed with different settings

**Solution**:

1. Check for whitespace:

   ```javascript
   const password = req.body.password.trim();
   ```

2. Reset password via forgot password flow

---

### Error: `TokenExpiredError: jwt expired`

**Problem**: Access token has expired.

**Solution**:

Clients should use the refresh token to get a new access token:

```javascript
// Client-side
const refreshResponse = await fetch("/api/v1/users/refresh-token", {
  method: "POST",
  credentials: "include", // Important: send cookies
});
```

---

### Error: `JsonWebTokenError: invalid token`

**Problem**: Malformed or tampered JWT.

**Solution**:

1. Check the Authorization header format:

   ```
   Authorization: Bearer <accessToken>
   ```

2. Verify the token secret matches (`ACCESS_TOKEN_SECRET`)

---

### Error: `401 Unauthorized` on Protected Routes

**Problem**: Missing or invalid access token.

**Solution**:

1. Include the token in requests:

   ```javascript
   fetch("/api/v1/users/current-user", {
     headers: {
       Authorization: `Bearer ${accessToken}`,
     },
   });
   ```

2. Verify the token hasn't expired

---

## OAuth Issues

### Error: `redirect_uri_mismatch` — Google OAuth

**Problem**: Google callback URL doesn't match configured URI.

**Solution**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth client
4. Add the callback URL to **Authorized redirect URIs**:
   ```
   http://localhost:8080/api/v1/auth/google/callback
   ```

---

### Error: `Google authentication failed`

**Problem**: OAuth callback failed.

**Solutions**:

1. Check environment variables:

   ```
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   GOOGLE_CALLBACK_URL
   ```

2. Ensure callback URL is exact match
3. Check `OAUTH_FAILURE_REDIRECT_URL` or test `/auth/google/failed` endpoint

---

### Access Token in URL (Security Concern)

**Problem**: Access token appears in OAuth redirect URL.

**Solution**:

The access token is now set as an httpOnly cookie. Ensure your application reads from the cookie instead of the URL query parameter.

---

## Validation Errors

### Error: `Email is required`

**Problem**: Missing email field in request body.

**Solution**:

Send email in request body:

```json
{
  "email": "user@example.com"
}
```

---

### Error: `Validation error` — Invalid Email Format

**Problem**: Email doesn't match email format.

**Solution**:

Ensure email is valid:

```json
{
  "email": "user@example.com"
}
```

---

## Rate Limiting Issues

### Error: `429 Too Many Requests`

**Problem**: Exceeded rate limit on auth endpoints.

**Solution**:

1. Wait 15 minutes (limits reset)
2. Implement exponential backoff in client
3. Use the refresh token endpoint (higher limit)

---

## Runtime Errors

### Server Crashes on Startup

**Problem**: Application exits immediately.

**Solution**:

1. Check all required environment variables are set
2. Run with debug logging:
   ```bash
   NODE_ENV=development npm run dev
   ```
3. Check for missing `.env` file

---

### Error: `SequelizeConnectionError: Too many connections`

**Problem**: Database connection pool exhausted.

**Solution**:

1. Reduce concurrent connections
2. Adjust pool settings in `src/config/db.js`:
   ```javascript
   pool: {
     max: 5,  // Reduce from 10
     min: 0,
   }
   ```

---

## Logging and Debugging

### Enable Debug Logging

```bash
NODE_ENV=development npm run dev
```

### View PM2 Logs

```bash
pm2 logs auth-microservice
pm2 logs auth-microservice --err --lines 50
```

### Add Request Tracing

Every request has a `requestId`. Search logs for this ID to trace issues.

---

## Reset Everything

If all else fails:

1. **Drop and recreate database**:

   ```bash
   mysql -u root -p -e "DROP DATABASE authbase;"
   npm run init-db
   ```

2. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Getting Help

If you're still stuck:

1. Check the logs for detailed error messages
2. Verify environment variables are correct
3. Check [GitHub Issues](https://github.com/ALGO8AI/authmicroservice/issues)
4. Review API docs at `/docs` endpoint

---

## Common Error Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 400  | Bad Request — Invalid input          |
| 401  | Unauthorized — Invalid/missing token |
| 403  | Forbidden — Insufficient permissions |
| 404  | Not Found — Resource doesn't exist   |
| 409  | Conflict — Resource already exists   |
| 429  | Too Many Requests — Rate limited     |
| 500  | Internal Server Error                |
