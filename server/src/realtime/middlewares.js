import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Validates the initial Socket.IO handshake to ensure basic structural integrity
 * before attempting any expensive cryptographic JWT verification.
 * 
 * @returns {Function} Socket.IO middleware function
 */
export const validateHandshake = () => {
  return (socket, next) => {
    // Ensure the auth object exists
    if (!socket.handshake || !socket.handshake.auth) {
      logger.warn(`[SOCKET_AUTH] Handshake failed: Missing auth object from ${socket.id}`);
      return next(new Error('Authentication Error: Handshake missing auth payload'));
    }

    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn(`[SOCKET_AUTH] Handshake failed: No token provided by ${socket.id}`);
      return next(new Error('Authentication Error: Token missing'));
    }

    // Pass to the next middleware (usually authenticateSocket)
    next();
  };
};

/**
 * Authenticates a Socket.IO connection by verifying the provided JWT access token.
 * If valid, the decoded user payload is attached to `socket.user`.
 * 
 * @returns {Function} Socket.IO middleware function
 */
export const authenticateSocket = () => {
  return (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      // Ensure JWT secret matches the one used in the REST API authentication
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');

      // Attach the decoded JWT payload securely to the socket instance for future event authorizations
      socket.user = {
        _id: decoded.id || decoded._id,
        role: decoded.role,
        jti: decoded.jti // Used if you implement token blacklisting/revocation over websockets
      };

      logger.debug(`[SOCKET_AUTH] Client ${socket.id} authenticated successfully as User ${socket.user._id}`);
      next();
    } catch (error) {
      // Differentiate between expired tokens vs totally invalid/tampered tokens
      if (error.name === 'TokenExpiredError') {
        logger.warn(`[SOCKET_AUTH] Client ${socket.id} attempted connection with EXPIRED token.`);
        return next(new Error('Authentication Error: Token expired. Please refresh.'));
      }
      
      logger.warn(`[SOCKET_AUTH] Client ${socket.id} attempted connection with INVALID token: ${error.message}`);
      return next(new Error('Authentication Error: Invalid token'));
    }
  };
};

/**
 * Authorizes specific events based on the user's role.
 * Unlike Express middlewares which apply globally to a route, this is designed 
 * to be wrapped around specific socket.on('event') listeners.
 * 
 * @param {...string} allowedRoles - Spread array of roles permitted to execute the action.
 * @returns {Function} A wrapper function validating the role before executing the callback.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (socket, next) => {
    // If no specific roles are required, allow passage
    if (allowedRoles.length === 0) {
      return next();
    }

    const userRole = socket.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      logger.warn(`[SOCKET_AUTH] Authorization Denied for ${socket.id}. Role '${userRole}' not in [${allowedRoles.join(',')}]`);
      return next(new Error('Authorization Error: Insufficient permissions for this action'));
    }

    next();
  };
};
