import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as authValidation from '../validations/auth.validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * ============================================================================
 * PUBLIC ROUTES (No Authentication Required)
 * ============================================================================
 */

router.post(
  '/register',
  authLimiter,
  validate(authValidation.registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidation.loginSchema),
  authController.login
);

router.post(
  '/refresh-token',
  validate(authValidation.refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/verify-email',
  authLimiter,
  validate(authValidation.verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(authValidation.resetPasswordSchema),
  authController.resetPassword
);

/**
 * ============================================================================
 * PROTECTED ROUTES (Requires valid Access Token)
 * ============================================================================
 */

// Apply authentication middleware to all routes below this point
router.use(authenticate);

router.post(
  '/logout',
  authController.logout
);

router.post(
  '/logout-all',
  authController.logoutAll
);

router.post(
  '/verify-phone',
  validate(authValidation.verifyPhoneSchema),
  authController.verifyPhone
);

router.patch(
  '/change-password',
  validate(authValidation.changePasswordSchema),
  authController.changePassword
);

router.get(
  '/me',
  authController.getCurrentUser
);

router.patch(
  '/profile',
  validate(authValidation.updateProfileSchema),
  authController.updateProfile
);

export default router;
