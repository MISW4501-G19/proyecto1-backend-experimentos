'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bodegas = [
      {
        id: uuidv4(),
        nombre: 'Bodega Central Bogotá',
        pais: 'Colombia',
        ciudad: 'Bogotá',
        direccion: 'Calle 100 #15-20, Zona Industrial',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Norte Medellín',
        pais: 'Colombia',
        ciudad: 'Medellín',
        direccion: 'Carrera 65 #45-30, Zona Franca',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Bodegas', bodegas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bodegas', null, {});
  }
};
