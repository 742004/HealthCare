import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

/**
 * Validates required environment variables during startup.
 * Throws a clear error if any essential variable is missing, preventing
 * silent failures later in production.
 */
const requiredEnvs = [
  'MONGO_URI',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
];

requiredEnvs.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ CRITICAL STARTUP ERROR: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

/**
 * Centralized Application Configuration Object
 * Reads strictly from process.env and provides sensible defaults where appropriate.
 */
export const config = {
  app: {
    name: process.env.APP_NAME || 'Emergency Healthcare Connector',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    apiVersion: process.env.API_VERSION || 'v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  },
  
  db: {
    mongoUri: process.env.MONGO_URI,
  },
  
  jwt: {
    accessSecret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessExpiry: process.env.JWT_EXPIRE || '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRE || '7d',
    issuer: process.env.JWT_ISSUER || 'ehc-server',
    audience: process.env.JWT_AUDIENCE || 'ehc-client',
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  
  maps: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
  
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  
  featureFlags: {
    AI_ENABLED: process.env.FEATURE_AI_ENABLED === 'true',
    SMS_ENABLED: process.env.FEATURE_SMS_ENABLED === 'true',
    EMAIL_ENABLED: process.env.FEATURE_EMAIL_ENABLED !== 'false', // Enabled by default
    FIREBASE_ENABLED: process.env.FEATURE_FIREBASE_ENABLED !== 'false', // Enabled by default
  }
};

export default config;
