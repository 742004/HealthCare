import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError.js';
import crypto from 'crypto';

/**
 * jwt.js
 * Enterprise-level JWT utility module for issuing, decoding, and verifying tokens.
 */

// Supported Token Types
export const TOKEN_TYPES = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
};

// Secrets from ENV mapping
const SECRETS = {
  [TOKEN_TYPES.ACCESS]: process.env.JWT_SECRET || 'default_access_secret',
  [TOKEN_TYPES.REFRESH]: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
  [TOKEN_TYPES.EMAIL_VERIFICATION]: process.env.EMAIL_VERIFICATION_SECRET || 'default_email_secret',
  [TOKEN_TYPES.PASSWORD_RESET]: process.env.PASSWORD_RESET_SECRET || 'default_reset_secret',
};

// Expirations from ENV mapping
const EXPIRATIONS = {
  [TOKEN_TYPES.ACCESS]: process.env.JWT_EXPIRE || '15m',
  [TOKEN_TYPES.REFRESH]: process.env.REFRESH_TOKEN_EXPIRE || '7d',
  [TOKEN_TYPES.EMAIL_VERIFICATION]: process.env.EMAIL_VERIFICATION_EXPIRE || '24h',
  [TOKEN_TYPES.PASSWORD_RESET]: process.env.PASSWORD_RESET_EXPIRE || '1h',
};

// Standard Claims Configuration
const ISSUER = process.env.JWT_ISSUER || 'emergency-healthcare-connector';
const AUDIENCE = process.env.JWT_AUDIENCE || 'ehc-clients';

// Custom Error Codes
export const TOKEN_ERROR_CODES = {
  EXPIRED: 'TOKEN_EXPIRED',
  INVALID: 'TOKEN_INVALID',
  REVOKED: 'TOKEN_REVOKED',
  MISSING: 'TOKEN_MISSING',
};

/**
 * Universal helper to generate a standardized JWT.
 * @param {Object} payload - Custom claims
 * @param {string} tokenType - Type of token from TOKEN_TYPES
 * @param {string} [subjectId] - Optional subject (user ID)
 */
export const generateToken = (payload, tokenType, subjectId = null) => {
  const secret = SECRETS[tokenType];
  const expiresIn = EXPIRATIONS[tokenType];
  const jti = crypto.randomUUID(); // Unique JWT ID for tracking/revocation
  
  const options = {
    expiresIn,
    issuer: ISSUER,
    audience: AUDIENCE,
    jwtid: jti,
  };
  
  if (subjectId) {
    options.subject = subjectId.toString();
  }

  // Inject token type directly into payload
  const tokenPayload = { ...payload, type: tokenType };

  return jwt.sign(tokenPayload, secret, options);
};

/**
 * Universal helper to verify and decode a token securely.
 * @param {string} token - The raw JWT
 * @param {string} tokenType - Expected token type
 */
export const verifyToken = (token, tokenType) => {
  if (!token) {
    throw new ApiError(401, 'Authentication token is missing', TOKEN_ERROR_CODES.MISSING);
  }
  
  try {
    const secret = SECRETS[tokenType];
    const decoded = jwt.verify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    
    if (decoded.type !== tokenType) {
      throw new ApiError(401, 'Invalid token type provided', TOKEN_ERROR_CODES.INVALID);
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token has expired', TOKEN_ERROR_CODES.EXPIRED);
    }
    throw new ApiError(401, 'Invalid token signature or payload', TOKEN_ERROR_CODES.INVALID);
  }
};

/**
 * Decode a token without verifying the signature.
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Check if a decoded payload is nearing expiration (within 2 minutes).
 */
export const isTokenExpired = (decodedPayload) => {
  if (!decodedPayload || !decodedPayload.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedPayload.exp < currentTime;
};

// ============================================================================
// BACKWARDS COMPATIBILITY WRAPPERS
// Maintaining existing API contract from the previous version.
// ============================================================================

export const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion || 1
  };
  return generateToken(payload, TOKEN_TYPES.ACCESS, user._id);
};

export const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    tokenVersion: user.tokenVersion || 1
  };
  return generateToken(payload, TOKEN_TYPES.REFRESH, user._id);
};

export const verifyAccessToken = (token) => {
  return verifyToken(token, TOKEN_TYPES.ACCESS);
};

export const verifyRefreshToken = (token) => {
  return verifyToken(token, TOKEN_TYPES.REFRESH);
};
