import dotenv from 'dotenv';

dotenv.config();

/**
 * Firebase Configuration Module
 * Exports immutable Firebase settings loaded from environment variables.
 */
export const firebaseConfig = Object.freeze({
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  // Handle escaped newlines in private key
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  fcmDefaultTopic: process.env.FCM_DEFAULT_TOPIC || 'all_users',
  maxRetry: parseInt(process.env.FCM_MAX_RETRY, 10) || 3,
  timeout: parseInt(process.env.FCM_TIMEOUT, 10) || 10000,
});
