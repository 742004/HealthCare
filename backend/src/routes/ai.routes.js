import express from 'express';
import aiController from '../controllers/ai.controller.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { aiValidation } from '../validations/ai.validation.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import aiRateLimit from '../middleware/aiRateLimit.js';

/**
 * AI Routes
 * 
 * Defines endpoints for all AI-powered functionality.
 * Protects endpoints with rate limiting, authentication, and Zod validation.
 */
const router = express.Router();

// Apply global rate limiting for AI routes to prevent API abuse
router.use(aiRateLimit);
// Require authentication for all AI routes
router.use(authenticate);

router.post(
  '/chat',
  authorize('PATIENT', 'ADMIN', 'DOCTOR', 'HOSPITAL', 'AMBULANCE'),
  validateRequest(aiValidation.chatSchema),
  aiController.chat
);

router.post(
  '/triage',
  authorize('PATIENT', 'ADMIN', 'DOCTOR', 'HOSPITAL', 'AMBULANCE'),
  validateRequest(aiValidation.triageSchema),
  aiController.triageEmergency
);

router.post(
  '/hospital',
  authorize('ADMIN', 'DOCTOR', 'HOSPITAL', 'AMBULANCE'),
  validateRequest(aiValidation.hospitalSchema),
  aiController.recommendHospital
);

router.post(
  '/doctor',
  authorize('ADMIN', 'DOCTOR', 'HOSPITAL', 'PATIENT'),
  validateRequest(aiValidation.doctorSchema),
  aiController.recommendDoctor
);

router.post(
  '/summary',
  authorize('ADMIN', 'DOCTOR', 'HOSPITAL'),
  validateRequest(aiValidation.summarySchema),
  aiController.summarizeMedicalRecord
);

router.post(
  '/report',
  authorize('ADMIN', 'HOSPITAL', 'AMBULANCE'),
  validateRequest(aiValidation.reportSchema),
  aiController.generateEmergencyReport
);

export default router;
