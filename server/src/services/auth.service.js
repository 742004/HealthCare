import crypto from 'crypto';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { tokenService } from '../utils/token.service.js';
import { verifyFirebaseToken } from '../utils/firebaseAdmin.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { smsService } from '../utils/sendSMS.js';
import logger from '../utils/logger.js';
import { VALIDATION_CONSTANTS } from '../utils/constants.js';
import { generateOTP } from '../utils/helpers.js';

import User from '../models/User.js';
import Patient from '../models/Patient.js';

/**
 * ============================================================================
 * REPOSITORY PLACEHOLDER REPLACED WITH REAL MONGOOSE CALLS
 * ============================================================================
 */
const AuthRepository = {
  findUserByEmailOrPhone: async (email, phone, session = null) => {
    return await User.findOne({ $or: [{ email }, { phone }] }).session(session);
  },
  findUserByEmailWithPassword: async (email, session = null) => {
    return await User.findOne({ email }).select('+password').session(session);
  },
  findUserById: async (id, session = null) => {
    return await User.findById(id).session(session);
  },
  findUserByPhone: async (phone, session = null) => {
    return await User.findOne({ phone }).session(session);
  },
  findUserByResetToken: async (token, session = null) => {
    return await User.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } }).session(session);
  },
  findUserByFirebaseOrEmail: async (uid, email, session = null) => {
    return await User.findOne({ $or: [{ firebaseUid: uid }, { email }] }).session(session);
  },
  createUser: async (userData, session = null) => {
    // Create the User document
    const users = await User.create([userData], { session });
    const user = users[0];

    // If role is patient, also create Patient document
    if (user.role === 'patient') {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - (userData.age || 0));
      
      const emergencyContacts = [];
      if (userData.contact) {
        emergencyContacts.push({
          name: 'Emergency Contact',
          phone: userData.contact,
          relation: 'Unknown'
        });
      }

      await Patient.create([{
        user: user._id,
        dateOfBirth: dob,
        bloodGroup: userData.blood || 'O+',
        gender: 'Other', // default as it's not in the reg form
        emergencyContacts: emergencyContacts
      }], { session });
    }
    
    return user;
  },
  saveUser: async (userDoc, session = null) => {
    return await userDoc.save({ session });
  },
};

/**
 * Authentication Service
 * Pure business logic handling user identity, transactions, and audit logs.
 */
