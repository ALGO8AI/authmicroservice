import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const Features = sequelize.define(
  "Features",
  {
    featureId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    featureName: { type: DataTypes.STRING },
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

export default Features;
