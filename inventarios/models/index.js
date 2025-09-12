import Producto from "./producto.js";
import Bodega from "./bodega.js";
import Inventario from "./inventario.js";

// Asociaciones
Producto.hasMany(Inventario, { foreignKey: "productoId" });
Inventario.belongsTo(Producto, { foreignKey: "productoId" });

Bodega.hasMany(Inventario, { foreignKey: "bodegaId" });
Inventario.belongsTo(Bodega, { foreignKey: "bodegaId" });

export { Producto, Bodega, Inventario };
