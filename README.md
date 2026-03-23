# Auth Microservice

A production-ready authentication and authorization microservice built with Node.js, Express, and MySQL. Provides user registration, login, JWT-based authentication, role-based access control (RBAC), and Google OAuth 2.0 integration.

## Features

- **User Authentication**: Register, login, logout with secure password hashing (bcrypt)
- **JWT Tokens**: Access tokens (15 min) + refresh tokens with httpOnly cookies
- **Role-Based Access Control**: ADMIN, MANAGER, USER roles with permission middleware
- **Google OAuth 2.0**: Secure social login without Passport.js
- **Password Management**: Forgot password, reset password, change password flows
- **User Management**: Admin-only endpoints for CRUD operations on users
- **API Documentation**: Interactive Swagger UI at `/docs`
- **Graceful Shutdown**: Clean HTTP server and database connection handling
- **Structured Logging**: Winston for logs, Morgan for HTTP request logging
- **Rate Limiting**: Protection against brute-force attacks
- **Input Validation**: express-validator for request validation

## Quick Start

```bash
# 1. Clone and install dependencies
npm install

# 2. Configure environment variables
cp .env.sample .env
# Edit .env with your database and API credentials

# 3. Initialize database (creates tables and seeds roles)
npm run init-db

# 4. Start development server
npm run dev
```

The server will start at `http://localhost:8080`. Access the interactive API documentation at `http://localhost:8080/docs`.

## Technology Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Runtime        | Node.js (ES6 modules)    |
| Framework      | Express.js               |
| Database       | MySQL with Sequelize ORM |
| Authentication | JWT, Google OAuth 2.0    |
| Validation     | express-validator        |
| Logging        | Winston, Morgan          |
| API Docs       | Swagger UI + OpenAPI 3.0 |

## Project Structure

```
authmicroservice/
├── src/
│   ├── index.js              # Entry point with graceful shutdown
│   ├── app.js                # Express app configuration
│   ├── constants.js          # App-wide enums
│   ├── config/
│   │   └── db.js             # Sequelize connection
│   ├── models/               # Sequelize models
│   ├── services/
│   │   └── auth.service.js   # Business logic
│   ├── queries/
│   │   └── auth.queries.js   # Database queries
│   ├── controllers/         # Request handlers
│   ├── routes/               # Express routers
│   ├── middlewares/          # Auth, error, upload middleware
│   ├── validators/           # Input validation
│   ├── utils/                # Helpers (JWT, password, mail)
│   └── logger/               # Winston & Morgan config
├── scripts/
│   └── init-db.js            # Database initialization
├── docs/                     # Documentation
├── swagger.yaml              # OpenAPI 3.0 specification
└── package.json
```

## API Base URL

```
http://localhost:8080/api/v1
```

## API Endpoints Overview

| Category | Endpoints                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Auth     | `/users/register`, `/users/login`, `/users/logout`, `/users/refresh-token`, `/users/current-user`, `/users/change-password` |
| Password | `/users/forgot-password`, `/users/verify-otp`                                                                               |
| OAuth    | `/auth/google`, `/auth/google/callback`                                                                                     |
| Users    | `GET /users`, `POST /users`, `PATCH /users/:userId`, `DELETE /users/:userId`                                                |
| Health   | `/healthcheck`                                                                                                              |

## Documentation

- [SETUP.md](./SETUP.md) — Detailed installation and configuration guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and architecture
- [API.md](./API.md) — Detailed API reference
- [AUTHENTICATION.md](./AUTHENTICATION.md) — Authentication mechanisms deep dive
- [DATABASE.md](./DATABASE.md) — Database schema and models
- [SECURITY.md](./SECURITY.md) — Security practices and measures
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Common issues and solutions

## Available Scripts

| Command                            | Description                              |
| ---------------------------------- | ---------------------------------------- |
| `npm run dev`                      | Start development server with nodemon    |
| `npm start`                        | Start production server                  |
| `npm run init-db`                  | Initialize database (create, sync, seed) |
| `npm run lint`                     | Run ESLint                               |
| `npx prettier --write src/**/*.js` | Format code                              |

## License

Internal — Proprietary
