import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Permissions = sequelize.define(
  "Permissions",
  {
    permissionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    permissionName: { type: DataTypes.STRING, allowNull: false, unique: true },
    permission: { type: DataTypes.TEXT, allowNull: false },
    createdBy: { type: DataTypes.STRING },
    modifiedBy: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "modifiedAt",
  },
);

export default Permissions;
