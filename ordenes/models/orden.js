import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Orden = sequelize.define("Orden", {
  productoId: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.STRING, defaultValue: "pendiente" }
});

export default Orden;