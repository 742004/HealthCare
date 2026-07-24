import { Router } from 'express';
import { emergencyController } from '../controllers/emergency.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as emergencyValidation from '../validations/emergency.validation.js';

const router = Router();

// Protect all emergency routes
router.use(authenticate);

/**
 * ============================================================================
 * PATIENT ROUTES
 * ============================================================================
 */
router.post(
  '/',
  authorize('PATIENT'),
  validate(emergencyValidation.createEmergencySchema),
  emergencyController.createEmergency
);

router.get(
  '/history',
  authorize('PATIENT'),
  emergencyController.viewEmergencyHistory
);

router.get(
  '/:id',
  authorize('PATIENT', 'ADMIN'),
  validate(emergencyValidation.getEmergencySchema),
  emergencyController.getCurrentEmergency
);

router.get(
  '/:id/status',
  authorize('PATIENT', 'HOSPITAL', 'AMBULANCE', 'ADMIN'),
  emergencyController.getEmergencyStatus
);

router.get(
  '/:id/track',
  authorize('PATIENT', 'HOSPITAL', 'ADMIN'),
  emergencyController.trackEmergency
);

router.post(
  '/:id/cancel',
  authorize('PATIENT'),
  emergencyController.cancelEmergency
);

/**
 * ============================================================================
 * HOSPITAL ROUTES
 * ============================================================================
 */
router.post(
  '/:id/accept',
  authorize('HOSPITAL'),
  emergencyController.acceptEmergencyHospital
);

router.post(
  '/:id/reject',
  authorize('HOSPITAL'),
  validate(emergencyValidation.rejectEmergencySchema),
  emergencyController.rejectEmergencyHospital
);

/**
 * ============================================================================
 * AMBULANCE ROUTES
 * ============================================================================
 */
router.post(
  '/:id/ambulance/accept',
  authorize('AMBULANCE'),
  emergencyController.acceptDispatchAmbulance
);

router.post(
  '/:id/start',
  authorize('AMBULANCE'),
  emergencyController.startTripAmbulance
);

router.post(
  '/:id/reach-patient',
  authorize('AMBULANCE'),
  emergencyController.reachPatientAmbulance
);

router.post(
  '/:id/transport',
  authorize('AMBULANCE'),
  emergencyController.transportPatientAmbulance
);

router.post(
  '/:id/complete',
  authorize('AMBULANCE'),
  emergencyController.completeEmergency
);

/**
 * ============================================================================
 * ADMIN / SYSTEM ROUTES
 * ============================================================================
 */
router.patch(
  '/:id/assign-hospital',
  authorize('ADMIN'),
  validate(emergencyValidation.assignHospitalSchema),
  emergencyController.assignHospitalAdmin
);

router.patch(
  '/:id/assign-ambulance',
  authorize('ADMIN'),
  validate(emergencyValidation.assignAmbulanceSchema),
  emergencyController.assignAmbulanceAdmin
);

router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(emergencyValidation.updateStatusSchema),
  emergencyController.updateEmergencyStatus
);

export default router;
