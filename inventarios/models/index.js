import Producto from "./producto.js";
import Bodega from "./bodega.js";
import Inventario from "./inventario.js";

// Asociaciones
Producto.belongsToMany(Bodega, { through: { model: Inventario, unique: false } });
Bodega.belongsToMany(Producto, { through: { model: Inventario, unique: false } });

Producto.hasMany(Inventario);
Inventario.belongsTo(Producto);

Bodega.hasMany(Inventario);
Inventario.belongsTo(Bodega);

export { Producto, Bodega, Inventario };
