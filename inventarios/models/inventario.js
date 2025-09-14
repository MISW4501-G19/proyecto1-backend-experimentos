import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const Inventario = sequelize.define("Inventario", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  lote: { type: DataTypes.STRING, allowNull: false },
  cantidadDisponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fechaVencimiento: { type: DataTypes.DATE, allowNull: false },
  // Explicitly define foreign key fields
  ProductoId: { 
    type: DataTypes.UUID, 
    allowNull: false,
    references: {
      model: 'Productos',
      key: 'id'
    }
  },
  BodegaId: { 
    type: DataTypes.UUID, 
    allowNull: false,
    references: {
      model: 'Bodegas',
      key: 'id'
    }
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ["lote", "ProductoId", "BodegaId"]
    }
  ]
});

export default Inventario;
