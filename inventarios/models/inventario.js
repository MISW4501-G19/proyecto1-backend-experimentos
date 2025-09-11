import { DataTypes } from "sequelize";
import sequelize from "../database.js";
import Producto from "./producto.js";
import Bodega from "./bodega.js";

const Inventario = sequelize.define("Inventario", {
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
});

Producto.hasMany(Inventario, { foreignKey: "productoId" });
Inventario.belongsTo(Producto);

Bodega.hasMany(Inventario, { foreignKey: "bodegaId" });
Inventario.belongsTo(Bodega);

export default Inventario;