# Database Guide

This document describes the database schema, models, and management for the Auth Microservice.

## Database Overview

| Property      | Value                                   |
| ------------- | --------------------------------------- |
| Database      | MySQL 8.0+                              |
| ORM           | Sequelize                               |
| Database Name | `authbase` (configurable via `DB_NAME`) |

---

## Schema

### PlatformUsers

The main user table storing all authentication and profile data.

| Column                 | Type         | Constraints                        | Description                                 |
| ---------------------- | ------------ | ---------------------------------- | ------------------------------------------- |
| `userId`               | UUID         | PRIMARY KEY, DEFAULT UUIDV4        | Unique user identifier                      |
| `email`                | VARCHAR(255) | UNIQUE, NOT NULL                   | User's email address                        |
| `password`             | VARCHAR(255) | NULLABLE                           | Bcrypt hashed password (nullable for OAuth) |
| `googleId`             | VARCHAR(255) | UNIQUE, NULLABLE                   | Google OAuth subject ID                     |
| `loginType`            | VARCHAR(50)  | NOT NULL, DEFAULT 'EMAIL_PASSWORD' | Authentication method                       |
| `firstName`            | VARCHAR(255) | NULLABLE                           | First name                                  |
| `lastName`             | VARCHAR(255) | NULLABLE                           | Last name                                   |
| `userName`             | VARCHAR(255) | NULLABLE                           | Username                                    |
| `phone`                | VARCHAR(50)  | NULLABLE                           | Phone number                                |
| `profilePicUrl`        | VARCHAR(500) | NULLABLE                           | URL to profile picture                      |
| `designation`          | VARCHAR(255) | NULLABLE                           | Job title                                   |
| `address`              | TEXT         | NULLABLE                           | Physical address                            |
| `region`               | VARCHAR(100) | NULLABLE                           | Geographic region                           |
| `country`              | VARCHAR(100) | NULLABLE                           | Country                                     |
| `geoLocation`          | VARCHAR(255) | NULLABLE                           | Geographic coordinates                      |
| `timezone`             | VARCHAR(50)  | NULLABLE                           | Timezone (e.g., "UTC+5:30")                 |
| `language`             | VARCHAR(50)  | NULLABLE                           | Preferred language                          |
| `roleId`               | VARCHAR(50)  | NULLABLE                           | User role (ADMIN, MANAGER, USER)            |
| `pin`                  | VARCHAR(255) | NULLABLE                           | Optional PIN code                           |
| `refreshToken`         | TEXT         | NULLABLE                           | Current refresh token                       |
| `forgotPasswordToken`  | TEXT         | NULLABLE                           | Password reset token (hashed)               |
| `forgotPasswordExpiry` | DATETIME     | NULLABLE                           | Password reset token expiry                 |
| `status`               | VARCHAR(50)  | NULLABLE                           | Account status                              |
| `createdBy`            | VARCHAR(255) | NULLABLE                           | Creator user ID                             |
| `modifiedBy`           | VARCHAR(255) | NULLABLE                           | Last modifier user ID                       |
| `createdAt`            | DATETIME     | NOT NULL                           | Record creation timestamp                   |
| `modifiedAt`           | DATETIME     | NOT NULL                           | Record last update timestamp                |

#### Key Design Decisions

1. **`password` is nullable** — OAuth users (Google) don't have passwords
2. **`refreshToken` and `forgotPasswordToken` are TEXT** — JWTs can exceed 255 characters
3. **`loginType` distinguishes auth methods** — EMAIL_PASSWORD, GOOGLE, GITHUB

---

### Roles

Stores available roles for RBAC.

| Column       | Type         | Constraints | Description              |
| ------------ | ------------ | ----------- | ------------------------ |
| `roleId`     | VARCHAR(50)  | PRIMARY KEY | Role identifier          |
| `roleName`   | VARCHAR(100) | NOT NULL    | Human-readable role name |
| `createdAt`  | DATETIME     | NOT NULL    | Creation timestamp       |
| `modifiedAt` | DATETIME     | NOT NULL    | Last update timestamp    |

#### Default Roles

| roleId  | roleName      |
| ------- | ------------- |
| ADMIN   | Administrator |
| MANAGER | Manager       |
| USER    | Standard User |

---

### Permissions

Stores individual permissions.

| Column           | Type         | Constraints | Description            |
| ---------------- | ------------ | ----------- | ---------------------- |
| `permissionId`   | VARCHAR(50)  | PRIMARY KEY | Permission identifier  |
| `permissionName` | VARCHAR(100) | NOT NULL    | Human-readable name    |
| `description`    | TEXT         | NULLABLE    | Permission description |

---

### Features

Stores feature flags for feature-toggle functionality.

