# Deployment Guide

This guide covers deploying the Auth Microservice to production environments.

---

## Prerequisites

| Requirement         | Description                     |
| ------------------- | ------------------------------- |
| Node.js             | >= 18.0.0                       |
| MySQL               | 8.0+ (can be hosted or cloud)   |
| PM2 (recommended)   | Process manager for Node.js     |
| Nginx (recommended) | Reverse proxy and load balancer |

---

## Production Checklist

### Environment Configuration

```env
NODE_ENV=production
PORT=8080

# Database
DB_NAME=authbase
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# JWT Secrets - Use strong, random strings (min 32 characters)
ACCESS_TOKEN_SECRET=your-very-long-random-access-secret
REFRESH_TOKEN_SECRET=your-very-long-random-refresh-secret
SESSION_SECRET=your-very-long-random-session-secret

# Security
CORS_ORIGIN=https://your-frontend-domain.com

# OAuth (if using Google Login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/v1/auth/google/callback
OAUTH_SUCCESS_REDIRECT_URL=https://your-frontend-domain.com/auth/success
OAUTH_FAILURE_REDIRECT_URL=https://your-frontend-domain.com/auth/failed

# Email (optional)
MAIL=your-email@domain.com
RESET_PASSWORD_REDIRECT_URL=https://your-frontend-domain.com/reset-password
PRODUCT_DOCS_URL=https://your-docs-url.com
```

### Key Production Settings

| Variable         | Production Value          |
| ---------------- | ------------------------- |
| `NODE_ENV`       | `production`              |
| `CORS_ORIGIN`    | Specific domain (not `*`) |
| Cookie `secure`  | `true`                    |
| Session `secure` | `true`                    |

---

## Deployment Options

### Option 1: Direct Deployment

1. **Build the application**

   ```bash
   npm install --production
   ```

2. **Initialize database**

   ```bash
   npm run init-db
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Option 2: PM2 Process Manager (Recommended)

1. **Install PM2**

   ```bash
   npm install -g pm2
   ```

2. **Start the application**

   ```bash
   pm2 start src/index.js --name auth-microservice
   ```

3. **Configure startup script**

   ```bash
   pm2 startup
   pm2 save
   ```

4. **Useful PM2 commands**
   ```bash
   pm2 status                 # View status
   pm2 logs auth-microservice # View logs
   pm2 restart auth-microservice # Restart
   pm2 stop auth-microservice    # Stop
   ```

### Option 3: Docker (Future)

> Docker support is a deferred feature. See [IMPROVEMENTS.md](../IMPROVEMENTS.md).

---

## Nginx Configuration

### Reverse Proxy Setup

```nginx
server {
    listen 443 ssl http2;
    server_name your-api-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # WebSocket support (if needed)
        proxy_read_timeout 86400;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-api-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Health Monitoring

### Health Check Endpoint

```bash
curl https://your-api-domain.com/api/v1/healthcheck
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

### Automated Monitoring

Set up monitoring for:

- Endpoint availability
- Response time
- Error rates
- Database connectivity

---

## Logging

### Production Logging

Winston logs are configured to output to:

- Console (all environments)
- File (production)

Log files are stored in the application directory. Set up log rotation:

```bash
# Using logrotate
sudo cat > /etc/logrotate.d/auth-microservice << EOF
/path/to/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
    postrotate
        pm2 restart auth-microservice > /dev/null 2>&1 || true
    endscript
}
EOF
```

### Viewing Logs

```bash
# PM2 logs
pm2 logs auth-microservice

# All logs
pm2 logs auth-microservice --err --lines 100
```

---

## Graceful Shutdown

The application handles shutdown signals (`SIGTERM`, `SIGINT`) gracefully:

1. Stops accepting new connections
2. Waits for in-flight requests to complete
3. Closes database connection
4. Exits

This is configured in `src/index.js`:

```javascript
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  httpServer.close(async (err) => {
    if (err) {
      logger.error("Error while closing HTTP server: " + err.message);
      process.exit(1);
    }

    try {
      await sequelize.close();
      logger.info("Database connection pool closed");
      process.exit(0);
    } catch (dbErr) {
      logger.error("Error closing database connection: " + dbErr.message);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10_000).unref();
};
```

---

## SSL/TLS Configuration

### Generate Self-Signed Certificate (Development)

```bash
openssl req -nodes -new -x509 -keyout server.key -out server.crt
```

### Production Certificates

Use Let's Encrypt or purchase from a trusted CA:

```bash
# Let's Encrypt with Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Database Backup

### Automated Backup Script

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="authbase"
DB_USER="your-db-user"
DB_HOST="your-db-host"

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/authbase_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "authbase_*.sql.gz" -mtime +7 -delete
```

Add to crontab:

```bash
0 2 * * * /path/to/backup-db.sh
```

---

## Performance Tuning

### Node.js Options

```bash
# Production flags
NODE_ENV=production node --max-old-space-size=4096 src/index.js
```

### Database Connection Pool

The default Sequelize pool settings:

```javascript
pool: {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000,
}
```

Adjust based on your MySQL configuration and load.

---

## Security Hardening

1. **Firewall**: Allow only necessary ports (80, 443)
2. **Disable unnecessary services**: Close unused ports
3. **Monitor access logs**: Watch for suspicious activity
4. **Regular updates**: Keep Node.js and dependencies updated
5. **Secrets rotation**: Rotate JWT secrets periodically

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common production issues.

---

## Environment Variables Summary

| Variable               | Required | Description              |
| ---------------------- | -------- | ------------------------ |
| `NODE_ENV`             | Yes      | Set to `production`      |
| `PORT`                 | Yes      | Server port              |
| `DB_NAME`              | Yes      | Database name            |
| `DB_HOST`              | Yes      | Database host            |
| `DB_PORT`              | Yes      | Database port            |
| `DB_USER`              | Yes      | Database username        |
| `DB_PASSWORD`          | Yes      | Database password        |
| `ACCESS_TOKEN_SECRET`  | Yes      | JWT access token secret  |
| `REFRESH_TOKEN_SECRET` | Yes      | JWT refresh token secret |
| `SESSION_SECRET`       | Yes      | Session secret           |
| `CORS_ORIGIN`          | Yes      | Allowed origins          |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth             |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth             |
| `GOOGLE_CALLBACK_URL`  | No       | OAuth callback           |
