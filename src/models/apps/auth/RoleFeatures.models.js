const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../db");

const RoleFeatures = sequelize.define(
    "RoleFeatures",
    {
        roleFeatureId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        roleId: { type: DataTypes.STRING },
        featureId: { type: DataTypes.STRING },
        permissionId: { type: DataTypes.STRING },
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

module.exports = RoleFeatures;
