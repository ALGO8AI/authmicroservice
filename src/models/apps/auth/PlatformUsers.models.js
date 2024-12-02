const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../db");

const PlatformUsers = sequelize.define(
    "PlatformUsers",
    {
        userId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
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
        email: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        pin: { type: DataTypes.STRING },
        refreshToken: { type: DataTypes.STRING },
        forgotPasswordToken: { type: DataTypes.STRING },
        forgotPasswordExpiry: {type: DataTypes.DATE},
        status: { type: DataTypes.STRING },
        createdBy: { type: DataTypes.STRING },
        createdAt: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
        modifiedBy: { type: DataTypes.STRING },
        modifiedAt: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW,
            onUpdate: Sequelize.NOW,
        },
    },
    { timestamps: false }
);

module.exports = PlatformUsers;
