'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Inventarios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      lote: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cantidadDisponible: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      fechaVencimiento: {
        type: Sequelize.DATE,
        allowNull: false
      },
      ProductoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Productos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      BodegaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Bodegas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add unique constraint on lote + ProductoId + BodegaId
    await queryInterface.addIndex('Inventarios', ['lote', 'ProductoId', 'BodegaId'], {
      unique: true,
      name: 'inventarios_lote_producto_bodega_unique'
    });

    // Add index on ProductoId for faster product-based queries
    await queryInterface.addIndex('Inventarios', ['ProductoId'], {
      name: 'inventarios_producto_index'
    });

    // Add index on BodegaId for warehouse-based queries
    await queryInterface.addIndex('Inventarios', ['BodegaId'], {
      name: 'inventarios_bodega_index'
    });

    // Add index on fechaVencimiento for FIFO queries
    await queryInterface.addIndex('Inventarios', ['fechaVencimiento'], {
      name: 'inventarios_fecha_vencimiento_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Inventarios');
  }
};