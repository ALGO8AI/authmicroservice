-- Use or create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS authdb;
USE authdb;

-- Create PlatformUsers table
CREATE TABLE IF NOT EXISTS `PlatformUsers` (
  `userId` VARCHAR(255) PRIMARY KEY,
  `roleId` VARCHAR(255),
  `firstName` VARCHAR(255),
  `lastName` VARCHAR(255),
  `userName` VARCHAR(255),
  `profilePicUrl` VARCHAR(255),
  `designation` VARCHAR(255),
  `address` VARCHAR(255),
  `region` VARCHAR(255),
  `country` VARCHAR(255),
  `geoLocation` VARCHAR(255),
  `timezone` VARCHAR(255),
  `language` VARCHAR(255),
  `email` VARCHAR(255) UNIQUE,
  `phone` VARCHAR(255) UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `pin` VARCHAR(255),
  `refreshToken` VARCHAR(255),
  `forgotPasswordToken` VARCHAR(255),
  `forgotPasswordExpiry` DATETIME,
  `status` ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
  `createdBy` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT NOW(),
  `modifiedBy` VARCHAR(255),
  `modifiedAt` TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (`roleId`) REFERENCES `Roles`(`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Roles table
CREATE TABLE IF NOT EXISTS `Roles` (
  `roleId` VARCHAR(255) PRIMARY KEY,
  `role` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT,
  `createdBy` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT NOW(),
  `modifiedBy` VARCHAR(255),
  `modifiedAt` TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Create RoleFeatures table
CREATE TABLE IF NOT EXISTS `RoleFeatures` (
  `roleFeatureId` VARCHAR(255) PRIMARY KEY,
  `roleId` VARCHAR(255),
  `featureId` VARCHAR(255),
  `permissionId` VARCHAR(255),
  `createdBy` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT NOW(),
  `modifiedBy` VARCHAR(255),
  `modifiedAt` TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (`roleId`) REFERENCES `Roles`(`roleId`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`featureId`) REFERENCES `Features`(`featureId`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`permissionId`) REFERENCES `Permissions`(`permissionId`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Features table
CREATE TABLE IF NOT EXISTS `Features` (
  `featureId` VARCHAR(255) PRIMARY KEY,
  `featureName` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT,
  `createdBy` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT NOW(),
  `modifiedBy` VARCHAR(255),
  `modifiedAt` TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Create Permissions table
CREATE TABLE IF NOT EXISTS `Permissions` (
  `permissionId` VARCHAR(255) PRIMARY KEY,
  `permissionName` VARCHAR(255) UNIQUE NOT NULL,
  `permission` TEXT,
  `createdBy` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT NOW(),
  `modifiedBy` VARCHAR(255),
  `modifiedAt` TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Add sample data (optional)
-- Uncomment these if you want to prepopulate some default data for testing
-- INSERT INTO `Roles` (`roleId`, `role`, `description`, `createdBy`) VALUES 
-- ('admin', 'Admin', 'Administrator role with full access', 'system');

-- INSERT INTO `Permissions` (`permissionId`, `permissionName`, `permission`, `createdBy`) VALUES
-- ('read', 'Read Access', 'Allows read-only access', 'system'),
-- ('write', 'Write Access', 'Allows read and write access', 'system');

-- INSERT INTO `Features` (`featureId`, `featureName`, `description`, `createdBy`) VALUES
-- ('dashboard', 'Dashboard', 'Access to dashboard feature', 'system');

-- INSERT INTO `RoleFeatures` (`roleFeatureId`, `roleId`, `featureId`, `permissionId`, `createdBy`) VALUES
-- ('1', 'admin', 'dashboard', 'read', 'system');
