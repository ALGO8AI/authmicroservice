import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Roles = sequelize.define(
  "Roles",
  {
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    role: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    createdBy: { type: DataTypes.STRING },
    modifiedBy: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "modifiedAt",
  },
);

export default Roles;
