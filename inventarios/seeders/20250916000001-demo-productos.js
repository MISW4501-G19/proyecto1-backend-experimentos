'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const productos = [
      {
        id: uuidv4(),
        sku: 'ELEC-LAP-001',
        nombre: 'Laptop Dell Inspiron 15',
        descripcion: 'Laptop para uso empresarial con procesador Intel i5, 8GB RAM, 256GB SSD',
        categoria: 'Electrónicos',
        unidadMedida: 'Unidad',
        valorUnitario: 899.99,
        condicionesAlmacenamiento: 'Ambiente seco, temperatura controlada',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        sku: 'ELEC-MON-002',
        nombre: 'Monitor LG 24 pulgadas',
        descripcion: 'Monitor Full HD con tecnología IPS, ideal para oficina',
        categoria: 'Electrónicos',
        unidadMedida: 'Unidad',
        valorUnitario: 199.99,
        condicionesAlmacenamiento: 'Ambiente seco, proteger de golpes',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        sku: 'OFIC-SIL-003',
        nombre: 'Silla de Oficina Ergonómica',
        descripcion: 'Silla ergonómica con soporte lumbar ajustable',
        categoria: 'Oficina',
        unidadMedida: 'Unidad',
        valorUnitario: 149.99,
        condicionesAlmacenamiento: 'Ambiente seco',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Productos', productos, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Productos', null, {});
  }
};
