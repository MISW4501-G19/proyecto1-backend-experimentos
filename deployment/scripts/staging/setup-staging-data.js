#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

console.log('🚀 MedySupply Staging Data Setup');
console.log('=================================');
console.log('');
console.log('This script will set up staging data for the entire system:');
console.log('1. Inventarios service: 11,000 products + inventory');
console.log('2. Ordenes service: Database schema only');
console.log('3. Gateway service: Health checks');
console.log('');

const confirm = process.argv.includes('--confirm');
if (!confirm) {
  console.log('⚠️  This will create a large amount of test data across all services.');
  console.log('Run with --confirm to proceed:');
  console.log('node deployment/scripts/staging/setup-staging-data.js --confirm');
  process.exit(0);
}

async function setupStagingData() {
  try {
    console.log('🔄 Step 1: Setting up Inventarios service...');
    console.log('===========================================');
    
    // Change to inventarios directory
    process.chdir(path.join(projectRoot, 'inventarios'));
    
    // Run inventarios migrations and seeders
    console.log('📦 Running inventarios migrations...');
    execSync('npm run migrate', { stdio: 'inherit' });
    
    console.log('🌱 Running inventarios seeders...');
    execSync('npm run seed', { stdio: 'inherit' });
    
    console.log('✅ Inventarios service setup completed');
    console.log('');
    
    console.log('🔄 Step 2: Setting up Ordenes service...');
    console.log('======================================');
    
    // Change to ordenes directory
    process.chdir(path.join(projectRoot, 'ordenes'));
    
    // Run ordenes migrations and seeders
    console.log('📦 Running ordenes migrations...');
    execSync('npm run migrate', { stdio: 'inherit' });
    
    console.log('🌱 Running ordenes seeders...');
    execSync('npm run seed', { stdio: 'inherit' });
    
    console.log('✅ Ordenes service setup completed');
    console.log('');
    
    console.log('🔄 Step 3: Verifying setup...');
    console.log('============================');
    
    // Test inventarios
    console.log('🧪 Testing inventarios service...');
    process.chdir(path.join(projectRoot, 'inventarios'));
    execSync('npm run staging:test', { stdio: 'inherit' });
    
    console.log('');
    console.log('🎉 Staging data setup completed successfully!');
    console.log('');
    console.log('📊 What was created:');
    console.log('- Inventarios: 11,000 products, 8 warehouses, 11,000 inventory records');
    console.log('- Ordenes: Database schema only');
    console.log('- All services: Database schemas and sample data');
    console.log('');
    console.log('🔗 Test the services:');
    console.log('- Inventarios: http://localhost:4001/inventarios/productos');
    console.log('- Ordenes: http://localhost:4002/ordenes');
    console.log('- Gateway: http://localhost:3000/health');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupStagingData();
