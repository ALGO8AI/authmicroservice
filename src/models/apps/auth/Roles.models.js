const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../../db");

const Roles = sequelize.define(
    "Roles",
    {
        roleId: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        role: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT },
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

module.exports = Roles;
