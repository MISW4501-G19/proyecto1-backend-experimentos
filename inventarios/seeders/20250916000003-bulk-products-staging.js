'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Starting bulk product seeding for staging (11k products)...');
    
    // Check if products already exist
    const existingCount = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM "Productos"',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingCount[0].count > 100) {
      console.log(`⚠️  Products already exist (${existingCount[0].count} records). Skipping bulk seeding.`);
      return;
    }

    // Generate 11k products in batches for performance
    const batchSize = 500; // Smaller batches for better memory management
    const totalProducts = 11000;
    
    // Realistic product categories for medical supply company
    const categories = [
      'Equipos Médicos', 'Instrumental Quirúrgico', 'Medicamentos', 'Material Desechable',
      'Equipos de Laboratorio', 'Mobiliario Hospitalario', 'Equipos de Diagnóstico',
      'Suministros de Emergencia', 'Equipos de Rehabilitación', 'Material de Sutura',
      'Equipos de Anestesia', 'Material de Curación', 'Equipos de Monitoreo',
      'Instrumental Dental', 'Equipos de Imagen', 'Material de Protección',
      'Equipos de Terapia', 'Suministros de Limpieza', 'Equipos de Cirugía',
      'Material de Laboratorio'
    ];
    
    const unidadesMedida = ['Unidad', 'Caja', 'Paquete', 'Litro', 'Kilogramo', 'Metro', 'Set', 'Kit'];
    
    const condicionesAlmacenamiento = [
      'Ambiente seco, temperatura controlada 15-25°C',
      'Refrigerado 2-8°C, proteger de la luz',
      'Congelado -20°C, no descongelar',
      'Ambiente seco, temperatura ambiente',
      'Refrigerado 2-8°C, ambiente seco',
      'Temperatura controlada, proteger de humedad',
      'Ambiente seco, evitar exposición directa al sol',
      'Refrigerado 4°C, ambiente estéril'
    ];

    // Medical product names and descriptions
    const productTemplates = [
      { name: 'Equipo de Monitoreo', desc: 'Sistema de monitoreo de signos vitales' },
      { name: 'Jeringa Desechable', desc: 'Jeringa estéril de un solo uso' },
      { name: 'Guantes Quirúrgicos', desc: 'Guantes estériles para procedimientos' },
      { name: 'Mascarilla N95', desc: 'Mascarilla de protección respiratoria' },
      { name: 'Termómetro Digital', desc: 'Termómetro clínico de precisión' },
      { name: 'Estetoscopio', desc: 'Estetoscopio acústico profesional' },
      { name: 'Tensiómetro', desc: 'Esfigmomanómetro digital' },
      { name: 'Oxímetro de Pulso', desc: 'Monitor de saturación de oxígeno' },
      { name: 'Bata Quirúrgica', desc: 'Bata estéril desechable' },
      { name: 'Gorro Quirúrgico', desc: 'Gorro estéril desechable' },
      { name: 'Mascarilla Quirúrgica', desc: 'Mascarilla estéril de 3 capas' },
      { name: 'Gasas Estériles', desc: 'Gasas de algodón estériles' },
      { name: 'Vendas Elásticas', desc: 'Vendas de compresión elástica' },
      { name: 'Apósitos Adhesivos', desc: 'Apósitos estériles autoadhesivos' },
      { name: 'Solución Salina', desc: 'Solución salina isotónica estéril' },
      { name: 'Agua Destilada', desc: 'Agua destilada para uso médico' },
      { name: 'Alcohol Isopropílico', desc: 'Alcohol isopropílico 70%' },
      { name: 'Yodo Povidona', desc: 'Antiséptico yodado' },
      { name: 'Clorhexidina', desc: 'Antiséptico de clorhexidina' },
      { name: 'Sutura Absorbible', desc: 'Hilo de sutura absorbible' }
    ];

    console.log(`📦 Generating ${totalProducts} products in batches of ${batchSize}...`);

    for (let batch = 0; batch < Math.ceil(totalProducts / batchSize); batch++) {
      const startIndex = batch * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalProducts);
      const batchProducts = [];

      for (let i = startIndex; i < endIndex; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
        const unidad = unidadesMedida[Math.floor(Math.random() * unidadesMedida.length)];
        const condiciones = condicionesAlmacenamiento[Math.floor(Math.random() * condicionesAlmacenamiento.length)];
        
        // Generate realistic product data
        const productNumber = String(i + 1).padStart(6, '0');
        const sku = `${category.substring(0, 4).toUpperCase()}-${productNumber}`;
        
        // Generate realistic pricing based on category
        let basePrice = 10;
        if (category.includes('Equipos')) basePrice = 500;
        else if (category.includes('Instrumental')) basePrice = 150;
        else if (category.includes('Medicamentos')) basePrice = 25;
        else if (category.includes('Material')) basePrice = 5;
        
        const valorUnitario = Math.round((basePrice + Math.random() * basePrice * 2) * 100) / 100;
        
        batchProducts.push({
          id: uuidv4(),
          sku: sku,
          nombre: `${template.name} ${productNumber}`,
          descripcion: `${template.desc} - ${category}. Especificaciones técnicas y características principales para uso profesional.`,
          categoria: category,
          unidadMedida: unidad,
          valorUnitario: valorUnitario,
          condicionesAlmacenamiento: condiciones,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Insert batch with transaction for better performance
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.bulkInsert('Productos', batchProducts, { transaction });
      });
      
      const progress = Math.round(((batch + 1) * batchSize / totalProducts) * 100);
      console.log(`📊 Progress: ${progress}% (${endIndex}/${totalProducts} products)`);
    }

    console.log('✅ Bulk product seeding completed successfully!');
    console.log(`📈 Total products created: ${totalProducts}`);
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back bulk product seeding...');
    await queryInterface.bulkDelete('Productos', null, {});
    console.log('✅ Bulk product seeding rolled back');
  }
};
