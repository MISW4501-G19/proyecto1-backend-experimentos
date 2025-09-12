import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Inventario = sequelize.define("Inventario", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  lote: { type: DataTypes.STRING, allowNull: false },
  cantidadDisponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fechaVencimiento: { type: DataTypes.DATE, allowNull: false }
});

export default Inventario;
