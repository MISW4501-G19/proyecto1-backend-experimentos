'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Productos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      categoria: {
        type: Sequelize.STRING,
        allowNull: false
      },
      unidadMedida: {
        type: Sequelize.STRING,
        allowNull: false
      },
      valorUnitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      condicionesAlmacenamiento: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add index on SKU for faster lookups
    await queryInterface.addIndex('Productos', ['sku'], {
      unique: true,
      name: 'productos_sku_unique'
    });

    // Add index on categoria for filtering
    await queryInterface.addIndex('Productos', ['categoria'], {
      name: 'productos_categoria_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Productos');
  }
};
