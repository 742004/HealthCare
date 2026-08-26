import logger from '../utils/logger.js';

export const AUDIT_EVENTS = {
  USER_REGISTERED: 'USER_REGISTERED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  ROLE_CHANGED: 'ROLE_CHANGED'
};

class AuditService {
  /**
   * Logs a security or identity event without leaking secrets.
   * @param {string} event - The audit event constant
   * @param {string} userId - The affected user ID (if available)
   * @param {Object} metadata - Additional safe context (IP, action, reason)
   */
  logEvent(event, userId = 'UNKNOWN', metadata = {}) {
    // Sanitize metadata to prevent accidental secret logging
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.token;
    delete safeMetadata.refreshToken;
    delete safeMetadata.accessToken;
    delete safeMetadata.resetToken;
    delete safeMetadata.jti;

    logger.info(`[AUDIT] [${event}] User: ${userId}`, safeMetadata);
  }
}

export const auditService = new AuditService();
