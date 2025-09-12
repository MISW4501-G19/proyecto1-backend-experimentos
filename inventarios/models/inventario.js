import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Inventario = sequelize.define("Inventario", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cantidadDisponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fechaVencimientoLote: { type: DataTypes.DATE },
  condicionesAlmacenamiento: { type: DataTypes.STRING }
});

export default Inventario;
