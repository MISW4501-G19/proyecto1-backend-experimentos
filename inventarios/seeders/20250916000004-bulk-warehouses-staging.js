'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Creating warehouses for staging...');
    
    // Check if warehouses already exist
    const existingCount = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM "Bodegas"',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingCount[0].count > 0) {
      console.log(`⚠️  Warehouses already exist (${existingCount[0].count} records). Skipping warehouse creation.`);
      return;
    }

    const warehouses = [
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
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Costa Cartagena',
        pais: 'Colombia',
        ciudad: 'Cartagena',
        direccion: 'Zona Portuaria, Sector 5',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Sur Cali',
        pais: 'Colombia',
        ciudad: 'Cali',
        direccion: 'Avenida 6N #28-10, Distrito Industrial',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Este Barranquilla',
        pais: 'Colombia',
        ciudad: 'Barranquilla',
        direccion: 'Via 40 #72-15, Zona Industrial',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Bucaramanga',
        pais: 'Colombia',
        ciudad: 'Bucaramanga',
        direccion: 'Carrera 27 #45-67, Zona Industrial',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Pereira',
        pais: 'Colombia',
        ciudad: 'Pereira',
        direccion: 'Avenida 30 de Agosto #15-30',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nombre: 'Bodega Manizales',
        pais: 'Colombia',
        ciudad: 'Manizales',
        direccion: 'Carrera 23 #19-20, Zona Industrial',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Bodegas', warehouses, {});
    console.log('✅ Warehouses created successfully!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back warehouse creation...');
    await queryInterface.bulkDelete('Bodegas', null, {});
    console.log('✅ Warehouse creation rolled back');
  }
};