class AuthService {
  /**
   * Registers a new user with transactional safety.
   * @param {Object} userData - Data for the new user.
   * @returns {Promise<Object>} Object containing plain user data and auth tokens.
   */
  async registerUser(userData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const existingUser = await AuthRepository.findUserByEmailOrPhone(userData.email, userData.phone, session);
      if (existingUser) {
        throw new ApiError(409, 'User with this email or phone number already exists', 'USER_EXISTS');
      }

      const user = await AuthRepository.createUser(userData, session);
      
      const verificationToken = user.generateEmailVerificationToken();
      await AuthRepository.saveUser(user, session);

      // Audit Log
      logger.info(`[AUDIT] User Registered: ${user._id} | Email: ${user.email}`);

      await session.commitTransaction();
      session.endSession();

      // Non-blocking email dispatch
      try {
        const verifyUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
        await sendVerificationEmail(user.email, verifyUrl);
      } catch (err) {
        logger.error(`Failed to send verification email for ${user._id}`);
      }

      const tokens = await tokenService.createTokenPair(user);
      return { user: user.toObject(), tokens };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Authenticates a user via Email & Password.
   * @param {string} email - User's email.
   * @param {string} password - User's plain text password.
   * @returns {Promise<Object>} Object containing plain user data and auth tokens.
   */
  async loginUser(email, password) {
    const user = await AuthRepository.findUserByEmailWithPassword(email);
    if (!user) {
      logger.warn(`[AUDIT] Login Failed (User Not Found): ${email}`);
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.isLocked) {
      logger.warn(`[AUDIT] Login Failed (Account Locked): ${user._id}`);
      throw new ApiError(403, 'Account is locked. Contact support.', 'ACCOUNT_LOCKED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`[AUDIT] Login Failed (Wrong Password): ${user._id}`);
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      logger.warn(`[AUDIT] Login Failed (Account Disabled): ${user._id}`);
      throw new ApiError(403, 'Account is disabled.', 'ACCOUNT_DISABLED');
    }

    logger.info(`[AUDIT] Login Success: ${user._id}`);
    const tokens = await tokenService.createTokenPair(user);
    
    return { user: user.toObject(), tokens };
  }

  /**
   * Rotates a refresh token.
   * @param {string} oldRefreshToken - The existing refresh token.
   * @returns {Promise<Object>} New tokens pair.
   */
  async refreshAuthToken(oldRefreshToken) {
    const decoded = await tokenService.validateRefreshToken(oldRefreshToken);
    const user = await AuthRepository.findUserById(decoded.id);
    
    if (!user || !user.isActive || user.tokenVersion !== decoded.tokenVersion) {
      throw new ApiError(401, 'Session revoked or invalid', 'TOKEN_REVOKED');
    }

    return await tokenService.rotateRefreshToken(oldRefreshToken, user);
  }

  /**
   * Logs a user out by revoking their current refresh token.
   * @param {string} refreshToken - The active refresh token.
   * @returns {Promise<boolean>} Success status.
   */
  async logout(refreshToken) {
    if (refreshToken) await tokenService.logout(refreshToken);
    logger.info(`[AUDIT] Logout`);
    return true;
  }

  /**
   * Revokes all active sessions globally for a user.
   * @param {string} userId - ID of the user.
   * @returns {Promise<boolean>} Success status.
   */
  async logoutAllDevices(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await AuthRepository.findUserById(userId, session);
      if (!user) throw new ApiError(404, 'User not found');

      user.tokenVersion += 1;
      await AuthRepository.saveUser(user, session);
      
      logger.info(`[AUDIT] Logout All Devices: ${userId}`);
      
      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Generates and emails a password reset link safely.
   * @param {string} email - User's email.
   * @returns {Promise<boolean>} Always returns true to prevent enumeration.
   */
  async forgotPassword(email) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const user = await AuthRepository.findUserByEmail(email, session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return true; 
      }

      const resetToken = user.generatePasswordResetToken();
      await AuthRepository.saveUser(user, session);

      try {
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetUrl);
        logger.info(`[AUDIT] Password Reset Requested: ${user._id}`);
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await AuthRepository.saveUser(user, session);
        throw new ApiError(500, 'Could not send email');
      }

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Resets a user's password using a valid token.
   * @param {string} token - The raw reset token.
   * @param {string} newPassword - The new password string.
   * @returns {Promise<boolean>} Success status.
   */
  async resetPassword(token, newPassword) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const user = await AuthRepository.findUserByResetToken(hashedToken, session);

      if (!user) throw new ApiError(400, 'Invalid or expired token', 'INVALID_TOKEN');

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.tokenVersion += 1; // Revoke old sessions
      
      await AuthRepository.saveUser(user, session);
      logger.info(`[AUDIT] Password Reset Completed: ${user._id}`);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Generates a phone OTP.
   * @param {string} phone - User's phone number.
   * @returns {Promise<boolean>} Success status.
   */
  async generatePhoneOTP(phone) {
    const user = await AuthRepository.findUserByPhone(phone);
    if (!user) throw new ApiError(404, 'User not found');

    const otp = generateOTP(VALIDATION_CONSTANTS.OTP_LENGTH);
    await smsService.sendOTP(phone, otp, VALIDATION_CONSTANTS.OTP_EXPIRY_MINUTES);
    
    logger.info(`[AUDIT] Phone OTP Requested: ${user._id}`);
    return true;
  }

  /**
   * Single Sign-On and Registration via Firebase Auth.
   * @param {string} firebaseIdToken - JWT generated by Firebase on the frontend.
   * @returns {Promise<Object>} User data and auth tokens.
   */
  async verifyFirebaseAndLogin(firebaseIdToken) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const decoded = await verifyFirebaseToken(firebaseIdToken);
      let user = await AuthRepository.findUserByFirebaseOrEmail(decoded.uid, decoded.email, session);

      if (!user) {
        user = await AuthRepository.createUser({
          name: decoded.name || 'Firebase User',
          email: decoded.email,
          phone: decoded.phone_number,
          firebaseUid: decoded.uid,
          isEmailVerified: decoded.email_verified || false,
          password: crypto.randomBytes(20).toString('hex'),
        }, session);
        logger.info(`[AUDIT] User Registered via Firebase: ${user._id}`);
      } else if (!user.firebaseUid) {
        user.firebaseUid = decoded.uid;
        await AuthRepository.saveUser(user, session);
        logger.info(`[AUDIT] Account Linked to Firebase: ${user._id}`);
      }

      await session.commitTransaction();
      session.endSession();

      const tokens = await tokenService.createTokenPair(user);
      logger.info(`[AUDIT] Login Success (Firebase): ${user._id}`);
      
      return { user: user.toObject(), tokens };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export const authService = new AuthService();
