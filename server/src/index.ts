import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*', // Configurable in production via config.corsOrigin
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging & Body Parsers
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 Finance ERP Backend running in ${config.nodeEnv} mode on port ${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
