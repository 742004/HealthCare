import admin from 'firebase-admin';
import { firebaseConfig } from '../config/firebase.config.js';
import { NotificationProvider } from './notification.provider.js';
import logger from '../utils/logger.js';

/**
 * Firebase Provider Implementation
 * 
 * Implements the NotificationProvider interface using the official Firebase Admin SDK.
 */
export class FirebaseProvider extends NotificationProvider {
  constructor() {
    super();
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      if (!admin.apps.length) {
        if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
          logger?.warn('Firebase credentials missing. FCM will not initialize.');
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            clientEmail: firebaseConfig.clientEmail,
            privateKey: firebaseConfig.privateKey,
          }),
        });
      }
      this.isInitialized = true;
      logger?.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger?.error(`Firebase initialization failed: ${error.message}`);
    }
  }

  async healthCheck() {
    return this.isInitialized;
  }

  async sendToDevice(token, payload, options = {}) {
    if (!this.isInitialized) return null;
    try {
      const response = await admin.messaging().send({
        token,
        ...payload, // contains notification and data objects
      }, options.dryRun);
      return response; // Message ID
    } catch (error) {
      logger?.error(`FCM sendToDevice failed: ${error.message}`);
      throw error;
    }
  }

  async sendToMultipleDevices(tokens, payload, options = {}) {
    if (!this.isInitialized || !tokens.length) return null;
    try {
      const message = {
        tokens,
        ...payload,
      };
      const response = await admin.messaging().sendEachForMulticast(message, options.dryRun);
      
      // Handle cleanup of invalid tokens here or return failures to the service
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        logger?.warn(`FCM batch sent with ${response.failureCount} failures.`);
        return { response, failedTokens };
      }
      return { response, failedTokens: [] };
    } catch (error) {
      logger?.error(`FCM sendToMultipleDevices failed: ${error.message}`);
      throw error;
    }
  }

  async sendToTopic(topic, payload, options = {}) {
    if (!this.isInitialized) return null;
    try {
      const response = await admin.messaging().send({
        topic,
        ...payload,
      }, options.dryRun);
      return response;
    } catch (error) {
      logger?.error(`FCM sendToTopic failed: ${error.message}`);
      throw error;
    }
  }

  async subscribeToTopic(tokens, topic) {
    if (!this.isInitialized || !tokens.length) return null;
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      return response;
    } catch (error) {
      logger?.error(`FCM subscribeToTopic failed: ${error.message}`);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens, topic) {
    if (!this.isInitialized || !tokens.length) return null;
    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      return response;
    } catch (error) {
      logger?.error(`FCM unsubscribeFromTopic failed: ${error.message}`);
      throw error;
    }
  }

  async validateToken(token) {
    if (!this.isInitialized) return false;
    try {
      // Dry run message to validate token
      await admin.messaging().send({
        token,
      }, true);
      return true;
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      // If it's a different error, the token format might be fine but network failed
      return false; 
    }
  }
}
