import crypto from 'crypto';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  TOKEN_ERROR_CODES
} from './jwt.js';
import { ApiError } from './ApiError.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditService, AUDIT_EVENTS } from '../services/audit.service.js';

class TokenService {
  /**
   * Generates a fresh Access & Refresh token pair and persists the session.
   */
  async createTokenPair(user, metadata = {}) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user); // returns token string
    
    // Decode locally to get JTI and expiry without throwing
    const decoded = verifyRefreshToken(refreshToken);
    
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    await sessionRepository.create({
      jti: decoded.jti,
      user: user._id,
      hashedToken,
      expiresAt: new Date(decoded.exp * 1000),
      metadata
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validates refresh token, handles rotation, and detects reuse.
   */
  async rotateRefreshToken(oldRefreshToken, user, metadata = {}) {
    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token', TOKEN_ERROR_CODES.INVALID);
    }

    const hashedToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    const session = await sessionRepository.findByJti(decoded.jti);

    if (!session) {
      throw new ApiError(401, 'Session not found', TOKEN_ERROR_CODES.REVOKED);
    }

    // Reuse Detection
    if (session.revokedAt) {
      auditService.logEvent(AUDIT_EVENTS.REFRESH_TOKEN_REUSE_DETECTED, user._id, { jti: decoded.jti });
      
      // Revoke all user sessions as a security measure
      await sessionRepository.revokeAllUserSessions(user._id);
      
      // Increment token version to invalidate all access tokens
      await userRepository.incrementTokenVersion(user._id);
      
      throw new ApiError(401, 'Security alert: Token reuse detected. All sessions revoked.', 'REUSE_DETECTED');
    }

    // Verify token hash matches stored hash
    if (session.hashedToken !== hashedToken) {
      throw new ApiError(401, 'Invalid session token', TOKEN_ERROR_CODES.INVALID);
    }

    // Revoke the old token
    await sessionRepository.revokeSession(decoded.jti);
    
    // Issue new pair
    const { accessToken, refreshToken } = await this.createTokenPair(user, metadata);
    
    // Link the old session to the new one
    const newDecoded = verifyRefreshToken(refreshToken);
    await sessionRepository.updateById(session._id, { replacedBy: newDecoded.jti });
    
    auditService.logEvent(AUDIT_EVENTS.TOKEN_REFRESHED, user._id, { jti: newDecoded.jti });
    return { accessToken, refreshToken };
  }

  /**
   * Handles user logout by revoking their current refresh token.
   */
  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const session = await sessionRepository.findByJti(decoded.jti);
      if (session && !session.revokedAt) {
        await sessionRepository.revokeSession(decoded.jti);
      }
    } catch (error) {
      // Ignore invalid/expired during logout
    }
  }

  /**
   * Revokes all active sessions for a user.
   */
  async logoutAllUserTokens(userId) {
    await sessionRepository.revokeAllUserSessions(userId);
    await userRepository.incrementTokenVersion(userId);
  }
}

export const tokenService = new TokenService();
