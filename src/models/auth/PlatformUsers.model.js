import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const PlatformUsers = sequelize.define(
  "PlatformUsers",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    roleId: { type: DataTypes.STRING },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    userName: { type: DataTypes.STRING },
    profilePicUrl: { type: DataTypes.STRING },
    designation: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    region: { type: DataTypes.STRING },
    country: { type: DataTypes.STRING },
    geoLocation: { type: DataTypes.STRING },
    timezone: { type: DataTypes.STRING },
    language: { type: DataTypes.STRING },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING },
    // Nullable — Google OAuth users have no password.
    password: { type: DataTypes.STRING, allowNull: true },
    // Google OAuth subject ID — stored when the user signs in via Google.
    googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
    // Login type — EMAIL_PASSWORD | GOOGLE
    loginType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "EMAIL_PASSWORD",
    },
    pin: { type: DataTypes.STRING },
    refreshToken: { type: DataTypes.TEXT },
    forgotPasswordToken: { type: DataTypes.TEXT },
    forgotPasswordExpiry: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING },
    createdBy: { type: DataTypes.STRING },
    modifiedBy: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "modifiedAt",
  },
);

export default PlatformUsers;
