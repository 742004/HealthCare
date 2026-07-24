import logger from '../utils/logger.js';
import { eventBus, DOMAIN_EVENTS } from '../core/EventBus.js';
import { realtimeGateway } from './gateway.js';
import { REALTIME_EVENTS } from './events.js';

/**
 * Chat Gateway
 * Pure networking layer for broadcasting real-time messaging events.
 * Bridges internal EventBus chat events to external WebSocket clients.
 * Strictly NO business logic or database access.
 */
class ChatGateway {
  constructor() {
    this._initializeSubscriptions();
  }

  /**
   * Subscribes to internal business domain events via the centralized EventBus.
   * @private
   */
  _initializeSubscriptions() {
    eventBus.subscribe(DOMAIN_EVENTS.MESSAGE_SENT, this._handleMessageSent.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.MESSAGE_EDITED, this._handleMessageEdited.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.MESSAGE_DELETED, this._handleMessageDeleted.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.TYPING_STARTED, this._handleTypingStarted.bind(this));
    eventBus.subscribe(DOMAIN_EVENTS.TYPING_STOPPED, this._handleTypingStopped.bind(this));
    
    logger.info('[CHAT_GATEWAY] Successfully subscribed to EventBus domain events.');
  }

  /**
   * Broadcasts the payload to everyone currently viewing the specific conversation.
   * @private
   */
  async _broadcastToConversation(conversationId, event, payload) {
    if (!conversationId) return;
    try {
      await realtimeGateway.toRoom(`conversation:${conversationId}`, event, payload);
    } catch (error) {
      logger.error(`[CHAT_GATEWAY] Failed to broadcast ${event} to conversation ${conversationId}: ${error.message}`);
    }
  }

  /**
   * Handler: Triggered when a message is successfully persisted to the database.
   */
  async _handleMessageSent(payload) {
    logger.debug(`[CHAT_GATEWAY] Broadcasting MESSAGE_SENT for conversation ${payload.conversationId}`);
    await this._broadcastToConversation(payload.conversationId, REALTIME_EVENTS.MESSAGE_SENT, payload);
  }

  /**
   * Handler: Triggered when an existing message is edited.
   */
  async _handleMessageEdited(payload) {
    logger.debug(`[CHAT_GATEWAY] Broadcasting MESSAGE_EDITED for message ${payload.messageId}`);
    await this._broadcastToConversation(payload.conversationId, REALTIME_EVENTS.MESSAGE_EDITED, payload);
  }

  /**
   * Handler: Triggered when an existing message is soft-deleted or removed.
   */
  async _handleMessageDeleted(payload) {
    logger.debug(`[CHAT_GATEWAY] Broadcasting MESSAGE_DELETED for message ${payload.messageId}`);
    await this._broadcastToConversation(payload.conversationId, REALTIME_EVENTS.MESSAGE_DELETED, payload);
  }

  /**
   * Handler: Triggered by ephemeral typing interactions.
   */
  async _handleTypingStarted(payload) {
    // Avoid noisy logs for ephemeral typing events, use debug level if necessary
    await this._broadcastToConversation(payload.conversationId, REALTIME_EVENTS.TYPING_STARTED, payload);
  }

  /**
   * Handler: Triggered when a user stops typing or after an idle timeout.
   */
  async _handleTypingStopped(payload) {
    await this._broadcastToConversation(payload.conversationId, REALTIME_EVENTS.TYPING_STOPPED, payload);
  }
}

export const chatGateway = new ChatGateway();
