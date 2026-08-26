import { jest } from '@jest/globals';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { authService } from '../../src/services/auth.service.js';
import { tokenService } from '../../src/utils/token.service.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { patientRepository } from '../../src/repositories/patient.repository.js';
import { sessionRepository } from '../../src/repositories/session.repository.js';

jest.mock('../../src/utils/sendEmail.js', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

describe('Auth Service & Session Management', () => {
  beforeAll(async () => {
    await userRepository.model.createCollection();
    await patientRepository.model.createCollection();
    await sessionRepository.model.createCollection();
  });

  beforeEach(async () => {
    await userRepository.model.deleteMany({});
    await patientRepository.model.deleteMany({});
    await sessionRepository.model.deleteMany({});
  });

  const validUserData = {
    name: 'Test Patient',
    email: 'patient@test.com',
    password: 'password12345',
    phone: '1234567890',
    role: 'patient',
    age: 30,
    blood: 'O+',
    contact: '0987654321'
  };

  describe('Registration & Transactions', () => {
    it('should register a patient and create profile securely', async () => {
      const { user, tokens } = await authService.registerUser(validUserData, { ip: '127.0.0.1' });
      
      expect(user.email).toBe(validUserData.email);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      // Ensure Patient profile created
      const patient = await patientRepository.findOne({ user: user._id });
      expect(patient).toBeDefined();
      expect(patient.bloodGroup).toBe('O+');

      // Ensure Session created
      const sessions = await sessionRepository.find({ user: user._id });
      expect(sessions.length).toBe(1);
      expect(sessions[0].metadata.ip).toBe('127.0.0.1');
    });

    it('should rollback if patient creation fails', async () => {
      // Intentionally cause failure to test transaction rollback
      const badData = { ...validUserData, email: 'rollback@test.com', role: 'invalid_role' };
      
      await expect(authService.registerUser(badData)).rejects.toThrow();

      // User should not exist because of rollback
      const user = await userRepository.findOne({ email: 'rollback@test.com' });
      expect(user).toBeNull();
    });

    it('should prevent duplicate registration', async () => {
      await authService.registerUser(validUserData);
      await expect(authService.registerUser(validUserData)).rejects.toThrow('User with this email or phone number already exists');
    });
  });

  describe('Login & Security Constraints', () => {
    beforeEach(async () => {
      await authService.registerUser(validUserData);
    });

    it('should login with valid credentials', async () => {
      const { tokens } = await authService.loginUser(validUserData.email, validUserData.password);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      await expect(authService.loginUser(validUserData.email, 'wrongpass')).rejects.toThrow('Invalid email or password');
    });

    it('should block login if account is locked', async () => {
      await userRepository.model.updateOne({ email: validUserData.email }, { isLocked: true });
      await expect(authService.loginUser(validUserData.email, validUserData.password)).rejects.toThrow('Account is locked. Contact support.');
    });
  });

  describe('Refresh Token Rotation & Reuse Detection', () => {
    let tokens, user;

    beforeEach(async () => {
      const res = await authService.registerUser(validUserData);
      tokens = res.tokens;
      user = res.user;
    });

    it('should rotate token and invalidate old one', async () => {
      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);

      // Old token should be marked as revoked
      await expect(authService.refreshAccessToken(tokens.refreshToken)).rejects.toThrow('Security alert: Token reuse detected. All sessions revoked.');
    });

    it('should revoke ALL sessions on reuse detection', async () => {
      // 1. Rotate successfully
      await authService.refreshAccessToken(tokens.refreshToken);

      // 2. Attempt to use old token again (REUSE DETECTION)
      await expect(authService.refreshAccessToken(tokens.refreshToken)).rejects.toThrow();

      // 3. User tokenVersion should have been incremented (logout all)
      const updatedUser = await userRepository.findById(user._id);
      expect(updatedUser.tokenVersion).toBeGreaterThan(0);

      // 4. All sessions should be revoked
      const activeSessions = await sessionRepository.find({ user: user._id, revokedAt: null });
      expect(activeSessions.length).toBe(0);
    });
  });

  describe('Logout & Session Management', () => {
    it('should revoke specific session on logout', async () => {
      const { tokens, user } = await authService.registerUser(validUserData);
      await authService.logout(tokens.refreshToken);

      const activeSessions = await sessionRepository.find({ user: user._id, revokedAt: null });
      expect(activeSessions.length).toBe(0);
    });

    it('should revoke all sessions on logoutAllDevices', async () => {
      const { user } = await authService.registerUser(validUserData);
      
      // Simulate multiple logins
      await authService.loginUser(validUserData.email, validUserData.password);
      await authService.loginUser(validUserData.email, validUserData.password);

      let activeSessions = await sessionRepository.find({ user: user._id, revokedAt: null });
      expect(activeSessions.length).toBe(3); // Reg + 2 logins

      await authService.logoutAllDevices(user._id);
      
      activeSessions = await sessionRepository.find({ user: user._id, revokedAt: null });
      expect(activeSessions.length).toBe(0);
    });
  });

  describe('Password Reset', () => {
    it('should handle full password reset flow', async () => {
      const { user } = await authService.registerUser(validUserData);
      
      // 1. Request reset
      await authService.generatePasswordReset(validUserData.email);
      const dbUser = await userRepository.findById(user._id);
      expect(dbUser.resetPasswordToken).toBeDefined();

      // Since we don't have the plaintext token from the email, we'll manually set one for testing
      const plainToken = 'test-reset-token';

      const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
      
      dbUser.resetPasswordToken = hashedToken;
      dbUser.resetPasswordExpire = Date.now() + 10000;
      await dbUser.save();

      // 2. Complete reset
      await authService.resetPassword(plainToken, 'newpassword12345');

      // 3. Verify changes
      const updatedUser = await userRepository.findById(user._id);
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.tokenVersion).toBeGreaterThan(dbUser.tokenVersion);

      // 4. Login with new password
      const { tokens } = await authService.loginUser(validUserData.email, 'newpassword12345');
      expect(tokens.accessToken).toBeDefined();
    });
  });

  describe('Account Management & Audit Events', () => {
    let user;

    beforeEach(async () => {
      const res = await authService.registerUser(validUserData);
      user = res.user;
    });

    it('should change password successfully and revoke sessions', async () => {
      await authService.changePassword(user._id, validUserData.password, 'NewPassword123!');
      const updatedUser = await userRepository.findById(user._id);
      expect(updatedUser.tokenVersion).toBeGreaterThan(user.tokenVersion);
    });

    it('should lock account and revoke sessions', async () => {
      await authService.lockAccount(user._id);
      const updatedUser = await userRepository.findById(user._id);
      expect(updatedUser.isLocked).toBe(true);
    });

    it('should unlock account', async () => {
      await authService.unlockAccount(user._id);
      const updatedUser = await userRepository.findById(user._id);
      expect(updatedUser.isLocked).toBe(false);
    });

    it('should change user role and revoke sessions', async () => {
      await authService.changeRole(user._id, 'admin');
      const updatedUser = await userRepository.findById(user._id);
      expect(updatedUser.role).toBe('admin');
    });
  });
});
