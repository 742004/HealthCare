import { FirebaseProvider } from '../providers/firebase.provider.js';
import deviceTokenService from './deviceToken.service.js';
import notificationPreferenceService from './notificationPreference.service.js';
import notificationHistoryService from './notificationHistory.service.js';
import logger from '../utils/logger.js';

/**
 * Firebase Notification Service
 * 
 * Orchestrates sending push notifications, checking preferences,
 * falling back to FCM, and logging history.
 */
class FirebaseNotificationService {
  constructor() {
    this.provider = new FirebaseProvider();
  }

  async sendToUser(userId, type, title, body, dataPayload = {}) {
    try {
      // 1. Check Preferences (DND, Opt-outs)
      const canSend = await notificationPreferenceService.canSendNotification(userId, type);
      if (!canSend) {
        logger?.info(`Notification blocked by user preference. User: ${userId}, Type: ${type}`);
        return null;
      }

      // 2. Fetch Active Tokens
      const tokens = await deviceTokenService.getUserTokens(userId);
      if (!tokens || tokens.length === 0) {
        logger?.info(`No active devices found for User: ${userId}`);
        return null;
      }

      // 3. Log History as PENDING
      const logEntry = await notificationHistoryService.logNotification(userId, type, title, body, dataPayload);

      // 4. Send via Firebase
      const payload = {
        notification: { title, body },
        data: dataPayload,
      };

      const { response, failedTokens } = await this.provider.sendToMultipleDevices(tokens, payload);

      // 5. Deactivate invalid tokens
      if (failedTokens && failedTokens.length > 0) {
        await deviceTokenService.deactivateInvalidTokens(failedTokens);
      }

      // 6. Update History Status
      const status = response.successCount > 0 ? 'SENT' : 'FAILED';
      await notificationHistoryService.updateDeliveryStatus(
        logEntry?._id, 
        status, 
        status === 'FAILED' ? 'All tokens failed' : null
      );

      return response;
    } catch (error) {
      logger?.error(`sendToUser failed: ${error.message}`);
      return null;
    }
  }

  // Domain specific aliases mapping to sendToUser
  async sendEmergencyAlert(userId, emergencyId, message) {
    return this.sendToUser(userId, 'EMERGENCY_CREATED', 'Emergency Alert', message, { emergencyId });
  }

  async sendHospitalAssignment(userId, emergencyId, hospitalName) {
    return this.sendToUser(userId, 'HOSPITAL_ASSIGNED', 'Hospital Assigned', `Assigned to ${hospitalName}`, { emergencyId });
  }

  async sendAmbulanceAssignment(userId, emergencyId, ambulanceId) {
    return this.sendToUser(userId, 'AMBULANCE_DISPATCHED', 'Ambulance Dispatched', 'An ambulance is en route to your location.', { emergencyId, ambulanceId });
  }

  async sendChatNotification(userId, roomId, senderName, messageText) {
    return this.sendToUser(userId, 'CHAT_MESSAGE_RECEIVED', `New message from ${senderName}`, messageText, { roomId });
  }

  async sendTopicNotification(topic, type, title, body, dataPayload = {}) {
    const payload = {
      notification: { title, body },
      data: dataPayload,
    };
    return this.provider.sendToTopic(topic, payload);
  }

  async subscribeUserToTopic(userId, topic) {
    const tokens = await deviceTokenService.getUserTokens(userId);
    if (tokens.length > 0) {
      return this.provider.subscribeToTopic(tokens, topic);
    }
  }

  async unsubscribeUserFromTopic(userId, topic) {
    const tokens = await deviceTokenService.getUserTokens(userId);
    if (tokens.length > 0) {
      return this.provider.unsubscribeFromTopic(tokens, topic);
    }
  }
}

export default new FirebaseNotificationService();
