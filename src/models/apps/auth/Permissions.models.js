const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../db");

const Permissions = sequelize.define(
    "Permissions",
    {
        permissionId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        permissionName: { type: DataTypes.STRING },
        permission: { type: DataTypes.TEXT },
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

module.exports = Permissions;
