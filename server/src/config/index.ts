import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/finance_erp?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'finance_erp_default_jwt_secret_dev_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'finance_erp_default_refresh_secret_dev_2026',
  jwtExpiresIn: '24h',
  jwtRefreshExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
