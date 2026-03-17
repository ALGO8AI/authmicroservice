import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const RoleFeatures = sequelize.define(
  "RoleFeatures",
  {
    roleFeatureId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    roleId: { type: DataTypes.STRING },
    featureId: { type: DataTypes.STRING },
    permissionId: { type: DataTypes.STRING },
    createdBy: { type: DataTypes.STRING },
    modifiedBy: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "modifiedAt",
  },
);

export default RoleFeatures;
