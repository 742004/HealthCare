import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { USER_ROLES } from '../utils/constants.js';

/**
 * ============================================================================
 * EXTERNAL INTEGRATION PLACEHOLDERS
 * ============================================================================
 */
const firebaseService = {
  sendPushNotification: async (token, title, body, data) => true,
  publishRealtimeUpdate: async (topic, payload) => true,
};

const emailService = {
  sendGenericEmail: async (to, subject, html) => true,
};

const smsService = {
  sendGenericSMS: async (to, message) => true,
};

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDERS
 * ============================================================================
 */
const NotificationRepository = {
  createNotification: async (data, session = null) => null,
  findNotificationById: async (id, session = null) => null,
  findByDedupKey: async (dedupKey, userId) => null,
  updateNotification: async (id, data, session = null) => null,
  markAsRead: async (id, session = null) => null,
  markAllAsReadByUser: async (userId, session = null) => null,
  deleteNotification: async (id, session = null) => null,
  getUserPreferences: async (userId, session = null) => null,
  updateUserPreferences: async (userId, prefs, session = null) => null,
};

const UserRepository = {
  findUsersByRole: async (role, session = null) => [],
};

/**
 * ============================================================================
 * NOTIFICATION TEMPLATES
 * ============================================================================
 */
const NOTIFICATION_TEMPLATES = {
  EMERGENCY_CREATED: {
    title: 'Emergency Request Created',
    body: 'Ref {{referenceNumber}}: Your SOS has been received. Finding nearest responders.',
    priority: 'HIGH'
  },
  AMBULANCE_ASSIGNED: {
    title: 'Ambulance Assigned',
    body: 'Vehicle {{ambulanceNumber}} driven by {{driverName}} is en route. ETA: {{eta}}.',
    priority: 'CRITICAL'
  },
  HOSPITAL_ASSIGNED: {
    title: 'Hospital Assigned',
    body: '{{hospitalName}} is preparing for your arrival.',
    priority: 'CRITICAL'
  },
  DOCTOR_ASSIGNED: {
    title: 'Doctor Assigned',
    body: 'Dr. {{doctorName}} is reviewing your case.',
    priority: 'NORMAL'
  },
  EMERGENCY_COMPLETED: {
    title: 'Emergency Completed',
    body: 'Your emergency request {{referenceNumber}} has been successfully closed.',
    priority: 'LOW'
  },
  PASSWORD_RESET: {
    title: 'Password Reset',
    body: 'Click here to reset your password. Link expires in 10 minutes.',
    priority: 'HIGH'
  },
  OTP: {
    title: 'Your OTP Code',
    body: 'Your code is {{otp}}. Do not share this with anyone.',
    priority: 'CRITICAL'
  },
  WELCOME: {
    title: 'Welcome to HEALIX',
    body: 'Hello {{patientName}}, your account is fully set up!',
    priority: 'LOW'
  }
};

/**
 * Notification Service
 * Orchestrates multi-channel notifications (In-App, Push, SMS, Email) with templating and deduplication.
 */
class NotificationService {
  /**
   * ============================================================================
   * ANALYTICS & TRACKING HOOKS
   * ============================================================================
   */
  _recordDeliveryMetric(notificationId, channel) {}
  _recordOpenMetric(notificationId) {}
  _recordFailureMetric(notificationId, channel, errorReason) {}

  /**
   * Evaluates templates and injects dynamic data variables.
   * @private
   */
  _compileTemplate(templateKey, variables) {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) throw new Error(`Notification template ${templateKey} not found.`);

