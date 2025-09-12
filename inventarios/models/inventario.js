import { DataTypes } from "sequelize";
import sequelize from "../database.js";
import Producto from "./producto.js";
import Bodega from "./bodega.js";

const Inventario = sequelize.define("Inventario", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cantidadDisponible: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  fechaVencimientoLote: {
    type: DataTypes.DATE,
    allowNull: true
  },
  condicionesAlmacenamiento: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

Producto.hasMany(Inventario, { foreignKey: "productoId" });
Inventario.belongsTo(Producto);

Bodega.hasMany(Inventario, { foreignKey: "bodegaId" });
Inventario.belongsTo(Bodega);

export default Inventario;
