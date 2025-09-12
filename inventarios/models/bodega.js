import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Bodega = sequelize.define("Bodega", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  pais: { type: DataTypes.STRING, allowNull: false },
  ciudad: { type: DataTypes.STRING, allowNull: false },
  direccion: { type: DataTypes.STRING, allowNull: false }
});

export default Bodega;
