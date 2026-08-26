import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import { BaseRealtimeProvider } from './gateway.js';

/**
 * Socket.IO Implementation of the Realtime Provider Adapter.
 * Connects the abstract RealtimeGateway directly to the Socket.IO networking engine.
 */
export class SocketIOProvider extends BaseRealtimeProvider {
  /**
   * Initializes the Socket.IO server and binds it to the provided HTTP server.
   * @param {Object} httpServer - The core Node.js/Express HTTP server instance.
   */
  constructor(httpServer) {
    super();
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // In production, this must be restricted to valid domains
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this._initializeMiddlewares();
    this._initializeListeners();
  }

  /**
   * Register Socket.IO specific authentication and validation middlewares.
   * @private
   */
  _initializeMiddlewares() {
    this.io.use((socket, next) => {
      // Placeholder for JWT authentication logic.
      // E.g. extract token from socket.handshake.auth.token
      // Verify token, attach decoded user to socket.user, and call next()
      const token = socket.handshake.auth?.token;
      if (!token) {
        logger.warn(`[SOCKET] Unauthorized connection attempt from ${socket.id}`);
        return next(new Error('Authentication Error'));
      }
      
      // Mocking successful auth injection
      socket.user = { id: 'mock-user-id', role: 'PATIENT' };
      next();
    });
  }

  /**
   * Register the root connection lifecycle listeners.
   * @private
   */
  _initializeListeners() {
    this.io.on('connection', (socket) => {
      logger.info(`[SOCKET] Client connected: ${socket.id} (User: ${socket.user?.id})`);

      // Automatically join a personal room based on User ID for targeted toUser() emissions
      if (socket.user?.id) {
        socket.join(`user:${socket.user.id}`);
      }

      // Delegate specific domain events to sub-gateways/handlers (Placeholders)
      // e.g. import { registerChatHandlers } from './chat.gateway.js';
      // registerChatHandlers(this.io, socket);
      
      this._registerDelegates(socket);

      socket.on('disconnect', (reason) => {
        logger.info(`[SOCKET] Client disconnected: ${socket.id} - Reason: ${reason}`);
        // Presence updates and cleanup logic delegated to presence handlers
      });
      
      socket.on('error', (err) => {
        logger.error(`[SOCKET] Connection error on ${socket.id}: ${err.message}`);
      });
    });
  }

  /**
   * Placeholder to map domain-specific socket handlers.
   * Keeps this file clean from domain logic.
   * @private
   */
  _registerDelegates(socket) {
    // rooms.js delegation
    socket.on('join_room', (room) => this.joinRoom(socket.id, room));
    socket.on('leave_room', (room) => this.leaveRoom(socket.id, room));

    // presence.js, chat.gateway.js, emergency.gateway.js, notification.gateway.js
    // logic will be mapped here as those files are created.
  }

  /**
   * ============================================================================
   * IMPLEMENTATION OF BaseRealtimeProvider INTERFACE
   * ============================================================================
   */

  async connect() {
    logger.info('[SOCKET] Socket.IO engine initialized and ready to accept connections.');
    return true;
  }

  async disconnect() {
    return new Promise((resolve) => {
      this.io.close(() => {
        logger.info('[SOCKET] Socket.IO engine successfully closed.');
        resolve(true);
      });
    });
  }

  async emit(event, payload) {
    this.io.emit(event, payload);
    return true;
  }

  async broadcast(event, payload) {
    // Note: To broadcast from server to everyone except sender requires the specific socket context.
    // If called globally from server, it acts identical to emit.
    this.io.emit(event, payload);
    return true;
  }

  async joinRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
      return true;
    }
    throw new Error(`Socket ${socketId} not found`);
  }

  async leaveRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(room);
      return true;
    }
    throw new Error(`Socket ${socketId} not found`);
  }

  async toRoom(room, event, payload) {
    this.io.to(room).emit(event, payload);
    return true;
  }

  async toUser(userId, event, payload) {
    // Emit specifically to the user's personal channel (which spans all their devices)
    this.io.to(`user:${userId}`).emit(event, payload);
    return true;
  }
}
