import logger from '../utils/logger.js';
import { realtimeGateway } from './gateway.js';
import { SocketIOProvider } from './socket.gateway.js';
import { validateHandshake, authenticateSocket } from './middlewares.js';

// Import domain gateways so their EventBus subscriptions initialize
import { emergencyGateway } from './emergency.gateway.js';
import { trackingGateway } from './tracking.js';
import { chatGateway } from './chat.gateway.js';
import { notificationGateway } from './notification.gateway.js';

let activeProvider = null;

/**
 * Bootstraps the entire Realtime networking module.
 * 
 * @param {Object} httpServer - The native Node.js HTTP server instance.
 */
export const initializeRealtime = (httpServer) => {
  try {
    logger.info('[REALTIME_BOOTSTRAP] Initializing Realtime Gateway...');

    // 1. Initialize Socket.IO and the Provider Adapter
    activeProvider = new SocketIOProvider(httpServer);

    // 2. Dependency Injection: Register the provider inside the abstract gateway
    realtimeGateway.setProvider(activeProvider);

    // 3. Register global authentication middlewares on the Socket.IO instance
    activeProvider.io.use(validateHandshake());
    activeProvider.io.use(authenticateSocket());

    // 4. Initialize Rooms and Presence listeners (delegated inside connection events)
    _initializeRooms(activeProvider.io);
    _initializePresence(activeProvider.io);

    // 5. Connect the provider (starts accepting traffic)
    realtimeGateway.connect();

    // 6. Register graceful shutdown hooks
    _registerShutdownHooks();

    logger.info('[REALTIME_BOOTSTRAP] Realtime Gateway successfully booted and connected to EventBus.');
  } catch (error) {
    logger.error(`[REALTIME_BOOTSTRAP] Failed to initialize: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Sets up room joining/leaving logic for authenticated sockets.
 * @private
 */
const _initializeRooms = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', (room) => {
      logger.debug(`[REALTIME_ROOMS] Socket ${socket.id} joined ${room}`);
      socket.join(room);
    });
    
    socket.on('leave_room', (room) => {
      logger.debug(`[REALTIME_ROOMS] Socket ${socket.id} left ${room}`);
      socket.leave(room);
    });
  });
};

/**
 * Sets up presence tracking (online/offline status).
 * @private
 */
const _initializePresence = (io) => {
  io.on('connection', (socket) => {
    // Optionally publish a USER_ONLINE event to the EventBus here
    
    socket.on('disconnect', () => {
      // Optionally publish a USER_OFFLINE event to the EventBus here
      logger.debug(`[REALTIME_PRESENCE] User ${socket.user?._id || 'unknown'} went offline.`);
    });
  });
};

/**
 * Registers OS-level signal handlers to ensure active WebSockets are disconnected 
 * securely before the Node process dies.
 * @private
 */
const _registerShutdownHooks = () => {
  const shutdown = async (signal) => {
    logger.warn(`[REALTIME_SHUTDOWN] Received ${signal}. Gracefully closing WebSockets...`);
    
    if (activeProvider) {
      await activeProvider.disconnect();
    }
    
    // In a fully flushed out implementation, you would also call eventBus.unsubscribeAll() here
    logger.info('[REALTIME_SHUTDOWN] WebSockets closed. Ready for process exit.');
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};
