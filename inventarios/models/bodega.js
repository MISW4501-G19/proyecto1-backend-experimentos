import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Bodega = sequelize.define("Bodega", {
  nombre: { type: DataTypes.STRING, allowNull: false },
  ubicacion: { type: DataTypes.STRING }
});

export default Bodega;