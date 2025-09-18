'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Creating inventory for staging...');
    
    // Get existing products and warehouses
    const productos = await queryInterface.sequelize.query(
      'SELECT id, sku FROM "Productos" ORDER BY "createdAt"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const bodegas = await queryInterface.sequelize.query(
      'SELECT id, nombre FROM "Bodegas" ORDER BY "createdAt"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (productos.length === 0 || bodegas.length === 0) {
      console.log('⚠️  No products or warehouses found. Please run product and warehouse seeders first.');
      return;
    }

    console.log(`📦 Creating inventory for ${productos.length} products (1 record per product with 999,999 availability)...`);

    // Create inventory for each product in ONE warehouse with high availability
    const batchSize = 1000;
    const allInventory = [];
    
    // Use the first warehouse (Bogotá Central) for all inventory
    const primaryWarehouse = bodegas[0];
    
    productos.forEach((producto, pIndex) => {
      const currentDate = new Date();
      const futureDate = new Date();
      
      // Expiration dates: 2 years from now (safe for testing)
      futureDate.setFullYear(currentDate.getFullYear() + 2);
      
      // Generate lot number
      const lotNumber = `${producto.sku}-${primaryWarehouse.nombre.substring(0, 3).toUpperCase()}-001`;
      
      // High availability for testing - all orders will succeed
      const cantidadDisponible = 999999;
      
      allInventory.push({
        id: uuidv4(),
        lote: lotNumber,
        cantidadDisponible: cantidadDisponible,
        fechaVencimiento: futureDate,
        ProductoId: producto.id,
        BodegaId: primaryWarehouse.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Insert inventory in batches
    console.log(`📊 Total inventory records to create: ${allInventory.length}`);
    
    for (let i = 0; i < allInventory.length; i += batchSize) {
      const batch = allInventory.slice(i, i + batchSize);
      
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.bulkInsert('Inventarios', batch, { transaction });
      });
      
      const progress = Math.round(((i + batchSize) / allInventory.length) * 100);
      console.log(`📊 Progress: ${Math.min(progress, 100)}% (${Math.min(i + batchSize, allInventory.length)}/${allInventory.length} records)`);
    }

    console.log('✅ Inventory creation completed successfully!');
    console.log(`📈 Total inventory records created: ${allInventory.length}`);
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back inventory creation...');
    await queryInterface.bulkDelete('Inventarios', null, {});
    console.log('✅ Inventory creation rolled back');
  }
};
