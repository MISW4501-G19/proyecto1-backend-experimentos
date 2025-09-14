// Environment Variable Loader
// Loads environment variables from multiple sources with proper precedence

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with precedence:
// 1. System environment variables (highest priority)
// 2. .env.local file
// 3. .env/{environment}/{service}.env file
// 4. Default values (lowest priority)

export function loadEnvironment(serviceName, environment = 'development') {
  const env = process.env.NODE_ENV || environment;
  
  // Load .env.local first (shared variables)
  config({ path: path.join(process.cwd(), '.env.local') });
  
  // Load service-specific environment file
  const serviceEnvPath = path.join(process.cwd(), `.env/${env}/${serviceName}.env`);
  config({ path: serviceEnvPath });
  
  console.log(`Environment loaded for ${serviceName} in ${env} mode`);
  console.log(`Service env file: ${serviceEnvPath}`);
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || getDefaultPort(serviceName),
    // Add other common variables as needed
  };
}

function getDefaultPort(serviceName) {
  const ports = {
    gateway: 4000,
    inventarios: 4001,
    ordenes: 4002
  };
  return ports[serviceName] || 3000;
}

// Validate required environment variables
export function validateEnvironment(requiredVars) {
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// Get environment-specific configuration
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      logLevel: 'debug',
      database: {
        logging: true,
        sync: { force: true }
      },
      aws: {
        endpoint: process.env.SQS_ENDPOINT || 'http://localhost:9324'
      }
    },
    staging: {
      logLevel: 'info',
      database: {
        logging: false,
        sync: { force: false }
      },
      aws: {
        endpoint: process.env.SQS_ENDPOINT || 'https://sqs.us-east-1.amazonaws.com'
      }
    },
    production: {
      logLevel: 'warn',
      database: {
        logging: false,
        sync: { force: false }
      },
      aws: {
        endpoint: process.env.SQS_ENDPOINT || 'https://sqs.us-east-1.amazonaws.com'
      }
    }
  };
  
  return configs[env] || configs.development;
}
