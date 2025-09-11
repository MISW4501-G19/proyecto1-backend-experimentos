import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Producto = sequelize.define("Producto", {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.STRING },
  precio: { type: DataTypes.FLOAT, allowNull: false }
});

export default Producto;