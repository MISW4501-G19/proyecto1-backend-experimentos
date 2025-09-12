import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Producto = sequelize.define("Producto", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unidadMedida: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

export default Producto;
