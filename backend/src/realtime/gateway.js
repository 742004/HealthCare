import logger from '../utils/logger.js';

/**
 * ============================================================================
 * REALTIME PROVIDER ADAPTERS
 * Abstracts WebSocket/Realtime logic away from Socket.IO / Firebase / Pusher
 * ============================================================================
 */
export class BaseRealtimeProvider {
  async connect() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
  async emit(event, payload) { throw new Error('Not implemented'); }
  async broadcast(event, payload) { throw new Error('Not implemented'); }
  async joinRoom(socketId, room) { throw new Error('Not implemented'); }
  async leaveRoom(socketId, room) { throw new Error('Not implemented'); }
  async toRoom(room, event, payload) { throw new Error('Not implemented'); }
  async toUser(userId, event, payload) { throw new Error('Not implemented'); }
}

/**
 * Mock implementation used as the default provider before the actual 
 * WebSocket engine (like Socket.IO) is explicitly injected during app startup.
 */
class MockRealtimeProvider extends BaseRealtimeProvider {
  async connect() { logger.debug('[REALTIME_MOCK] Connected'); return true; }
  async disconnect() { logger.debug('[REALTIME_MOCK] Disconnected'); return true; }
  async emit(event, payload) { logger.debug(`[REALTIME_MOCK] Emit: ${event}`); return true; }
  async broadcast(event, payload) { logger.debug(`[REALTIME_MOCK] Broadcast: ${event}`); return true; }
  async joinRoom(socketId, room) { logger.debug(`[REALTIME_MOCK] ${socketId} joined ${room}`); return true; }
  async leaveRoom(socketId, room) { logger.debug(`[REALTIME_MOCK] ${socketId} left ${room}`); return true; }
  async toRoom(room, event, payload) { logger.debug(`[REALTIME_MOCK] toRoom ${room}: ${event}`); return true; }
  async toUser(userId, event, payload) { logger.debug(`[REALTIME_MOCK] toUser ${userId}: ${event}`); return true; }
}

/**
 * Realtime Gateway
 * A pure, provider-agnostic interface for emitting real-time data to clients.
 * Designed to listen to Domain Events (via EventBus) rather than being directly 
 * invoked by business services.
 */
class RealtimeGateway {
  constructor() {
    this.provider = new MockRealtimeProvider();
  }

  /**
   * Inject the active provider at startup (e.g., SocketIOProvider).
   * @param {BaseRealtimeProvider} providerInstance 
   */
  setProvider(providerInstance) {
    if (!(providerInstance instanceof BaseRealtimeProvider)) {
      throw new Error('Provider must extend BaseRealtimeProvider');
    }
    this.provider = providerInstance;
    logger.info('[REALTIME_GATEWAY] Provider successfully injected.');
  }

  async connect() {
    return await this.provider.connect();
  }

  async disconnect() {
    return await this.provider.disconnect();
  }

  /**
   * Emit an event globally to all connected clients.
   */
  async emit(event, payload) {
    try {
      await this.provider.emit(event, payload);
      return true;
    } catch (error) {
      logger.error(`[REALTIME_GATEWAY] Emit failed: ${error.message}`);
      return false; // Fail silently to prevent crashing event flows
    }
  }

  /**
   * Broadcast an event to everyone EXCEPT the sender.
   */
  async broadcast(event, payload) {
    try {
      await this.provider.broadcast(event, payload);
      return true;
    } catch (error) {
      logger.error(`[REALTIME_GATEWAY] Broadcast failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Add a socket to a specific channel/room.
   */
  async joinRoom(socketId, room) {
    try {
      await this.provider.joinRoom(socketId, room);
      return true;
    } catch (error) {
      logger.error(`[REALTIME_GATEWAY] JoinRoom failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove a socket from a specific channel/room.
   */
  async leaveRoom(socketId, room) {
    try {
      await this.provider.leaveRoom(socketId, room);
      return true;
    } catch (error) {
      logger.error(`[REALTIME_GATEWAY] LeaveRoom failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Emit an event exclusively to a specific room (e.g., a specific hospital or chat ID).
   */
  async toRoom(room, event, payload) {
    try {
      await this.provider.toRoom(room, event, payload);
      return true;
    } catch (error) {
      logger.error(`[REALTIME_GATEWAY] ToRoom failed for ${room}: ${error.message}`);
      return false;
    }
  }

  /**
   * Emit an event exclusively to a specific user across all their devices.
   */
  async toUser(userId, event, payload) {
    try {
      await this.provider.toUser(userId, event, payload);
      return true;
    } catch (error) {
      logger.error(`[REALTIME_GATEWAY] ToUser failed for ${userId}: ${error.message}`);
      return false;
    }
  }
}

export const realtimeGateway = new RealtimeGateway();
