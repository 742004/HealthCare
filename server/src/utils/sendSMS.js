import logger from './logger.js';
import config from '../config/app.config.js';
import { ApiError } from './ApiError.js';
import { formatPhoneNumber } from './helpers.js';

/**
 * Base SMS Provider Interface
 * All future providers (Twilio, AWS SNS, Vonage) must implement this interface.
 */
class BaseSMSProvider {
  /**
   * Send a generic SMS message
   * @param {string} to - The recipient phone number
   * @param {string} message - The text content of the SMS
   * @returns {Promise<boolean>} Success status
   */
  async send(to, message) {
    throw new Error('Method "send()" must be implemented by the provider.');
  }
}

/**
 * Mock SMS Provider for local development.
 * Simulates network latency and occasional failures.
 */
class MockSMSProvider extends BaseSMSProvider {
  constructor() {
    super();
    this.failureRate = 0.05; // 5% chance to fail randomly to test retries
    this.simulatedDelay = 500; // Simulated network latency in ms
  }

  async send(to, message) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random network failure
        if (Math.random() < this.failureRate) {
          logger.warn(`[MockSMSProvider] Simulated failure for message to ${to}`);
          return reject(new Error('Simulated network timeout/failure'));
        }

        logger.info(`📱 [SMS SENT] To: ${to} | Message: "${message}"`);
        resolve(true);
      }, this.simulatedDelay);
    });
  }
}

// FUTURE PLACEHOLDERS
// class TwilioProvider extends BaseSMSProvider { ... }
// class AwsSNSProvider extends BaseSMSProvider { ... }
// class FirebaseMessagingProvider extends BaseSMSProvider { ... }

/**
 * Core SMS Service
 * Manages the active provider and handles resilience (retries, backoffs).
 */
class SMSService {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Internal wrapper to execute the provider's send method with Exponential Backoff Retry.
   */
  async _executeWithRetry(to, message, retries = 3) {
    if (!config.featureFlags.SMS_ENABLED) {
      logger.debug('SMS is globally disabled via feature flags. Skipping send.');
      return true;
    }

    const cleanPhone = formatPhoneNumber(to);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new ApiError(400, 'Invalid phone number format provided for SMS', 'SMS_INVALID_PHONE');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.provider.send(`+${cleanPhone}`, message);
        return true;
      } catch (error) {
        logger.error(`SMS send failed (Attempt ${attempt}/${retries}): ${error.message}`);
        
        if (attempt === retries) {
          throw new ApiError(503, 'Failed to send SMS after multiple attempts', 'SMS_SERVICE_UNAVAILABLE');
        }
        
        // Exponential backoff: 1s, 2s, 4s...
        const backoffDelay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // ==========================================================================
  // BUSINESS LOGIC WRAPPERS
  // ==========================================================================

  async sendOTP(to, otp, expiryMinutes = 10) {
    const message = `Your Emergency Healthcare Connector OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code.`;
    return this._executeWithRetry(to, message);
  }

  async sendEmergencyAlert(to, emergencyId, patientName) {
    const message = `SOS ALERT: Patient ${patientName} has requested an emergency (Ref: #${emergencyId}). Please check your dashboard immediately.`;
    return this._executeWithRetry(to, message);
  }

  async sendAmbulanceAssigned(to, vehicleNo, eta) {
    const message = `Ambulance Assigned: Vehicle ${vehicleNo} is en route. ETA: ~${eta} mins. Track live on your app.`;
    return this._executeWithRetry(to, message);
  }

  async sendHospitalReady(to, hospitalName) {
    const message = `Triage Ready: ${hospitalName} is prepared for your arrival. Proceed directly to the Emergency entrance.`;
    return this._executeWithRetry(to, message);
  }

  async sendGenericSMS(to, message) {
    return this._executeWithRetry(to, message);
  }
}

// Select the provider based on environment config (currently defaulting to Mock)
// In the future: const activeProvider = process.env.NODE_ENV === 'production' ? new TwilioProvider() : new MockSMSProvider();
const activeProvider = new MockSMSProvider();

// Export the singleton service instance
export const smsService = new SMSService(activeProvider);