| Column        | Type         | Constraints  | Description               |
| ------------- | ------------ | ------------ | ------------------------- |
| `featureId`   | VARCHAR(50)  | PRIMARY KEY  | Feature identifier        |
| `featureName` | VARCHAR(100) | NOT NULL     | Human-readable name       |
| `description` | TEXT         | NULLABLE     | Feature description       |
| `isEnabled`   | BOOLEAN      | DEFAULT true | Whether feature is active |

---

### RoleFeatures

Maps roles to their allowed features.

| Column      | Type        | Constraints             | Description             |
| ----------- | ----------- | ----------------------- | ----------------------- |
| `roleId`    | VARCHAR(50) | PRIMARY KEY (composite) | Foreign key to Roles    |
| `featureId` | VARCHAR(50) | PRIMARY KEY (composite) | Foreign key to Features |

---

## Models

All models are defined in `src/models/auth/`.

### PlatformUsers.model.js

```javascript
const PlatformUsers = sequelize.define(
  "PlatformUsers",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
    loginType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "EMAIL_PASSWORD",
    },
    // ... more fields
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "modifiedAt",
  },
);
```

### Query Layer

All database queries are abstracted in `src/queries/auth.queries.js`:

```javascript
import { EXCLUDED_FIELDS } from "./auth.queries.js";

const SAFE_ATTRS = { attributes: { exclude: EXCLUDED_FIELDS } };

const userQueries = {
  findOne: async (options) => {
    return await PlatformUsers.findOne({
      ...options,
      ...SAFE_ATTRS,
    });
  },

  findById: async (userId, options = {}) => {
    return await PlatformUsers.findByPk(userId, {
      ...options,
      ...SAFE_ATTRS,
    });
  },

  create: async (data) => {
    return await PlatformUsers.create(data);
  },

  update: async (userId, data) => {
    const [count] = await PlatformUsers.update(data, {
      where: { userId },
    });
    return count;
  },

  delete: async (userId) => {
    return await PlatformUsers.destroy({ where: { userId } });
  },
};
```

### EXCLUDED_FIELDS

Sensitive fields that are excluded from all query results:

```javascript
export const EXCLUDED_FIELDS = [
  "password",
  "refreshToken",
  "forgotPasswordToken",
  "forgotPasswordExpiry",
];
```

This ensures sensitive data never leaks to the API response.

---

## Database Initialization

### init-db Script

The `npm run init-db` command performs:

1. **Creates database** if it doesn't exist
2. **Syncs all models** using `sequelize.sync({ alter: true })`
3. **Seeds default roles** — ADMIN, MANAGER, USER

```javascript
// In scripts/init-db.js
const initDatabase = async () => {
  // Create database
  await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);

  // Sync models
  await sequelize.sync({ alter: true });

  // Seed roles
  await Roles.bulkCreate(
    [
      { roleId: "ADMIN", roleName: "Administrator" },
      { roleId: "MANAGER", roleName: "Manager" },
      { roleId: "USER", roleName: "Standard User" },
    ],
    { ignoreDuplicates: true },
  );
};
```

### Running After Model Changes

> **Important**: Run `npm run init-db` whenever you:
>
> - Add new columns to models
> - Modify column types
> - Add new models

This syncs the database schema with your model definitions.

---

## Connection Configuration

### Database Connection (src/config/db.js)

```javascript
import { Sequelize } from "sequelize";
import "dotenv/config";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging:
      process.env.NODE_ENV === "development"
        ? (msg) => logger.debug(msg)
        : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

export const initDatabase = async () => {
  await sequelize.authenticate();
  logger.info("Database connection established");
};

export default sequelize;
```

### Connection Pool Settings

| Property | Default | Description                  |
| -------- | ------- | ---------------------------- |
| max      | 10      | Maximum connections          |
| min      | 0       | Minimum connections          |
| acquire  | 30000   | Connection timeout (ms)      |
| idle     | 10000   | Idle connection timeout (ms) |

---

## Best Practices

### Migrations

The project uses Sequelize's `sync({ alter: true })` for automatic migrations. For production:

1. Review the SQL logs during sync
2. Back up data before running on existing databases
3. Consider using proper migration tools for complex changes

### Security

1. **Never expose credentials** — use environment variables
2. **Use least privilege** — create a dedicated MySQL user with limited permissions
3. **Enable SSL** — configure `ssl: true` in production

### Performance

1. **Index frequently queried columns** — email, googleId, roleId
2. **Limit result sets** — use pagination for list endpoints
3. **Monitor slow queries** — enable query logging in development

### Backup

Regularly backup the database:

```bash
mysqldump -h localhost -u root -p authbase > backup_$(date +%Y%m%d).sql
```

---

## Environment Variables

| Variable      | Description                       |
| ------------- | --------------------------------- |
| `DB_NAME`     | Database name (default: authbase) |
| `DB_HOST`     | Database host                     |
| `DB_PORT`     | Database port (default: 3306)     |
| `DB_USER`     | Database username                 |
| `DB_PASSWORD` | Database password                 |
