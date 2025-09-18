'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Starting complete staging environment setup...');
    console.log('This will create:');
    console.log('- 11,000 medical products');
    console.log('- 8 warehouses across Colombia');
    console.log('- 11,000 inventory records (999,999 units each)');
    console.log('');
    
    // Check if staging data already exists
    const productCount = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM "Productos"',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (productCount[0].count > 1000) {
      console.log(`⚠️  Staging data already exists (${productCount[0].count} products). Skipping setup.`);
      return;
    }

    console.log('📋 Running staging seeders in order...');
    
    // 1. Create warehouses first
    console.log('1️⃣ Creating warehouses...');
    const warehouseSeeder = require('./20250916000004-bulk-warehouses-staging.js');
    await warehouseSeeder.up(queryInterface, Sequelize);
    
    // 2. Create products
    console.log('2️⃣ Creating 11,000 products...');
    const productSeeder = require('./20250916000003-bulk-products-staging.js');
    await productSeeder.up(queryInterface, Sequelize);
    
    // 3. Create inventory
    console.log('3️⃣ Creating inventory distribution...');
    const inventorySeeder = require('./20250916000005-bulk-inventory-staging.js');
    await inventorySeeder.up(queryInterface, Sequelize);
    
    console.log('');
    console.log('🎉 Staging environment setup completed successfully!');
    console.log('📊 Summary:');
    console.log('- Products: 11,000 medical supplies');
    console.log('- Warehouses: 8 locations across Colombia');
    console.log('- Inventory: 11,000 records with 999,999 units each');
    console.log('');
    console.log('🔗 You can now test the API endpoints:');
    console.log('- GET /inventarios/productos (with pagination)');
    console.log('- GET /inventarios/bodegas');
    console.log('- GET /inventarios/inventarios');
    console.log('- POST /ordenes (create orders)');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back staging environment setup...');
    
    // Rollback in reverse order
    const inventorySeeder = require('./20250916000005-bulk-inventory-staging.js');
    await inventorySeeder.down(queryInterface, Sequelize);
    
    const productSeeder = require('./20250916000003-bulk-products-staging.js');
    await productSeeder.down(queryInterface, Sequelize);
    
    const warehouseSeeder = require('./20250916000004-bulk-warehouses-staging.js');
    await warehouseSeeder.down(queryInterface, Sequelize);
    
    console.log('✅ Staging environment setup rolled back');
  }
};

