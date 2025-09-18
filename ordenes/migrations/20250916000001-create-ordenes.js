'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ordens', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendiente'
      },
      cantidadTotal: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      productoId: {
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

    // Add index on estado for filtering orders by status
    await queryInterface.addIndex('Ordens', ['estado'], {
      name: 'ordenes_estado_index'
    });

    // Add index on productoId for product-based queries
    await queryInterface.addIndex('Ordens', ['productoId'], {
      name: 'ordenes_producto_index'
    });

    // Add index on fecha for date-based queries
    await queryInterface.addIndex('Ordens', ['fecha'], {
      name: 'ordenes_fecha_index'
    });

    // Add composite index for common queries
    await queryInterface.addIndex('Ordens', ['estado', 'fecha'], {
      name: 'ordenes_estado_fecha_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Ordens');
  }
};
