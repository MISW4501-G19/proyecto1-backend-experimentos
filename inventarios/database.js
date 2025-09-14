import { Sequelize } from "sequelize";

// Database configuration based on environment
const getDatabaseConfig = () => {
  const dbType = process.env.DB_TYPE || 'sqlite';
  
  if (dbType === 'postgresql') {
    return {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'inventarios',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  } else {
    // SQLite for local development
    return {
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    };
  }
};

const sequelize = new Sequelize(getDatabaseConfig());

export default sequelize;
