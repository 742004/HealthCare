import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';

import routes from './routes/index.js';
import logger from './utils/logger.js';
import ApiError from './utils/ApiError.js';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES (Security & Perf)
// ==========================================

// Set Security HTTP Headers (Module 21)
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization against NoSQL query injection (Module 21)
app.use(mongoSanitize());

// Data Sanitization against XSS (Module 21)
app.use(xss());

// Compress all responses (Module 20)
app.use(compression());

// Logging (Module 22)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Production logging
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// ==========================================
// 2. MONITORING ENDPOINTS (Module 22)
// ==========================================

// Liveness Probe
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Readiness Probe
app.get('/readyz', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Ready to accept traffic' });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Emergency Healthcare API is running' });
});

// ==========================================
// 3. API ROUTES
// ==========================================

// Mount all modular routes
app.use('/api/v1', routes);

// ==========================================
// 4. ERROR HANDLING
// ==========================================

// Unhandled Route Handler
app.all('*', (req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger.error(err.stack);
  } else {
    logger.warn(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);
  }

  res.status(statusCode).json({
    status: err.status || 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
