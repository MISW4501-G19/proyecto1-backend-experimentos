import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create umzug instance for migrations
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js',
    resolve: ({ name, path, context }) => {
      // Import the migration file
      return import(path).then(migration => ({
        name,
        up: async () => migration.default.up(context.queryInterface, context.Sequelize),
        down: async () => migration.default.down(context.queryInterface, context.Sequelize),
      }));
    },
  },
  context: {
    queryInterface: sequelize.getQueryInterface(),
    Sequelize: sequelize.Sequelize,
  },
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Create umzug instance for seeders
const seeder = new Umzug({
  migrations: {
    glob: 'seeders/*.js',
    resolve: ({ name, path, context }) => {
      return import(path).then(seeder => ({
        name,
        up: async () => seeder.default.up(context.queryInterface, context.Sequelize),
        down: async () => seeder.default.down(context.queryInterface, context.Sequelize),
      }));
    },
  },
  context: {
    queryInterface: sequelize.getQueryInterface(),
    Sequelize: sequelize.Sequelize,
  },
  storage: new SequelizeStorage({ 
    sequelize,
    tableName: 'SequelizeSeedsMeta' // Different table for seeders
  }),
  logger: console,
});

async function runMigrations() {
  try {
    console.log('🔄 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Running migrations...');
    const migrations = await umzug.up();
    console.log('✅ Migrations completed:', migrations.map(m => m.name));

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function runSeeders() {
  try {
    console.log('🔄 Running seeders...');
    const seeders = await seeder.up();
    console.log('✅ Seeders completed:', seeders.map(s => s.name));

    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function rollbackMigrations() {
  try {
    console.log('🔄 Rolling back migrations...');
    const migrations = await umzug.down();
    console.log('✅ Rollback completed:', migrations.map(m => m.name));
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

async function rollbackSeeders() {
  try {
    console.log('🔄 Rolling back seeders...');
    const seeders = await seeder.down();
    console.log('✅ Seeder rollback completed:', seeders.map(s => s.name));
  } catch (error) {
    console.error('❌ Seeder rollback failed:', error);
    throw error;
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
    break;
  
  case 'seed':
    runSeeders()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
    break;
  
  case 'migrate:rollback':
    rollbackMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
    break;
  
  case 'seed:rollback':
    rollbackSeeders()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
    break;
  
  case 'setup':
    // Run migrations and then seeders
    runMigrations()
      .then(() => runSeeders())
      .then(() => {
        console.log('🎉 Database setup completed successfully!');
        process.exit(0);
      })
      .catch(() => process.exit(1));
    break;
  
  default:
    console.log(`
Usage: node migrate.js <command>

Commands:
  migrate          Run all pending migrations
  seed             Run all seeders
  migrate:rollback Rollback the last migration
  seed:rollback    Rollback the last seeder
  setup            Run migrations and seeders (for initial setup)

Examples:
  node migrate.js setup
  node migrate.js migrate
  node migrate.js seed
    `);
    process.exit(1);
}

export { umzug, seeder, runMigrations, runSeeders, rollbackMigrations, rollbackSeeders };