    let compiledBody = template.body;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      compiledBody = compiledBody.replace(regex, value);
    }
    return { title: template.title, body: compiledBody, priority: template.priority };
  }

  /**
   * ============================================================================
   * QUEUE & RATE LIMIT PLACEHOLDERS
   * ============================================================================
   */
  async _queueNotificationJob(payload) { return true; }
  async _checkRateLimit(userId, notificationType) { return true; }

  /**
   * Internal helper to persist an In-App notification with Delivery Tracking
   * @private
   */
  async _saveInAppNotification(userId, title, message, priority, metadata = {}, dedupKey = null) {
    if (dedupKey) {
      const existing = await NotificationRepository.findByDedupKey(dedupKey, userId);
      if (existing) {
        // Idempotency: Update existing rather than spamming a new one
        return await NotificationRepository.updateNotification(existing._id, { message, metadata });
      }
    }

    const payload = { 
      recipient: userId, 
      title, 
      message, 
      priority, 
      metadata, 
      isRead: false,
      deliveryStatus: 'SENT', // QUEUED, SENT, DELIVERED, READ, FAILED, EXPIRED
      dedupKey 
    };
    
    const notification = await NotificationRepository.createNotification(payload);
    await firebaseService.publishRealtimeUpdate(`user/${userId}/notifications`, notification);
    return notification;
  }

  /**
   * Internal Delivery Engine
   * Retries failed external deliveries using exponential backoff inside the queue.
   * @private
   */
  async _deliverMultiChannel(userId, channels, compiledMsg, metadata = {}, dedupKey = null) {
    const prefs = await NotificationRepository.getUserPreferences(userId) || {};
    const { title, body, priority } = compiledMsg;
    const promises = [];

    // CRITICAL bypasses user preferences automatically
    const isCritical = priority === 'CRITICAL';

    if (channels.includes('IN_APP') && (isCritical || prefs.inApp !== false)) {
      promises.push(this._saveInAppNotification(userId, title, body, priority, metadata, dedupKey));
    }

    if (channels.includes('PUSH') && (isCritical || prefs.push !== false)) {
      promises.push(firebaseService.sendPushNotification('mock-token', title, body, metadata).then(() => {
        this._recordDeliveryMetric('push_delivered', 'PUSH');
      }).catch(err => {
        this._recordFailureMetric('push_failed', 'PUSH', err.message);
        logger.error(`Push Notification failed for ${userId}: ${err.message}`);
      }));
    }

    if (channels.includes('EMAIL') && (isCritical || prefs.email !== false)) {
      promises.push(emailService.sendGenericEmail('mock@email.com', title, body).catch(err => {
        logger.error(`Email Notification failed for ${userId}: ${err.message}`);
      }));
    }

    if (channels.includes('SMS') && (isCritical || prefs.sms !== false)) {
      await this._checkRateLimit(userId, 'SMS');
      promises.push(smsService.sendGenericSMS('1234567890', body).catch(err => {
        logger.error(`SMS Notification failed for ${userId}: ${err.message}`);
      }));
    }

    await Promise.allSettled(promises);
    return true;
  }

  /**
   * General purpose multi-channel sender via Template
   */
  async sendTemplatedNotification(userId, channels, templateKey, variables = {}, metadata = {}, dedupKey = null) {
    const compiledMsg = this._compileTemplate(templateKey, variables);
    
    await this._queueNotificationJob({ userId, channels, compiledMsg, metadata, dedupKey });
    await this._deliverMultiChannel(userId, channels, compiledMsg, metadata, dedupKey);
    
    logger.info(`[AUDIT] Notification Sent to ${userId} via ${channels.join(', ')}`);
    return true;
  }

  /**
   * Broadcasts critical alerts to all users in a specific role.
   */
  async broadcastToRole(role, templateKey, variables = {}, metadata = {}) {
    const users = await UserRepository.findUsersByRole(role);
    const compiledMsg = this._compileTemplate(templateKey, variables);
    
    const chunks = [];
    for (const user of users) {
      chunks.push(this._queueNotificationJob({ userId: user._id, channels: ['IN_APP', 'PUSH'], compiledMsg, metadata }));
    }

    await Promise.allSettled(chunks);
    logger.warn(`[AUDIT] Broadcast Alert Sent to Role: ${role} (${users.length} users)`);
    return true;
  }

  async markAsRead(notificationId, userId) {
    const notification = await NotificationRepository.findNotificationById(notificationId);
    if (!notification) throw new ApiError(404, 'Notification not found');

    if (notification.recipient.toString() !== userId.toString()) throw new ApiError(403, 'Access denied');

    await NotificationRepository.markAsRead(notificationId);
    await NotificationRepository.updateNotification(notificationId, { deliveryStatus: 'READ' });
    this._recordOpenMetric(notificationId);

    return true;
  }

  async markAllAsRead(userId) {
    await NotificationRepository.markAllAsReadByUser(userId);
    return true;
  }

  async deleteNotification(notificationId, userId) {
    const notification = await NotificationRepository.findNotificationById(notificationId);
    if (!notification) throw new ApiError(404, 'Notification not found');

    if (notification.recipient.toString() !== userId.toString()) throw new ApiError(403, 'Access denied');

    await NotificationRepository.deleteNotification(notificationId);
    return true;
  }

  async updatePreferences(userId, preferences) {
    const updated = await NotificationRepository.updateUserPreferences(userId, preferences);
    logger.info(`[AUDIT] Preferences updated for user ${userId}`);
    return updated;
  }

  async retryFailedNotifications() {
    logger.info(`[WORKER] Retrying failed notifications...`);
    return true;
  }
}

export const notificationService = new NotificationService();
