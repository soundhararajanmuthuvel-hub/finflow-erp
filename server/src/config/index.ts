import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawCors = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000';
const corsOrigins = rawCors.split(',').map((o) => o.trim()).filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/finance_erp?schema=public',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'finance_erp_default_jwt_secret_dev_2026'),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'finance_erp_default_refresh_secret_dev_2026'),
  jwtExpiresIn: '24h',
  jwtRefreshExpiresIn: '7d',
  corsOrigins,
};

// Fail fast in production if required secrets are missing
if (config.nodeEnv === 'production') {
  if (!config.jwtSecret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
  }
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL environment variable is not explicitly set in production.');
  }
}
