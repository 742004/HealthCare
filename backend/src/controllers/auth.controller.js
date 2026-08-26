import { BaseController } from '../core/BaseController.js';
import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js'; // Optionally used if direct instantiation is needed

/**
 * Authentication Controller
 * Pure HTTP adapter for routing authentication requests to the Auth Service.
 */
class AuthController extends BaseController {
  constructor() {
    super(authService);
  }

  /**
   * Register a new user.
   * Route: POST /api/v1/auth/register
   */
  register = this.execute(async (req, res) => {
    // Validation is handled by Zod middleware prior to reaching here
    const user = await this.service.registerUser(req.body);
    return this.sendCreated(res, user, 'User registered successfully');
  });

  /**
   * Login user and issue tokens.
   * Route: POST /api/v1/auth/login
   */
  login = this.execute(async (req, res) => {
    const { email, password, fcmToken, deviceInfo } = req.body;
    
    // IP and User-Agent can be extracted from Express req for auditing inside the service
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'], fcmToken, deviceInfo };
    
    const result = await this.service.loginUser(email, password, meta);
    return this.sendSuccess(res, 200, result, 'Login successful');
  });

  logout = this.execute(async (req, res) => {
    const { refreshToken } = req.body;
    await this.service.logout(refreshToken);
    return this.sendSuccess(res, 200, null, 'Logged out successfully');
  });

  /**
   * Logout all devices (increments token version).
   * Route: POST /api/v1/auth/logout-all
   */
  logoutAll = this.execute(async (req, res) => {
    await this.service.logoutAllDevices(req.user._id);
    return this.sendSuccess(res, 200, null, 'Logged out of all devices successfully');
  });

  refreshToken = this.execute(async (req, res) => {
    const { refreshToken } = req.body;
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await this.service.refreshAccessToken(refreshToken, meta);
    return this.sendSuccess(res, 200, result, 'Token refreshed successfully');
  });

  /**
   * Verify email via token.
   * Route: POST /api/v1/auth/verify-email
   */
  verifyEmail = this.execute(async (req, res) => {
    const { token } = req.body;
    await this.service.verifyEmail(token);
    return this.sendSuccess(res, 200, null, 'Email verified successfully');
  });

  /**
   * Verify phone via OTP.
   * Route: POST /api/v1/auth/verify-phone
   */
  verifyPhone = this.execute(async (req, res) => {
    const { phone, otp } = req.body;
    await this.service.verifyPhoneOTP(phone, otp);
    return this.sendSuccess(res, 200, null, 'Phone verified successfully');
  });

  /**
   * Initiate forgot password flow.
   * Route: POST /api/v1/auth/forgot-password
   */
  forgotPassword = this.execute(async (req, res) => {
    const { email } = req.body;
    await this.service.generatePasswordReset(email);
    return this.sendSuccess(res, 200, null, 'Password reset instructions sent');
  });

  /**
   * Reset password using token.
   * Route: POST /api/v1/auth/reset-password
   */
  resetPassword = this.execute(async (req, res) => {
    const { token, newPassword } = req.body;
    await this.service.resetPassword(token, newPassword);
    return this.sendSuccess(res, 200, null, 'Password reset successfully');
  });

  /**
   * Change password while authenticated.
   * Route: PATCH /api/v1/auth/change-password
   */
  changePassword = this.execute(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await this.service.changePassword(req.user._id, oldPassword, newPassword);
    return this.sendSuccess(res, 200, null, 'Password changed successfully');
  });

  /**
   * Get current authenticated user profile.
   * Route: GET /api/v1/auth/me
   */
  getCurrentUser = this.execute(async (req, res) => {
    // Assuming auth middleware attaches full user object to req.user
    const user = await this.service.getUserProfile(req.user._id);
    return this.sendSuccess(res, 200, user, 'User profile retrieved');
  });

  /**
   * Update current authenticated user basic profile.
   * Route: PATCH /api/v1/auth/me
   */
  updateProfile = this.execute(async (req, res) => {
    const updatedUser = await this.service.updateUserProfile(req.user._id, req.body);
    return this.sendSuccess(res, 200, updatedUser, 'Profile updated successfully');
  });
}

export const authController = new AuthController();
