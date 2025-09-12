import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Orden = sequelize.define("Orden", {
  id: { type: DataTypes.STRING, primaryKey: true },
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.STRING, allowNull: false, defaultValue: "pendiente" },
  cantidadTotal: { type: DataTypes.INTEGER, allowNull: false }
});

export default Orden;
