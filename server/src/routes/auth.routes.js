import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as authValidation from '../validations/auth.validation.js';

const router = Router();

/**
 * ============================================================================
 * PUBLIC ROUTES (No Authentication Required)
 * ============================================================================
 */

router.post(
  '/register',
  validate(authValidation.registerSchema),
  authController.register
);

router.post(
  '/login',
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
  validate(authValidation.verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
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
