import logger from '../utils/logger.js';
import { eventBus, DOMAIN_EVENTS } from '../core/EventBus.js';
import { realtimeGateway } from './gateway.js';
import { REALTIME_EVENTS } from './events.js';

/**
 * Notification Gateway
 * Pure networking layer for broadcasting real-time in-app alerts.
 * Bridges internal EventBus notification events to external WebSocket clients.
 * Strictly NO business logic or database access.
 */
class NotificationGateway {
  constructor() {
    this._initializeSubscriptions();
  }

  /**
   * Subscribes to internal business domain events via the centralized EventBus.
   * @private
   */
  _initializeSubscriptions() {
    // Note: Assuming DOMAIN_EVENTS has these mapped. 
    // We fall back to string literals if they weren't explicitly added to the initial events.js
    const EVENT_CREATED = DOMAIN_EVENTS.NOTIFICATION_SENT || 'NOTIFICATION_SENT';
    
    eventBus.subscribe(EVENT_CREATED, this._handleNotificationCreated.bind(this));
    
    // Additional domain events for state updates
    eventBus.subscribe('NOTIFICATION_READ', this._handleNotificationRead.bind(this));
    eventBus.subscribe('NOTIFICATION_DELETED', this._handleNotificationDeleted.bind(this));
    
    logger.info('[NOTIFICATION_GATEWAY] Successfully subscribed to EventBus domain events.');
  }

  /**
   * Helper to securely push an event exclusively to the targeted user.
   * @private
   */
  async _notifyUser(userId, event, payload) {
    if (!userId) return;
    try {
      await realtimeGateway.toUser(userId, event, payload);
      
      // If this is a global broadcast (e.g., system alert), optionally mirror it to admins
      if (payload.isGlobalBroadcast) {
        await realtimeGateway.toRoom('admin_monitoring', event, payload);
      }
    } catch (error) {
      logger.error(`[NOTIFICATION_GATEWAY] Failed to emit ${event} to user ${userId}: ${error.message}`);
    }
  }

  /**
   * Handler: Triggered when a new alert is generated in the system.
   */
  async _handleNotificationCreated(payload) {
    logger.debug(`[NOTIFICATION_GATEWAY] Broadcasting NOTIFICATION_CREATED to user ${payload.userId}`);
    await this._notifyUser(payload.userId, REALTIME_EVENTS.NOTIFICATION_CREATED, payload);
  }

  /**
   * Handler: Triggered when a user clicks/acknowledges an alert.
   * Allows multi-device sync (e.g., read on iPad, automatically marks read on iPhone).
   */
  async _handleNotificationRead(payload) {
    logger.debug(`[NOTIFICATION_GATEWAY] Broadcasting NOTIFICATION_READ to user ${payload.userId}`);
    await this._notifyUser(payload.userId, REALTIME_EVENTS.NOTIFICATION_READ, payload);
  }

  /**
   * Handler: Triggered when a user deletes a notification.
   */
  async _handleNotificationDeleted(payload) {
    const eventName = REALTIME_EVENTS.NOTIFICATION_DELETED || 'NOTIFICATION_DELETED';
    logger.debug(`[NOTIFICATION_GATEWAY] Broadcasting NOTIFICATION_DELETED to user ${payload.userId}`);
    await this._notifyUser(payload.userId, eventName, payload);
  }
}

export const notificationGateway = new NotificationGateway();
