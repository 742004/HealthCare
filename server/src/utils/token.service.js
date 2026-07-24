import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  TOKEN_TYPES, 
  TOKEN_ERROR_CODES 
} from './jwt.js';
import { ApiError } from './ApiError.js';

/**
 * In-memory token blacklist for mock implementation.
 * In a production environment, this MUST be replaced by Redis.
 * Structure: Set(['jti_uuid1', 'jti_uuid2'])
 */
const tokenBlacklist = new Set();

class TokenService {
  /**
   * Generates a fresh Access & Refresh token pair.
   * @param {Object} user - The mongoose user document
   * @returns {Object} Object containing both tokens
   */
  async createTokenPair(user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Validates the refresh token and ensures it hasn't been revoked.
   * @param {string} token 
   * @returns {Object} Decoded payload
   */
  async validateRefreshToken(token) {
    const decoded = verifyRefreshToken(token);

    // Check against mock blacklist (Redis in future)
    if (tokenBlacklist.has(decoded.jti)) {
      throw new ApiError(401, 'Token has been revoked', TOKEN_ERROR_CODES.REVOKED);
    }
    
    return decoded;
  }

  /**
   * Validates an old refresh token, revokes it, and issues a completely new pair.
   * @param {string} oldRefreshToken 
   * @param {Object} user - The mongoose user document needed to stamp the new payload
   * @returns {Object} New token pair
   */
  async rotateRefreshToken(oldRefreshToken, user) {
    // 1. Validate the old token
    const decoded = await this.validateRefreshToken(oldRefreshToken);
    
    // 2. Revoke the old token (burn it after use)
    await this.revokeRefreshToken(decoded.jti);

    // 3. Issue new pair
    return this.createTokenPair(user);
  }

  /**
   * Adds a token's JTI to the blacklist to prevent future use.
   * @param {string} jti - JWT ID to revoke
   */
  async revokeRefreshToken(jti) {
    tokenBlacklist.add(jti);
    // Future: redisClient.setex(`blacklist:${jti}`, REFRESH_TOKEN_EXPIRE_SECONDS, 'true');
    return true;
  }

  /**
   * Revokes all refresh tokens for a user by blacklisting or 
   * via tokenVersion increment inside the database.
   * @param {string} userId 
   */
  async revokeAllUserTokens(userId) {
    // In a DB approach, we would update User.tokenVersion++ in MongoDB.
    // That instantly invalidates ALL existing tokens because the versions won't match.
    // For now, this is a mock interface.
    return true;
  }

  /**
   * Handles user logout by revoking their current refresh token.
   * @param {string} refreshToken 
   */
  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await this.revokeRefreshToken(decoded.jti);
    } catch (error) {
      // If token is already invalid/expired during logout, gracefully ignore.
      console.log('Logout executed with already invalid token');
    }
  }
}

export const tokenService = new TokenService();
